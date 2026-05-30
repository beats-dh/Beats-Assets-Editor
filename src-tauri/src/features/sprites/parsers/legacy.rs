use std::fs::File;
use std::io::{Cursor, Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{anyhow, Context, Result};
use byteorder::{LittleEndian, ReadBytesExt};
use dashmap::DashMap;

use super::TibiaSprite;

const LEGACY_SIGNATURE: u32 = 0x59E48E02;
const LEGACY_SPRITE_WIDTH: u32 = 32;
const LEGACY_SPRITE_HEIGHT: u32 = 32;

/// Represents a legacy `.spr` file (OTC/Tibia < 12) with its offset table and ID range.
#[derive(Debug, Clone)]
pub struct LegacySpriteSheet {
    pub path: PathBuf,
    pub start_id: u32,
    pub end_id: u32,
    offsets: Arc<Vec<u32>>, // Arc so multiple loaders can share without clone cost
}

impl LegacySpriteSheet {
    pub fn load_with_start_id<P: AsRef<Path>>(path: P, start_id: u32) -> Result<Self> {
        let path = path.as_ref().to_path_buf();
        let mut file = File::open(&path).context("Failed to open legacy sprite file")?;

        let signature = file.read_u32::<LittleEndian>().context("Failed to read legacy signature")?;
        if signature != LEGACY_SIGNATURE {
            return Err(anyhow!("Invalid legacy sprite signature in {:?}: expected 0x{:X}, got 0x{:X}", path, LEGACY_SIGNATURE, signature));
        }

        let sprite_count = file.read_u32::<LittleEndian>().context("Failed to read legacy sprite count")?;

        // Skip 16 reserved bytes
        let mut reserved = [0u8; 16];
        file.read_exact(&mut reserved).context("Failed to read legacy reserved header")?;

        let mut offsets: Vec<u32> = Vec::with_capacity(sprite_count as usize);
        for _ in 0..sprite_count {
            offsets.push(file.read_u32::<LittleEndian>().context("Failed to read sprite offset")?);
        }

        let end_id = start_id.checked_add(sprite_count).and_then(|v| v.checked_sub(1)).ok_or_else(|| anyhow!("Sprite ID range overflow for {:?}", path))?;

        Ok(Self {
            path,
            start_id,
            end_id,
            offsets: Arc::new(offsets),
        })
    }

    #[inline]
    pub fn contains_id(&self, sprite_id: u32) -> bool {
        sprite_id >= self.start_id && sprite_id <= self.end_id
    }

    #[inline]
    fn local_index(&self, sprite_id: u32) -> usize {
        (sprite_id - self.start_id) as usize
    }
}

/// Loader for legacy `.spr` files that produces RGBA sprites.
pub struct LegacySpriteLoader {
    sheets: Vec<LegacySpriteSheet>,
    sprite_cache: DashMap<u32, Arc<TibiaSprite>>, // sprite_id -> sprite
    file_cache: DashMap<PathBuf, Arc<Vec<u8>>>,   // file bytes cached per sheet
}

impl LegacySpriteLoader {
    pub fn new_from_files(files: Vec<PathBuf>) -> Result<Self> {
        if files.is_empty() {
            return Err(anyhow!("No legacy sprite files provided"));
        }

        // Sort by detected numeric suffix so Tibia1.spr, Tibia2.spr, ... preserves order
        let mut sorted_files = files;
        sorted_files.sort_by_key(|p| extract_numeric_suffix(p).unwrap_or(u32::MAX));

        let mut sheets = Vec::with_capacity(sorted_files.len());
        let mut current_start_id = 1u32;
        for path in sorted_files {
            let sheet = LegacySpriteSheet::load_with_start_id(&path, current_start_id)?;
            current_start_id = sheet.end_id.checked_add(1).ok_or_else(|| anyhow!("Sprite ID overflow while chaining legacy sprite sheets"))?;
            sheets.push(sheet);
        }

        Ok(Self {
            sheets,
            sprite_cache: DashMap::new(),
            file_cache: DashMap::new(),
        })
    }

    #[inline]
    pub fn sprite_count(&self) -> usize {
        self.sheets.last().map(|s| s.end_id as usize).unwrap_or(0)
    }

    #[inline]
    pub fn get_all_sprite_ids(&self) -> Vec<u32> {
        let total = self.sprite_count();
        (1..=total as u32).collect()
    }

    pub fn get_sprite(&self, sprite_id: u32) -> Result<TibiaSprite> {
        if let Some(sprite) = self.sprite_cache.get(&sprite_id) {
            return Ok((*sprite).as_ref().clone());
        }

        let sheet = self.sheets.iter().find(|s| s.contains_id(sprite_id)).ok_or_else(|| anyhow!("Sprite ID {} not found in legacy sheets", sprite_id))?;

        let file_bytes = self.load_file_bytes(&sheet.path)?;
        let local_index = sheet.local_index(sprite_id);
        let offset = sheet.offsets.get(local_index).copied().ok_or_else(|| anyhow!("Offset not found for sprite {} in {:?}", sprite_id, sheet.path))?;

        let sprite = self.decode_sprite(sprite_id, offset, &file_bytes)?;
        let arc = Arc::new(sprite);
        self.sprite_cache.insert(sprite_id, arc.clone());
        Ok((*arc).clone())
    }

    fn load_file_bytes(&self, path: &Path) -> Result<Arc<Vec<u8>>> {
        if let Some(bytes) = self.file_cache.get(path) {
            return Ok(bytes.clone());
        }

        let data = std::fs::read(path).context(format!("Failed to read sprite file {:?}", path))?;
        let arc = Arc::new(data);
        self.file_cache.insert(path.to_path_buf(), arc.clone());
        Ok(arc)
    }

    fn decode_sprite(&self, sprite_id: u32, offset: u32, file_bytes: &[u8]) -> Result<TibiaSprite> {
        if offset == 0 {
            return Ok(TibiaSprite {
                id: sprite_id,
                width: LEGACY_SPRITE_WIDTH,
                height: LEGACY_SPRITE_HEIGHT,
                data: Arc::new(vec![0u8; (LEGACY_SPRITE_WIDTH * LEGACY_SPRITE_HEIGHT * 4) as usize]),
            });
        }

        if (offset as usize) >= file_bytes.len() {
            return Err(anyhow!("Sprite offset {} out of bounds for sprite {}", offset, sprite_id));
        }

        let mut cursor = Cursor::new(file_bytes);
        cursor.seek(SeekFrom::Start(offset as u64)).context("Failed to seek to sprite offset")?;

        let data_size = cursor.read_u16::<LittleEndian>().context("Failed to read sprite data size")? as usize;

        let mut output = vec![0u8; (LEGACY_SPRITE_WIDTH * LEGACY_SPRITE_HEIGHT * 4) as usize];

        if data_size == 0 {
            return Ok(TibiaSprite {
                id: sprite_id,
                width: LEGACY_SPRITE_WIDTH,
                height: LEGACY_SPRITE_HEIGHT,
                data: Arc::new(output),
            });
        }

        let start_pos = cursor.position();
        let mut pixel_index: usize = 0; // counts pixels written/advanced

        while (cursor.position() - start_pos) < data_size as u64 {
            let transparent_pixels = cursor.read_u16::<LittleEndian>().context("Failed to read transparent pixel count")? as usize;
            let colored_pixels = cursor.read_u16::<LittleEndian>().context("Failed to read colored pixel count")? as usize;

            pixel_index = pixel_index.checked_add(transparent_pixels).ok_or_else(|| anyhow!("Overflow while skipping transparent pixels"))?;

            for _ in 0..colored_pixels {
                let blue = cursor.read_u8().context("Failed to read blue channel")?;
                let green = cursor.read_u8().context("Failed to read green channel")?;
                let red = cursor.read_u8().context("Failed to read red channel")?;

                if pixel_index < (LEGACY_SPRITE_WIDTH * LEGACY_SPRITE_HEIGHT) as usize {
                    let base = pixel_index * 4;
                    output[base] = red;
                    output[base + 1] = green;
                    output[base + 2] = blue;
                    output[base + 3] = 0xFF;
                }
                pixel_index += 1;
            }
        }

        Ok(TibiaSprite {
            id: sprite_id,
            width: LEGACY_SPRITE_WIDTH,
            height: LEGACY_SPRITE_HEIGHT,
            data: Arc::new(output),
        })
    }
}

fn extract_numeric_suffix(path: &Path) -> Option<u32> {
    let stem = path.file_stem()?.to_string_lossy();
    // Only the trailing run of digits, so "Sprite2Test456" -> 456 (not "2456").
    let digits: String = stem.chars().rev().take_while(|c| c.is_ascii_digit()).collect::<Vec<_>>().into_iter().rev().collect();
    if digits.is_empty() {
        None
    } else {
        digits.parse::<u32>().ok()
    }
}
