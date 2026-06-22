//! F2 — sprite import & catalog write.
//!
//! - `import_image_as_tiles`: slice a PNG/BMP into tiles (with optional magenta
//!   chroma-key) and register each as an imported sprite (in memory).
//! - `compile_imported_sprites`: pack the imported sprites into a Tibia
//!   spritesheet (`RGBA → BMP → LZMA → .cwm` with the CIP header) and append it
//!   to `catalog-content.json` (with a `.bak` backup).
//!
//! Format handling is covered by `sprite_sheet_roundtrip_through_loader`, which
//! writes a sheet and reads it back through the real `SpriteLoader`. NOTE: that
//! verifies OUR reader/writer agree; whether the live Tibia client accepts the
//! written `.cwm` must still be confirmed in the running app on real assets.

use crate::core::lzma;
use crate::features::sprites::parsers::SpriteCatalogEntry;
use crate::state::AppState;
use ahash::AHasher;
use image::{DynamicImage, ImageBuffer, ImageFormat, Rgba};
use serde::Serialize;
use std::hash::{Hash, Hasher};
use std::io::Cursor;
use std::path::Path;
use tauri::State;

const DEFAULT_TILE: u32 = 32;
const MAGENTA: [u8; 3] = [0xFF, 0x00, 0xFF];
const MAX_TILES: u32 = 10_000;
const DEFAULT_COLS: u32 = 12;

fn parse_hex_rgb(hex: &str) -> Option<[u8; 3]> {
    let s = hex.trim().trim_start_matches('#');
    if s.len() != 6 {
        return None;
    }
    let r = u8::from_str_radix(&s[0..2], 16).ok()?;
    let g = u8::from_str_radix(&s[2..4], 16).ok()?;
    let b = u8::from_str_radix(&s[4..6], 16).ok()?;
    Some([r, g, b])
}

/// Allocates the next imported sprite id from the shared counter (same Mutex the
/// AEC import uses, so the two stay coordinated). Ids start above the highest
/// catalog sprite id so they never collide with official sprites.
fn next_imported_sprite_id(state: &AppState) -> Result<u32, String> {
    let mut next_id = state.imported_sprite_next_id.lock();
    if next_id.is_none() {
        let base = state.sprite_loader.read().as_ref().map(|loader| loader.get_all_sprite_ids().last().copied().unwrap_or(0)).unwrap_or(1_000_000);
        *next_id = Some(base.saturating_add(1));
    }
    let start = next_id.unwrap_or(0);
    let end = start.checked_add(1).ok_or_else(|| "Imported sprite ID overflow".to_string())?;
    *next_id = Some(end);
    Ok(start)
}

/// Slices an image into `tile_width`x`tile_height` tiles (row-major), optionally
/// turning the chroma-key color transparent, and registers each as an imported
/// sprite. Returns the new sprite ids in row-major order.
#[tauri::command]
pub async fn import_image_as_tiles(
    file_path: String,
    tile_width: Option<u32>,
    tile_height: Option<u32>,
    chroma_key_enabled: bool,
    chroma_key_color: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<u32>, String> {
    let tw = tile_width.unwrap_or(DEFAULT_TILE).max(1);
    let th = tile_height.unwrap_or(DEFAULT_TILE).max(1);
    let key = chroma_key_color.as_deref().and_then(parse_hex_rgb).unwrap_or(MAGENTA);

    let img = image::open(&file_path).map_err(|e| format!("Failed to open image {}: {}", file_path, e))?;
    let rgba = img.to_rgba8();
    let (w, h) = rgba.dimensions();
    if w < tw || h < th {
        return Err(format!("Image {}x{} is smaller than one tile {}x{}", w, h, tw, th));
    }
    let cols = w / tw;
    let rows = h / th;
    if cols * rows > MAX_TILES {
        return Err(format!("Too many tiles ({}); maximum is {}", cols * rows, MAX_TILES));
    }

    let mut ids = Vec::with_capacity((cols * rows) as usize);
    for row in 0..rows {
        for col in 0..cols {
            let mut tile: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(tw, th);
            for y in 0..th {
                for x in 0..tw {
                    let mut p = *rgba.get_pixel(col * tw + x, row * th + y);
                    if chroma_key_enabled && p[0] == key[0] && p[1] == key[1] && p[2] == key[2] {
                        p = Rgba([0, 0, 0, 0]);
                    }
                    tile.put_pixel(x, y, p);
                }
            }

            let mut png = Vec::new();
            DynamicImage::ImageRgba8(tile).write_to(&mut Cursor::new(&mut png), ImageFormat::Png).map_err(|e| format!("Failed to encode tile: {}", e))?;

            let mut hasher = AHasher::default();
            png.hash(&mut hasher);
            let hash = hasher.finish();
            if let Some(existing) = state.imported_sprite_hashes.get(&hash) {
                ids.push(*existing.value());
                continue;
            }
            let id = next_imported_sprite_id(&state)?;
            state.imported_sprites.insert(id, png);
            state.imported_sprite_hashes.insert(hash, id);
            ids.push(id);
        }
    }

    Ok(ids)
}

/// Encodes `n` as a 7-bit little-endian varint (the CIP "size" field, which the
/// reader skips without interpreting).
fn encode_7bit(mut n: u64) -> Vec<u8> {
    let mut out = Vec::new();
    loop {
        let mut b = (n & 0x7f) as u8;
        n >>= 7;
        if n != 0 {
            b |= 0x80;
        }
        out.push(b);
        if n == 0 {
            break;
        }
    }
    out
}

/// Wraps a plain LZMA stream with the CIP header the sprite loader expects:
/// `0x70 0x0A 0xFA 0x80 0x24` + 7-bit size + LZMA.
fn wrap_cip_lzma(lzma: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(lzma.len() + 16);
    out.extend_from_slice(&[0x70, 0x0A, 0xFA, 0x80, 0x24]);
    out.extend_from_slice(&encode_7bit(lzma.len() as u64));
    out.extend_from_slice(lzma);
    out
}

/// Builds a row-major RGBA spritesheet from tile buffers (each `tile_w*tile_h*4`
/// RGBA bytes), padding the last row with transparent tiles, and encodes it as a
/// BMP. Returns `(bmp_bytes, cols, rows)`.
fn build_sheet_bmp(tiles: &[Vec<u8>], tile_w: u32, tile_h: u32, cols: u32) -> Result<(Vec<u8>, u32, u32), String> {
    let cols = cols.max(1);
    let n = tiles.len() as u32;
    let rows = n.div_ceil(cols).max(1);
    let sheet_w = cols * tile_w;
    let sheet_h = rows * tile_h;

    let mut sheet: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(sheet_w, sheet_h);
    for (i, tile) in tiles.iter().enumerate() {
        let i = i as u32;
        let ox = (i % cols) * tile_w;
        let oy = (i / cols) * tile_h;
        for y in 0..tile_h {
            for x in 0..tile_w {
                let idx = ((y * tile_w + x) * 4) as usize;
                if idx + 3 < tile.len() {
                    sheet.put_pixel(ox + x, oy + y, Rgba([tile[idx], tile[idx + 1], tile[idx + 2], tile[idx + 3]]));
                }
            }
        }
    }

    let mut bmp = Vec::new();
    DynamicImage::ImageRgba8(sheet).write_to(&mut Cursor::new(&mut bmp), ImageFormat::Bmp).map_err(|e| format!("Failed to encode BMP: {}", e))?;
    Ok((bmp, cols, rows))
}

#[derive(Serialize)]
pub struct CompileResult {
    pub sheet_file: String,
    pub first_sprite_id: u32,
    pub last_sprite_id: u32,
    pub sprites_compiled: usize,
    /// `(imported_id, new_catalog_id)` pairs.
    pub remap: Vec<(u32, u32)>,
}

/// Packs all currently imported sprites into a single 32x32 spritesheet, writes
/// it next to the catalog as `custom_imported_<firstid>.cwm`, appends a catalog
/// entry (backing up `catalog-content.json` to `.bak` first), and remaps in-memory
/// appearance sprite references from imported ids to the new catalog ids.
///
/// Destructive (writes to the user's assets). Verify in the running app before
/// trusting on production assets.
#[tauri::command]
pub async fn compile_imported_sprites(assets_dir: String, catalog_path: String, state: State<'_, AppState>) -> Result<CompileResult, String> {
    // Snapshot imported sprites, sorted by id for a stable layout.
    let mut items: Vec<(u32, Vec<u8>)> = state.imported_sprites.iter().map(|e| (*e.key(), e.value().clone())).collect();
    items.sort_by_key(|(id, _)| *id);
    if items.is_empty() {
        return Err("No imported sprites to compile".to_string());
    }

    // Decode each imported PNG to a 32x32 RGBA tile.
    let mut tiles: Vec<Vec<u8>> = Vec::with_capacity(items.len());
    for (id, png) in &items {
        let img = image::load_from_memory(png).map_err(|e| format!("Failed to decode imported sprite {}: {}", id, e))?;
        let rgba = img.to_rgba8();
        if rgba.width() != DEFAULT_TILE || rgba.height() != DEFAULT_TILE {
            return Err(format!("Imported sprite {} is {}x{}, expected {}x{}", id, rgba.width(), rgba.height(), DEFAULT_TILE, DEFAULT_TILE));
        }
        tiles.push(rgba.into_raw());
    }

    let (bmp, cols, rows) = build_sheet_bmp(&tiles, DEFAULT_TILE, DEFAULT_TILE, DEFAULT_COLS)?;
    let lzma = lzma::compress(&bmp).map_err(|e| format!("Failed to LZMA-compress sheet: {}", e))?;
    let cwm = wrap_cip_lzma(&lzma);

    // Load the catalog, find the next free id range.
    let catalog_text = std::fs::read_to_string(&catalog_path).map_err(|e| format!("Failed to read catalog {}: {}", catalog_path, e))?;
    let mut entries: Vec<SpriteCatalogEntry> = serde_json::from_str(&catalog_text).map_err(|e| format!("Failed to parse catalog: {}", e))?;
    let max_id = entries.iter().filter_map(|e| e.last_sprite_id).max().unwrap_or(0);

    let first = max_id.checked_add(1).ok_or_else(|| "Sprite id overflow".to_string())?;
    let total = cols * rows;
    let last = first + total - 1;
    let filename = format!("custom_imported_{}.cwm", first);

    // Backup the catalog, then write the sheet and the updated catalog.
    let _ = std::fs::copy(&catalog_path, format!("{}.bak", catalog_path));
    std::fs::write(Path::new(&assets_dir).join(&filename), &cwm).map_err(|e| format!("Failed to write sheet: {}", e))?;

    entries.push(SpriteCatalogEntry {
        entry_type: "sprite".to_string(),
        file: filename.clone(),
        sprite_type: Some(0),
        first_sprite_id: Some(first),
        last_sprite_id: Some(last),
        area: None,
    });
    let new_json = serde_json::to_string_pretty(&entries).map_err(|e| format!("Failed to serialize catalog: {}", e))?;
    std::fs::write(&catalog_path, new_json).map_err(|e| format!("Failed to write catalog: {}", e))?;

    // Build remap imported_id -> new catalog id (row-major == sorted order).
    let remap: Vec<(u32, u32)> = items.iter().enumerate().map(|(i, (old_id, _))| (*old_id, first + i as u32)).collect();

    // Remap in-memory appearance sprite references so a later save persists them.
    {
        let remap_map: std::collections::HashMap<u32, u32> = remap.iter().copied().collect();
        let mut appearances_lock = state.appearances.write();
        if let Some(appearances) = appearances_lock.as_mut() {
            for list in [&mut appearances.object, &mut appearances.outfit, &mut appearances.effect, &mut appearances.missile] {
                for appearance in list.iter_mut() {
                    for fg in appearance.frame_group.iter_mut() {
                        if let Some(info) = fg.sprite_info.as_mut() {
                            for sid in info.sprite_id.iter_mut() {
                                if let Some(new_id) = remap_map.get(sid) {
                                    *sid = *new_id;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(CompileResult {
        sheet_file: filename,
        first_sprite_id: first,
        last_sprite_id: last,
        sprites_compiled: items.len(),
        remap,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::features::sprites::parsers::SpriteLoader;

    fn solid_tile(r: u8, g: u8, b: u8, a: u8) -> Vec<u8> {
        let mut v = Vec::with_capacity(32 * 32 * 4);
        for _ in 0..(32 * 32) {
            v.extend_from_slice(&[r, g, b, a]);
        }
        v
    }

    #[test]
    fn seven_bit_roundtrips_are_terminated() {
        for n in [0u64, 1, 127, 128, 16384, 1_000_000] {
            let enc = encode_7bit(n);
            assert_eq!(enc.last().unwrap() & 0x80, 0, "last byte must terminate for {}", n);
        }
    }

    #[test]
    fn sprite_sheet_roundtrip_through_loader() {
        // Two distinct solid 32x32 tiles.
        let red = solid_tile(200, 30, 30, 255);
        let blue = solid_tile(20, 40, 220, 255);
        let tiles = vec![red.clone(), blue.clone()];

        let (bmp, cols, rows) = build_sheet_bmp(&tiles, 32, 32, 12).unwrap();
        assert_eq!(cols * rows, 12); // 2 tiles padded to one row of 12
        let cwm = wrap_cip_lzma(&lzma::compress(&bmp).unwrap());

        // Write a minimal catalog + sheet into a temp dir.
        let dir = std::env::temp_dir().join(format!("beats_sprite_rt_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let first_id = 5000u32;
        let last_id = first_id + cols * rows - 1;
        std::fs::write(dir.join("custom.cwm"), &cwm).unwrap();
        let catalog = format!(r#"[{{"type":"sprite","file":"custom.cwm","spritetype":0,"firstspriteid":{},"lastspriteid":{}}}]"#, first_id, last_id);
        let catalog_path = dir.join("catalog-content.json");
        std::fs::write(&catalog_path, catalog).unwrap();

        // Read back through the real loader and compare pixels.
        let loader = SpriteLoader::new(catalog_path.to_str().unwrap(), dir.to_str().unwrap()).unwrap();
        let sprite0 = loader.get_sprite(first_id).unwrap();
        let sprite1 = loader.get_sprite(first_id + 1).unwrap();
        assert_eq!(sprite0.width, 32);
        assert_eq!(sprite0.height, 32);
        assert_eq!(sprite0.data.as_slice(), red.as_slice(), "tile 0 must round-trip");
        assert_eq!(sprite1.data.as_slice(), blue.as_slice(), "tile 1 must round-trip");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
