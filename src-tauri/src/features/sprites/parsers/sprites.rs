use anyhow::{anyhow, Context, Result};
use image::{DynamicImage, ImageBuffer, Rgba};
use std::collections::HashMap;
use std::fs;
use std::io::Cursor;
use std::path::Path;
use std::sync::Arc;

use rayon::prelude::*;

use dashmap::DashMap;
use serde::{Deserialize, Serialize};

/// Represents a sprite from Tibia
/// Uses Arc for zero-copy sharing of sprite data
#[derive(Debug, Clone)]
pub struct TibiaSprite {
    pub id: u32,
    pub width: u32,
    pub height: u32,
    pub data: Arc<Vec<u8>>, // Arc for efficient sharing without cloning
}

impl TibiaSprite {
    /// Convert sprite data to an image
    /// Inline for hot-path performance
    #[inline]
    pub fn to_image(&self) -> Result<DynamicImage> {
        let data_clone = (*self.data).clone();
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_raw(self.width, self.height, data_clone).ok_or_else(|| anyhow!("Failed to create image from sprite data"))?;

        Ok(DynamicImage::ImageRgba8(img))
    }

    /// Convert sprite to raw PNG bytes
    #[inline]
    pub fn to_png_bytes(&self) -> Result<Vec<u8>> {
        let img = self.to_image()?;
        // Pre-allocate buffer with estimated size (PNG typically ~1.5x raw RGBA)
        let estimated_size = (self.width * self.height * 4 * 3 / 2) as usize;
        let mut buffer = Vec::with_capacity(estimated_size);
        let mut cursor = Cursor::new(&mut buffer);

        img.write_to(&mut cursor, image::ImageFormat::Png).context("Failed to encode sprite as PNG")?;

        Ok(buffer)
    }
}

/// Sprite catalog entry from catalog-content.json
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SpriteCatalogEntry {
    #[serde(rename = "type")]
    pub entry_type: String,
    pub file: String,
    #[serde(rename = "spritetype")]
    pub sprite_type: Option<u32>,
    #[serde(rename = "firstspriteid")]
    pub first_sprite_id: Option<u32>,
    #[serde(rename = "lastspriteid")]
    pub last_sprite_id: Option<u32>,
    pub area: Option<u32>,
}

/// Sprite catalog that maps sprite IDs to LZMA files
#[derive(Debug)]
pub struct SpriteCatalog {
    entries: Vec<SpriteCatalogEntry>,
    sprite_map: HashMap<u32, usize>, // sprite_id -> entry index
}

impl SpriteCatalog {
    /// Load sprite catalog from catalog-content.json
    pub fn load<P: AsRef<Path>>(catalog_path: P) -> Result<Self> {
        let catalog_path = catalog_path.as_ref();
        log::info!("Loading sprite catalog: {:?}", catalog_path);

        let catalog_data = fs::read_to_string(catalog_path).context(format!("Failed to read catalog file: {:?}", catalog_path))?;

        let entries: Vec<SpriteCatalogEntry> = serde_json::from_str(&catalog_data).context("Failed to parse catalog JSON")?;

        // Filter only sprite entries and build sprite map
        let sprite_entries: Vec<SpriteCatalogEntry> = entries.into_iter().filter(|entry| entry.entry_type == "sprite").collect();

        // Pre-allocate HashMap with estimated capacity
        let estimated_sprites: usize = sprite_entries
            .iter()
            .map(|e| {
                if let (Some(first), Some(last)) = (e.first_sprite_id, e.last_sprite_id) {
                    (last - first + 1) as usize
                } else {
                    0
                }
            })
            .sum();

        let mut sprite_map = HashMap::with_capacity(estimated_sprites);
        for (index, entry) in sprite_entries.iter().enumerate() {
            if let (Some(first_id), Some(last_id)) = (entry.first_sprite_id, entry.last_sprite_id) {
                for sprite_id in first_id..=last_id {
                    sprite_map.insert(sprite_id, index);
                }
            }
        }

        Ok(SpriteCatalog {
            entries: sprite_entries,
            sprite_map,
        })
    }

    /// Get the catalog entry for a specific sprite ID
    #[inline]
    pub fn get_entry_for_sprite(&self, sprite_id: u32) -> Option<&SpriteCatalogEntry> {
        self.sprite_map.get(&sprite_id).and_then(|&index| self.entries.get(index))
    }

    /// Get all sprite IDs available in the catalog
    pub fn get_all_sprite_ids(&self) -> Vec<u32> {
        let mut ids: Vec<u32> = self.sprite_map.keys().copied().collect();
        ids.par_sort_unstable();
        ids
    }

    /// Get the total number of sprites
    #[inline]
    pub fn sprite_count(&self) -> usize {
        self.sprite_map.len()
    }
}

/// LZMA sprite loader for Tibia 12+
/// Uses DashMap for lock-free concurrent caching
pub struct SpriteLoader {
    catalog: SpriteCatalog,
    assets_dir: std::path::PathBuf,
    sprite_cache: DashMap<String, Arc<Vec<TibiaSprite>>>, // Lock-free cache: filename -> sprites
}

impl SpriteLoader {
    /// Create a new sprite loader with catalog and assets directory
    pub fn new<P: AsRef<Path>>(catalog_path: P, assets_dir: P) -> Result<Self> {
        let catalog = SpriteCatalog::load(catalog_path)?;
        let assets_dir = assets_dir.as_ref().to_path_buf();

        Ok(SpriteLoader {
            catalog,
            assets_dir,
            sprite_cache: DashMap::new(),
        })
    }

    /// Get sprite by ID (lock-free implementation)
    #[inline]
    pub fn get_sprite(&self, sprite_id: u32) -> Result<TibiaSprite> {
        let entry = self.catalog.get_entry_for_sprite(sprite_id).ok_or_else(|| anyhow!("Sprite ID {} not found in catalog", sprite_id))?;

        // Load sprite sheet if not cached (lock-free check and insert)
        if !self.sprite_cache.contains_key(&entry.file) {
            let sprites = self.load_sprite_sheet_for_entry(entry)?;
            let sprites_arc = Arc::new(sprites);
            // entry() provides lock-free insert-if-absent
            self.sprite_cache.entry(entry.file.clone()).or_insert(sprites_arc);
        }

        // Find sprite in the loaded sheet (lock-free read)
        let sprites_arc = self.sprite_cache.get(&entry.file).ok_or_else(|| anyhow!("Sprite sheet {} not loaded in cache", entry.file))?;
        let first_id = entry.first_sprite_id.unwrap_or(0);
        let sprite_index = (sprite_id - first_id) as usize;

        sprites_arc.get(sprite_index).cloned().ok_or_else(|| anyhow!("Sprite {} not found in sheet {}", sprite_id, entry.file))
    }

    /// Load an entire sprite sheet from LZMA file using entry context
    fn load_sprite_sheet_for_entry(&self, entry: &SpriteCatalogEntry) -> Result<Vec<TibiaSprite>> {
        let file_path = self.assets_dir.join(&entry.file);

        let compressed_data = fs::read(&file_path).context(format!("Failed to read sprite file: {:?}", file_path))?;

        // Decompress LZMA data
        let bitmap_data = self.decompress_lzma(&compressed_data)?;

        // Decodificar BMP com image crate, como o .NET faz
        let dyn_img = image::load_from_memory_with_format(&bitmap_data, image::ImageFormat::Bmp).context("Falha ao decodificar BMP da folha de sprites")?;
        let rgba_img = dyn_img.to_rgba8();
        let (width, height) = rgba_img.dimensions();
        let sheet_data = rgba_img.into_raw(); // RGBA top-down

        // Inferir tamanho do sprite pela contagem do catálogo e dimensões da imagem
        let first_id = entry.first_sprite_id.unwrap_or(0);
        let last_id = entry.last_sprite_id.unwrap_or(first_id);
        let total_count = (last_id - first_id + 1) as u32;
        if total_count == 0 {
            return Err(anyhow!("Catálogo inválido: contagem de sprites é zero para {}", entry.file));
        }
        // Definir dimensões do tile com base no spritetype (quando disponível) ou inferência pelo área
        let (tile_width, tile_height) = if let Some(t) = entry.sprite_type {
            match t {
                0 => (32, 32),
                1 => (32, 64),
                2 => (64, 32),
                _ => (64, 64),
            }
        } else {
            let tile_area = (width * height) / total_count; // 1024 => 32x32, 2048 => 32x64/64x32, 4096 => 64x64
            match tile_area {
                1024 => (32, 32),
                2048 => {
                    // Orientação: escolher a que divide igualmente largura/altura
                    if width % 32 == 0 && height % 64 == 0 {
                        (32, 64)
                    } else {
                        (64, 32)
                    }
                }
                4096 => (64, 64),
                _ => {
                    // Fallback: tentar 64/32 conforme múltiplos da folha
                    let tw = if width % 64 == 0 {
                        64
                    } else {
                        32
                    };
                    let th = if height % 64 == 0 {
                        64
                    } else {
                        32
                    };
                    (tw, th)
                }
            }
        };

        self.parse_sprite_sheet_from_rgba(&sheet_data, width, height, tile_width, tile_height)
    }

    /// Decompress LZMA data with CipSoft's custom header
    fn decompress_lzma(&self, data: &[u8]) -> Result<Vec<u8>> {
        if data.len() < 32 {
            return Err(anyhow!("LZMA file too small"));
        }

        // Skip leading zeros (padding)
        let mut offset = 0usize;
        while offset < data.len() && data[offset] == 0 {
            offset += 1;
        }
        if offset >= data.len() {
            return Err(anyhow!("Arquivo contém apenas zeros"));
        }

        // CIP header: first non-zero byte + next 4 bytes constant (total 5 bytes)
        if offset + 5 > data.len() {
            return Err(anyhow!("Cabeçalho CIP incompleto (constante)"));
        }
        offset += 5; // skip 0x70 and next 4 bytes (0x0A FA 80 24)

        // Skip 7-bit encoded LZMA size (we don't need its value)
        while offset < data.len() {
            let b = data[offset];
            offset += 1;
            // MSB=1 means more bytes
            if (b & 0x80) == 0 {
                break;
            }
        }
        if offset >= data.len() {
            return Err(anyhow!("Cabeçalho CIP incompleto (tamanho 7-bit)"));
        }

        // Now at LZMA header: 5 bytes properties + 8 bytes size (CIP writes compressed size)
        let lzma_data = &data[offset..];
        if lzma_data.len() < 13 {
            return Err(anyhow!("LZMA header/data muito curto"));
        }

        // Use our custom LZMA module which corrects the 8-byte size to unknown
        match crate::core::lzma::decompress(lzma_data) {
            Ok(decompressed) => Ok(decompressed),
            Err(e) => {
                log::error!("Falha na descompressão LZMA após cabeçalho CIP (offset {}): {}", offset, e);
                // Fallback: try original data (some files may have no CIP header/padding)
                crate::core::lzma::decompress(data).map_err(|e2| anyhow!("Falha ao descomprimir LZMA: {}", e2))
            }
        }
    }

    /// Parse sprite sheet from RGBA buffer and extract individual sprites
    #[inline]
    fn parse_sprite_sheet_from_rgba(&self, sheet_data: &[u8], width: u32, height: u32, tile_width: u32, tile_height: u32) -> Result<Vec<TibiaSprite>> {
        let bytes_per_pixel = 4usize; // RGBA
        let stride = (width * 4) as usize;

        // Calcular número de sprites
        let sprites_per_row = width / tile_width;
        let sprite_rows = height / tile_height;
        let total_sprites = (sprites_per_row * sprite_rows) as usize;

        let sprites: Vec<TibiaSprite> = (0..total_sprites)
            .into_par_iter()
            .map(|sprite_index| {
                let sprite_index = sprite_index as u32;
                let row = sprite_index / sprites_per_row;
                let col = sprite_index % sprites_per_row;

                self.extract_sprite_from_sheet_rgba(sheet_data, col * tile_width, row * tile_height, tile_width, tile_height, sprite_index, bytes_per_pixel, stride)
            })
            .collect::<Result<Vec<_>>>()?;

        Ok(sprites)
    }

    /// Extract a single sprite from the sprite sheet
    /// Optimized with unsafe for performance-critical pixel copying
    /// OPTIMIZATION: Pre-allocate with exact size to avoid reallocations
    #[inline]
    fn extract_sprite_from_sheet_rgba(
        &self,
        sheet_data: &[u8],
        start_x: u32,
        start_y: u32,
        tile_width: u32,
        tile_height: u32,
        sprite_id: u32,
        bytes_per_pixel: usize,
        stride: usize,
    ) -> Result<TibiaSprite> {
        // OPTIMIZATION: Pre-allocate with exact size (tile_width * tile_height * 4 bytes RGBA)
        let capacity = (tile_width * tile_height * 4) as usize;
        let mut sprite_data: Vec<u8> = Vec::with_capacity(capacity);
        unsafe {
            // Set length to capacity to avoid bounds checks in the loop
            sprite_data.set_len(capacity);
        }

        // OPTIMIZATION: Optimized pixel extraction with pre-allocated buffer
        let mut dst_offset = 0;
        for y in 0..tile_height {
            let row_offset = ((start_y + y) as usize) * stride;
            let row_start_x = (start_x as usize) * bytes_per_pixel;
            let src_offset = row_offset + row_start_x;
            let row_len = (tile_width as usize) * bytes_per_pixel;

            // Bounds check once per row, then use unsafe for speed
            if src_offset + row_len <= sheet_data.len() && dst_offset + row_len <= sprite_data.len() {
                // Safe: we verified bounds above and buffer is pre-allocated
                unsafe {
                    let src_ptr = sheet_data.as_ptr().add(src_offset);
                    let dst_ptr = sprite_data.as_mut_ptr().add(dst_offset);
                    std::ptr::copy_nonoverlapping(src_ptr, dst_ptr, row_len);
                }
                dst_offset += row_len;
            } else {
                // Fallback: copy available bytes + pad with zeros
                for x in 0..tile_width {
                    let pixel_offset = row_offset + (((start_x + x) as usize) * bytes_per_pixel);
                    if pixel_offset + 3 < sheet_data.len() && dst_offset + 4 <= sprite_data.len() {
                        unsafe {
                            let src_ptr = sheet_data.as_ptr().add(pixel_offset);
                            let dst_ptr = sprite_data.as_mut_ptr().add(dst_offset);
                            std::ptr::copy_nonoverlapping(src_ptr, dst_ptr, 4);
                        }
                        dst_offset += 4;
                    } else if dst_offset + 4 <= sprite_data.len() {
                        unsafe {
                            let dst_ptr = sprite_data.as_mut_ptr().add(dst_offset);
                            std::ptr::write_bytes(dst_ptr, 0, 4);
                        }
                        dst_offset += 4;
                    }
                }
            }
        }

        // Ensure length is correct (in case of fallback path)
        unsafe {
            sprite_data.set_len(dst_offset);
        }

        Ok(TibiaSprite {
            id: sprite_id,
            width: tile_width,
            height: tile_height,
            data: Arc::new(sprite_data),
        })
    }

    /// Get the total number of sprites available
    #[inline]
    pub fn sprite_count(&self) -> usize {
        self.catalog.sprite_count()
    }

    /// Get all available sprite IDs
    #[inline]
    pub fn get_all_sprite_ids(&self) -> Vec<u32> {
        self.catalog.get_all_sprite_ids()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // Only run with actual files
    fn test_load_sprite_catalog() {
        let catalog = SpriteCatalog::load("catalog-content.json").unwrap();
        assert!(catalog.sprite_count() > 0);
    }

    #[test]
    #[ignore] // Only run with actual files
    fn test_load_sprites() {
        let mut loader = SpriteLoader::new("catalog-content.json", ".").unwrap();
        let sprite = loader.get_sprite(1).unwrap();
        assert_eq!(sprite.width, 32);
        assert_eq!(sprite.height, 32);
    }
}
