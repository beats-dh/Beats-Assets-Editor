use super::category_types::AppearanceCategory;
use super::conversion::{clone_with_new_id, complete_flags_to_proto, complete_to_protobuf};
use super::helpers::{get_items_by_category, get_items_by_category_mut, invalidate_search_cache, rebuild_indexes};
use crate::core::{
    lzma,
    protobuf::{Appearance, Appearances},
};
use crate::features::appearances::{CompleteAppearanceItem, CompleteFlags};
use crate::features::sprites::parsers::{SpriteCatalogEntry, SpriteLoader};
use crate::state::AppState;
use base64::{engine::general_purpose::STANDARD as BASE64_ENGINE, Engine as _};
use image::{codecs::bmp::BmpEncoder, Rgba, RgbaImage};
use flate2::read::{GzDecoder, ZlibDecoder};
use log::info;
use md5::Context;
use sha2::{Digest as ShaDigest, Sha256};
use prost::Message;
use serde::{Deserialize, Serialize};
use std::cmp;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::fs;
use std::io::{Cursor, Read};
use std::path::Path;
use tauri::State;

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImportMode {
    Replace,
    New,
}

impl Default for ImportMode {
    fn default() -> Self {
        ImportMode::Replace
    }
}

const MIN_AUTO_ID: u32 = 101;
const ALL_CATEGORIES: [AppearanceCategory; 4] = [AppearanceCategory::Objects, AppearanceCategory::Outfits, AppearanceCategory::Effects, AppearanceCategory::Missiles];

#[tauri::command]
pub async fn export_appearance_to_json(category: AppearanceCategory, id: u32, path: String, state: State<'_, AppState>) -> Result<String, String> {
    let appearances_lock = state.appearances.read();
    let appearances = match &*appearances_lock {
        Some(a) => a,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category(appearances, &category);

    let appearance = items.iter().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found", id))?;

    let complete = CompleteAppearanceItem::from_protobuf(appearance);
    let json = serde_json::to_string_pretty(&complete).map_err(|e| format!("Failed to serialize appearance: {}", e))?;

    if let Some(parent) = Path::new(&path).parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory {:?}: {}", parent, e))?;
        }
    }

    fs::write(&path, json).map_err(|e| format!("Failed to write file {}: {}", path, e))?;

    Ok(path)
}

#[tauri::command]
pub async fn export_appearances_to_aec(category: AppearanceCategory, start_id: u32, end_id: u32, path: String, include_sprites: Option<bool>, state: State<'_, AppState>) -> Result<usize, String> {
    if start_id > end_id {
        return Err("Invalid export range; start ID must be less than or equal to end ID".to_string());
    }

    let appearances_lock = state.appearances.read();
    let appearances = match &*appearances_lock {
        Some(a) => a,
        None => return Err("No appearances loaded".to_string()),
    };

    let sprite_loader_lock = state.sprite_loader.read();
    let sprite_loader = match &*sprite_loader_lock {
        Some(loader) => loader,
        None => return Err("Load sprites before exporting to AEC".to_string()),
    };

    let items = get_items_by_category(appearances, &category);
    let include_sprite_data = include_sprites.unwrap_or(true);

    if !include_sprite_data {
        return Err("AEC export requires sprite data".to_string());
    }

    let mut selected: Vec<Appearance> = items
        .iter()
        .filter(|app| {
            let id = app.id.unwrap_or(0);
            id >= start_id && id <= end_id
        })
        .cloned()
        .collect();

    if selected.is_empty() {
        return Err(format!("No appearances between IDs {} and {} were found in {:?}", start_id, end_id, category));
    }

    let mut placeholder_counter: u32 = 0;
    for appearance in &mut selected {
        let mut sprite_payloads = Vec::new();
        for frame_group in &mut appearance.frame_group {
            if let Some(sprite_info) = frame_group.sprite_info.as_mut() {
                for sprite_id in &mut sprite_info.sprite_id {
                    let sprite = sprite_loader.get_sprite(*sprite_id).map_err(|e| format!("Failed to fetch sprite {}: {}", sprite_id, e))?;
                    let png = sprite.to_png_bytes().map_err(|e| format!("Failed to encode sprite {}: {}", sprite_id, e))?;
                    sprite_payloads.push(png);
                    *sprite_id = placeholder_counter;
                    placeholder_counter += 1;
                }
            }
        }
        appearance.sprite_data = sprite_payloads;
    }

    let mut exported_container = Appearances::default();
    match category {
        AppearanceCategory::Objects => exported_container.object = selected,
        AppearanceCategory::Outfits => exported_container.outfit = selected,
        AppearanceCategory::Effects => exported_container.effect = selected,
        AppearanceCategory::Missiles => exported_container.missile = selected,
    }

    if let Some(parent) = Path::new(&path).parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory {:?}: {}", parent, e))?;
        }
    }

    let mut buffer = Vec::new();
    exported_container.encode(&mut buffer).map_err(|e| format!("Failed to encode appearances archive: {}", e))?;
    fs::write(&path, buffer).map_err(|e| format!("Failed to write archive {}: {}", path, e))?;

    let count = match category {
        AppearanceCategory::Objects => exported_container.object.len(),
        AppearanceCategory::Outfits => exported_container.outfit.len(),
        AppearanceCategory::Effects => exported_container.effect.len(),
        AppearanceCategory::Missiles => exported_container.missile.len(),
    };

    info!("Exported {} appearance(s) for {:?} to {} with {} sprite blobs", count, category, path, placeholder_counter);

    Ok(count)
}

#[derive(Debug, Serialize)]
pub struct SkippedImport {
    category: AppearanceCategory,
    id: u32,
    reason: String,
    source_path: String,
}

#[derive(Debug, Serialize)]
pub struct ImportResponse {
    inserted: Vec<CompleteAppearanceItem>,
    skipped: Vec<SkippedImport>,
}

#[tauri::command]
pub async fn import_appearance_from_file(category: AppearanceCategory, path: String, mode: Option<ImportMode>, new_id: Option<u32>, state: State<'_, AppState>) -> Result<ImportResponse, String> {
    info!("Import request received for {:?} from path {}", category, path);
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    let mut sprite_loader_lock = state.sprite_loader.write();
    let sprite_loader = sprite_loader_lock.as_mut().ok_or_else(|| "Load sprites (catalog-content.json) before importing .aec files".to_string())?;

    let import_mode = mode.unwrap_or_default();
    let imported_items = load_import_items_from_path(&path, category)?;
    if imported_items.is_empty() {
        return Err(format!("No appearances could be parsed from {}", path));
    }

    let mut fingerprint_map = build_existing_fingerprints(appearances);
    let mut existing_ids = build_existing_id_sets(appearances);
    let mut pending: Vec<PendingAppearance> = Vec::new();
    let mut decoded_sprites: Vec<DecodedSprite> = Vec::new();
    let mut global_sprite_index: usize = 0;
    let mut duplicates_skipped = 0usize;
    let mut per_category_counts: HashMap<AppearanceCategory, usize> = HashMap::new();
    let mut skipped_entries: Vec<SkippedImport> = Vec::new();

    for (target_category, imported) in imported_items {
        if matches!(import_mode, ImportMode::New) {
            if existing_ids.get(&target_category).map(|set| set.contains(&imported.id)).unwrap_or(false) {
                duplicates_skipped += 1;
                skipped_entries.push(SkippedImport {
                    category: target_category,
                    id: imported.id,
                    reason: "existingId".into(),
                    source_path: path.clone(),
                });
                continue;
            }
        }

        if let Some(fingerprint) = compute_sprite_fingerprint(&imported) {
            let set = fingerprint_map.entry(target_category).or_insert_with(HashSet::new);
            if !set.insert(fingerprint) {
                duplicates_skipped += 1;
                skipped_entries.push(SkippedImport {
                    category: target_category,
                    id: imported.id,
                    reason: "duplicateSprite".into(),
                    source_path: path.clone(),
                });
                continue;
            }
        }

        let sprite_start = global_sprite_index;
        for encoded in &imported.sprite_data {
            let data = BASE64_ENGINE.decode(encoded).map_err(|e| format!("Failed to decode sprite payload for appearance {}: {}", imported.id, e))?;
            if data.is_empty() {
                return Err(format!("Appearance {} contains empty sprite payload", imported.id));
            }

            let dyn_img = image::load_from_memory(&data).map_err(|e| format!("Invalid sprite data in {}: {}", imported.id, e))?;
            let rgba = dyn_img.to_rgba8();
            let (width, height) = rgba.dimensions();
            validate_sprite_dimensions(width, height)?;

            decoded_sprites.push(DecodedSprite {
                index: global_sprite_index,
                width,
                height,
                image: rgba,
            });
            global_sprite_index += 1;
        }

        let mut sprite_count = global_sprite_index - sprite_start;
        let required_slots = compute_required_sprite_slots(&imported);

        if required_slots == 0 {
            if sprite_count > 0 {
                decoded_sprites.truncate(sprite_start);
                global_sprite_index = sprite_start;
                sprite_count = 0;
            }
        } else {
            if sprite_count == 0 {
                return Err(format!("Appearance {} references sprites but contains no sprite data", imported.id));
            }

            if sprite_count < required_slots {
                let template = decoded_sprites.get(global_sprite_index - 1).cloned().ok_or_else(|| format!("Failed to duplicate sprite data for appearance {}", imported.id))?;
                for _ in sprite_count..required_slots {
                    let new_index = global_sprite_index;
                    decoded_sprites.push(DecodedSprite {
                        index: new_index,
                        width: template.width,
                        height: template.height,
                        image: template.image.clone(),
                    });
                    global_sprite_index += 1;
                }
                sprite_count = required_slots;
            } else if sprite_count > required_slots {
                let remove = sprite_count - required_slots;
                decoded_sprites.truncate(decoded_sprites.len() - remove);
                global_sprite_index -= remove;
                sprite_count = required_slots;
            }
        }

        pending.push(PendingAppearance {
            category: target_category,
            item: imported,
            sprite_start,
            sprite_count,
        });
        *per_category_counts.entry(target_category).or_insert(0) += 1;
    }

    if pending.is_empty() {
        return Err(format!("All appearances in {} were duplicates of existing entries", path));
    }

    let sprite_mapping = assign_imported_sprites(&decoded_sprites, sprite_loader)?;
    if !sprite_mapping.is_empty() {
        sprite_loader.save_catalog().map_err(|e| format!("Failed to update catalog-content.json: {}", e))?;
    }

    if matches!(import_mode, ImportMode::Replace) && pending.len() > 1 {
        return Err("Replace mode only supports importing a single appearance at a time".to_string());
    }

    let mut results = Vec::with_capacity(pending.len());
    for mut pending_item in pending {
        if pending_item.sprite_count > 0 {
            apply_sprite_mapping(&mut pending_item, &sprite_mapping)?;
        } else {
            pending_item.item.sprite_data.clear();
        }

        let stored = insert_imported_appearance(pending_item.category, &mut pending_item.item, import_mode, new_id, appearances, &state)?;
        existing_ids.entry(pending_item.category).or_insert_with(HashSet::new).insert(stored.id);

        results.push(stored);
    }

    state.sprite_cache.clear();

    info!("Finished importing {} appearance(s) from {} (duplicates skipped: {})", results.len(), path, duplicates_skipped);
    for (cat, count) in per_category_counts {
        info!(" -> {:?}: {} entries imported", cat, count);
    }
    if !skipped_entries.is_empty() {
        log_skipped_imports(&path, &skipped_entries);
    }

    Ok(ImportResponse {
        inserted: results,
        skipped: skipped_entries,
    })
}

fn log_skipped_imports(source: &str, entries: &[SkippedImport]) {
    use std::collections::HashMap;

    info!("Skipped {} appearance(s) while importing {}", entries.len(), source);

    let mut grouped: HashMap<(AppearanceCategory, String), Vec<u32>> = HashMap::new();
    for entry in entries {
        grouped.entry((entry.category, entry.reason.clone())).or_default().push(entry.id);
    }

    for ((category, reason), ids) in grouped {
        info!(" -> {:?} [{}] IDs: {:?}", category, reason, ids);
    }
}

fn insert_imported_appearance(
    category: AppearanceCategory,
    imported: &mut CompleteAppearanceItem,
    mode: ImportMode,
    new_id: Option<u32>,
    appearances: &mut Appearances,
    state: &State<'_, AppState>,
) -> Result<CompleteAppearanceItem, String> {
    let items = get_items_by_category_mut(appearances, &category);

    let assigned_id = match mode {
        ImportMode::Replace => {
            let target_id = new_id.unwrap_or(imported.id);
            imported.id = target_id;
            if !items.iter().any(|app| app.id.unwrap_or(0) == target_id) {
                return Err(format!("Cannot replace appearance {}; ID not found in {:?}", target_id, category));
            }
            target_id
        }
        ImportMode::New => {
            let fallback = new_id.unwrap_or(imported.id);
            let final_id = determine_final_id(category, fallback, items);
            imported.id = final_id;
            final_id
        }
    };

    if category == AppearanceCategory::Objects {
        adjust_object_flags(imported);
    }

    let proto = complete_to_protobuf(imported);
    let result_id = imported.id;
    match mode {
        ImportMode::Replace => {
            if let Some(pos) = items.iter().position(|app| app.id.unwrap_or(0) == assigned_id) {
                items[pos] = proto;
            }
            invalidate_search_cache(state);
        }
        ImportMode::New => {
            items.push(proto);
            sort_by_id(items);
            let stored = items.iter().find(|app| app.id.unwrap_or(0) == result_id).cloned().ok_or_else(|| "Failed to store imported appearance".to_string())?;
            rebuild_indexes(state, appearances);
            invalidate_search_cache(state);
            return Ok(CompleteAppearanceItem::from_protobuf(&stored));
        }
    }

    let stored = items.iter().find(|app| app.id.unwrap_or(0) == result_id).cloned().ok_or_else(|| "Failed to store imported appearance".to_string())?;
    Ok(CompleteAppearanceItem::from_protobuf(&stored))
}

struct PendingAppearance {
    category: AppearanceCategory,
    item: CompleteAppearanceItem,
    sprite_start: usize,
    sprite_count: usize,
}

#[derive(Clone)]
struct DecodedSprite {
    index: usize,
    width: u32,
    height: u32,
    image: RgbaImage,
}

fn apply_sprite_mapping(pending: &mut PendingAppearance, mapping: &[u32]) -> Result<(), String> {
    if pending.sprite_count == 0 {
        pending.item.sprite_data.clear();
        return Ok(());
    }

    let start = pending.sprite_start;
    let end = start + pending.sprite_count;
    let mut cursor = start;

    for frame_group in &mut pending.item.frame_groups {
        if let Some(sprite_info) = frame_group.sprite_info.as_mut() {
            for sprite_id in &mut sprite_info.sprite_ids {
                if cursor >= end {
                    break;
                }
                let new_id = mapping.get(cursor).copied().ok_or_else(|| format!("Missing sprite mapping for appearance {}", pending.item.id))?;
                *sprite_id = new_id;
                cursor += 1;
            }
        }
    }

    if cursor != end {
        return Err(format!("Sprite count mismatch while importing appearance {} (expected {}, mapped {})", pending.item.id, pending.sprite_count, cursor - start));
    }

    pending.item.sprite_data.clear();
    Ok(())
}

fn validate_sprite_dimensions(width: u32, height: u32) -> Result<(), String> {
    match (width, height) {
        (32, 32) | (32, 64) | (64, 32) | (64, 64) => Ok(()),
        _ => Err(format!("Unsupported sprite size: {}x{}", width, height)),
    }
}

fn sprite_type_for_dimensions(width: u32, height: u32) -> Result<u32, String> {
    match (width, height) {
        (32, 32) => Ok(0),
        (32, 64) => Ok(1),
        (64, 32) => Ok(2),
        (64, 64) => Ok(3),
        _ => Err(format!("Unsupported sprite dimensions {}x{}", width, height)),
    }
}

fn assign_imported_sprites(decoded: &[DecodedSprite], loader: &mut SpriteLoader) -> Result<Vec<u32>, String> {
    let mut mapping = vec![0u32; decoded.len()];
    if decoded.is_empty() {
        return Ok(mapping);
    }

    let mut grouped: BTreeMap<(u32, u32), Vec<&DecodedSprite>> = BTreeMap::new();
    for sprite in decoded {
        grouped.entry((sprite.width, sprite.height)).or_default().push(sprite);
    }

    let mut next_id = loader.next_sprite_id().unwrap_or(0);
    if next_id == 0 {
        next_id = 1;
    } else {
        next_id += 1;
    }

    for ((width, height), mut sprites) in grouped {
        sprites.sort_by_key(|s| s.index);
        let sprite_type = sprite_type_for_dimensions(width, height)?;
        let sprites_per_row = 384 / width;
        let sprites_per_col = 384 / height;
        let sprites_per_sheet = (sprites_per_row * sprites_per_col) as usize;

        let mut idx = 0;
        while idx < sprites.len() {
            let chunk_end = cmp::min(idx + sprites_per_sheet, sprites.len());
            let chunk = &sprites[idx..chunk_end];
            let mut sheet = RgbaImage::from_pixel(384, 384, Rgba([255, 0, 255, 0]));

            for (sheet_index, sprite) in chunk.iter().enumerate() {
                let col = (sheet_index % sprites_per_row as usize) as u32;
                let row = (sheet_index / sprites_per_row as usize) as u32;
                blit_sprite(&mut sheet, &sprite.image, col * width, row * height);
                mapping[sprite.index] = next_id;
                next_id += 1;
            }

            let first_id = next_id - chunk.len() as u32;
            let last_id = next_id - 1;

            let bmp_data = build_cip_bmp(&sheet)?;
            let file_name = write_sprite_sheet_file(&bmp_data, loader.assets_dir())?;

            loader.append_catalog_entry(SpriteCatalogEntry {
                entry_type: "sprite".to_string(),
                file: file_name,
                sprite_type: Some(sprite_type),
                first_sprite_id: Some(first_id),
                last_sprite_id: Some(last_id),
                area: Some(0),
            });

            idx = chunk_end;
        }
    }

    Ok(mapping)
}

fn blit_sprite(target: &mut RgbaImage, sprite: &RgbaImage, x_offset: u32, y_offset: u32) {
    for y in 0..sprite.height() {
        for x in 0..sprite.width() {
            let pixel = *sprite.get_pixel(x, y);
            target.put_pixel(x_offset + x, y_offset + y, pixel);
        }
    }
}

fn build_cip_bmp(image: &RgbaImage) -> Result<Vec<u8>, String> {
    let width = image.width();
    let height = image.height();
    let mut raw_bmp = Vec::new();
    {
        let mut cursor = Cursor::new(&mut raw_bmp);
        let mut encoder = BmpEncoder::new(&mut cursor);
        encoder.encode(image.as_raw(), width, height, image::ExtendedColorType::Rgba8).map_err(|e| format!("Failed to encode BMP: {}", e))?;
    }

    if raw_bmp.len() < 14 {
        return Err("Generated BMP is too small".to_string());
    }
    let data_offset = u32::from_le_bytes([raw_bmp[10], raw_bmp[11], raw_bmp[12], raw_bmp[13]]) as usize;
    if data_offset > raw_bmp.len() {
        return Err("Invalid BMP data offset".to_string());
    }
    let pixel_data = &raw_bmp[data_offset..];

    let mut output = Vec::with_capacity(122 + pixel_data.len());
    output.extend_from_slice(&[0x42, 0x4D]); // BM
    output.extend_from_slice(&[0u8; 4]); // file size placeholder
    output.extend_from_slice(&[0u8; 2]); // reserved1
    output.extend_from_slice(&[0u8; 2]); // reserved2
    output.extend_from_slice(&122u32.to_le_bytes()); // pixel data offset
    output.extend_from_slice(&108u32.to_le_bytes()); // DIB header size
    output.extend_from_slice(&(width as i32).to_le_bytes());
    output.extend_from_slice(&(height as i32).to_le_bytes());
    output.extend_from_slice(&(1u16).to_le_bytes());
    output.extend_from_slice(&(32u16).to_le_bytes());
    output.extend_from_slice(&3u32.to_le_bytes()); // BI_BITFIELDS
    output.extend_from_slice(&0u32.to_le_bytes()); // image size
    output.extend_from_slice(&0u32.to_le_bytes()); // XPelsPerMeter
    output.extend_from_slice(&0u32.to_le_bytes()); // YPelsPerMeter
    output.extend_from_slice(&0u32.to_le_bytes()); // ClrUsed
    output.extend_from_slice(&0u32.to_le_bytes()); // ClrImportant
    output.extend_from_slice(&[0x00, 0x00, 0xFF, 0x00]); // red mask
    output.extend_from_slice(&[0x00, 0xFF, 0x00, 0x00]); // green mask
    output.extend_from_slice(&[0xFF, 0x00, 0x00, 0x00]); // blue mask
    output.extend_from_slice(&[0x00, 0x00, 0x00, 0xFF]); // alpha mask
    output.extend_from_slice(&[0x57, 0x69, 0x6E, 0x20]); // "Win "
    output.extend_from_slice(&[0u8; 36]); // endpoints
    output.extend_from_slice(&[0u8; 12]); // gamma
    output.extend_from_slice(pixel_data);

    let file_size = output.len() as u32;
    output[2..6].copy_from_slice(&file_size.to_le_bytes());

    Ok(output)
}

fn write_sprite_sheet_file(bmp_data: &[u8], assets_dir: &Path) -> Result<String, String> {
    let mut hasher = Sha256::new();
    hasher.update(bmp_data);
    let hash = hasher.finalize();
    let mut hash_str = String::with_capacity(64);
    for byte in hash {
        hash_str.push_str(&format!("{:02x}", byte));
    }

    let mut file_name = format!("sprites-{}.bmp.lzma", hash_str);
    let mut full_path = assets_dir.join(&file_name);
    let mut suffix = 1;
    while full_path.exists() {
        file_name = format!("sprites-{}-{}.bmp.lzma", hash_str, suffix);
        full_path = assets_dir.join(&file_name);
        suffix += 1;
    }

    write_cip_lzma(bmp_data, &full_path)?;
    Ok(file_name)
}

fn write_cip_lzma(bmp_data: &[u8], path: &Path) -> Result<(), String> {
    let lzma_payload = crate::core::lzma::compress(bmp_data).map_err(|e| format!("Failed to compress sprite sheet: {}", e))?;
    let mut file = Vec::with_capacity(32 + 8 + lzma_payload.len());
    file.extend_from_slice(&[0u8; 32]);
    file.push(0x70);
    file.extend_from_slice(&[0x0A, 0xFA, 0x80, 0x24]);
    encode_7bit_int(lzma_payload.len() as u32, &mut file);
    file.extend_from_slice(&lzma_payload);
    fs::write(path, file).map_err(|e| format!("Failed to write sprite sheet {:?}: {}", path, e))?;
    Ok(())
}

fn encode_7bit_int(mut value: u32, output: &mut Vec<u8>) {
    while value >= 0x80 {
        output.push((value as u8) | 0x80);
        value >>= 7;
    }
    output.push(value as u8);
}

#[tauri::command]
pub async fn duplicate_appearance(category: AppearanceCategory, source_id: u32, target_id: Option<u32>, state: State<'_, AppState>) -> Result<CompleteAppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    let items = get_items_by_category_mut(appearances, &category);

    let source = items.iter().find(|app| app.id.unwrap_or(0) == source_id).cloned().ok_or_else(|| format!("Appearance {} not found in {:?}", source_id, category))?;

    let mut candidate = target_id.unwrap_or_else(|| find_next_available_id(items));
    while items.iter().any(|app| app.id.unwrap_or(0) == candidate) {
        candidate += 1;
    }

    let duplicate = clone_with_new_id(&source, candidate);
    items.push(duplicate);
    sort_by_id(items);

    // CRITICAL: Rebuild indexes after inserting and sorting (indexes changed)
    // Clone stored result before rebuild to avoid borrow conflicts
    let stored = items.iter().find(|app| app.id.unwrap_or(0) == candidate).cloned().ok_or_else(|| "Failed to duplicate appearance".to_string())?;
    rebuild_indexes(&state, appearances);
    invalidate_search_cache(&state);

    Ok(CompleteAppearanceItem::from_protobuf(&stored))
}

#[tauri::command]
pub async fn create_empty_appearance(
    category: AppearanceCategory,
    new_id: Option<u32>,
    name: Option<String>,
    description: Option<String>,
    state: State<'_, AppState>,
) -> Result<CompleteAppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    let items = get_items_by_category_mut(appearances, &category);

    let mut candidate = new_id.unwrap_or_else(|| find_next_available_id(items));
    while items.iter().any(|app| app.id.unwrap_or(0) == candidate) {
        candidate += 1;
    }

    let mut appearance = Appearance::default();
    appearance.id = Some(candidate);
    appearance.name = name.map(|s| s.into_bytes());
    appearance.description = description.map(|s| s.into_bytes());

    items.push(appearance);
    sort_by_id(items);

    // CRITICAL: Rebuild indexes after inserting and sorting (indexes changed)
    // Clone stored result before rebuild to avoid borrow conflicts
    let stored = items.iter().find(|app| app.id.unwrap_or(0) == candidate).cloned().ok_or_else(|| "Failed to create appearance".to_string())?;
    rebuild_indexes(&state, appearances);
    invalidate_search_cache(&state);

    Ok(CompleteAppearanceItem::from_protobuf(&stored))
}

#[tauri::command]
pub async fn copy_appearance_flags(category: AppearanceCategory, id: u32, state: State<'_, AppState>) -> Result<CompleteFlags, String> {
    let copied_flags = {
        let appearances_lock = state.appearances.read();
        let appearances = match &*appearances_lock {
            Some(a) => a,
            None => return Err("No appearances loaded".to_string()),
        };

        let items = get_items_by_category(appearances, &category);
        let appearance = items.iter().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found", id))?;

        let flags = appearance.flags.as_ref().ok_or_else(|| "Appearance has no flags to copy".to_string())?;

        CompleteFlags::from_protobuf(flags)
    };

    {
        let mut clipboard = state.flags_clipboard.lock();
        *clipboard = Some(copied_flags.clone());
    }

    Ok(copied_flags)
}

#[tauri::command]
pub async fn paste_appearance_flags(category: AppearanceCategory, id: u32, state: State<'_, AppState>) -> Result<CompleteFlags, String> {
    let flags_to_apply = {
        let clipboard = state.flags_clipboard.lock();
        clipboard.clone().ok_or_else(|| "Flag clipboard is empty".to_string())?
    };

    {
        let mut appearances_lock = state.appearances.write();
        let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

        let items = get_items_by_category_mut(appearances, &category);
        let appearance = items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found in {:?}", id, category))?;

        appearance.flags = Some(complete_flags_to_proto(&flags_to_apply));
    }

    // CRITICAL: Invalidate search cache after mutating flags
    // Subcategory filtering relies on flags.market.category, so cache can be stale
    invalidate_search_cache(&state);

    Ok(flags_to_apply)
}

const MAX_IMPORT_PARSE_DEPTH: u8 = 4;

fn load_import_items_from_path(path: &str, category: AppearanceCategory) -> Result<Vec<(AppearanceCategory, CompleteAppearanceItem)>, String> {
    let data = fs::read(path).map_err(|e| format!("Failed to read file {}: {}", path, e))?;
    if let Some(from_container) = parse_appearances_container(&data)? {
        if from_container.iter().any(|(cat, _)| *cat == category) {
            let filtered = from_container.into_iter().filter(|(cat, _)| *cat == category).collect::<Vec<_>>();
            return Ok(filtered);
        }
        return Ok(from_container);
    }

    let single = parse_complete_appearance(&data, 0).map_err(|err| format!("Failed to parse appearance data in {}: {}", path, err))?;
    Ok(vec![(category, single)])
}

fn build_existing_fingerprints(appearances: &Appearances) -> HashMap<AppearanceCategory, HashSet<String>> {
    let mut map = HashMap::new();
    for &category in &ALL_CATEGORIES {
        map.insert(category, HashSet::new());
    }

    for &category in &ALL_CATEGORIES {
        for item in get_items_by_category(appearances, &category) {
            let complete = CompleteAppearanceItem::from_protobuf(item);
            if let Some(fingerprint) = compute_sprite_fingerprint(&complete) {
                if let Some(entry) = map.get_mut(&category) {
                    entry.insert(fingerprint);
                }
            }
        }
    }

    map
}

fn build_existing_id_sets(appearances: &Appearances) -> HashMap<AppearanceCategory, HashSet<u32>> {
    let mut map = HashMap::new();
    for &category in &ALL_CATEGORIES {
        let set = get_items_by_category(appearances, &category).iter().filter_map(|app| app.id).collect::<HashSet<u32>>();
        map.insert(category, set);
    }
    map
}

fn compute_sprite_fingerprint(item: &CompleteAppearanceItem) -> Option<String> {
    let mut context = Context::new();
    let mut has_data = false;

    for sprite in &item.sprite_data {
        if sprite.is_empty() {
            continue;
        }
        if let Ok(bytes) = BASE64_ENGINE.decode(sprite) {
            if bytes.is_empty() {
                continue;
            }
            context.consume(&bytes);
            has_data = true;
        }
    }

    if has_data {
        Some(format!("{:x}", context.compute()))
    } else {
        None
    }
}

fn compute_required_sprite_slots(item: &CompleteAppearanceItem) -> usize {
    item.frame_groups.iter().map(|fg| fg.sprite_info.as_ref().map(|si| si.sprite_ids.len()).unwrap_or(0)).sum()
}

fn parse_complete_appearance(bytes: &[u8], depth: u8) -> Result<CompleteAppearanceItem, String> {
    if depth > MAX_IMPORT_PARSE_DEPTH {
        return Err("Exceeded maximum parse depth for appearance import".to_string());
    }

    if let Ok(item) = serde_json::from_slice::<CompleteAppearanceItem>(bytes) {
        return Ok(item);
    }

    if let Ok(proto) = Appearance::decode(bytes) {
        return Ok(CompleteAppearanceItem::from_protobuf(&proto));
    }

    if let Ok(text) = std::str::from_utf8(bytes) {
        let trimmed = text.trim_matches(|c: char| c.is_whitespace() || c == '\u{feff}');
        if trimmed.starts_with('{') && trimmed.ends_with('}') {
            if let Ok(item) = serde_json::from_str::<CompleteAppearanceItem>(trimmed) {
                return Ok(item);
            }
        }

        if trimmed.len() >= 4 && is_probably_base64(trimmed) {
            if let Some(decoded) = decode_base64_payload(trimmed) {
                if let Ok(item) = parse_complete_appearance(&decoded, depth + 1) {
                    return Ok(item);
                }
            }
        }
    }

    for decoder in [try_decompress_lzma, try_decompress_gzip, try_decompress_zlib] {
        if let Ok(decoded) = decoder(bytes) {
            if !decoded.is_empty() {
                if let Ok(item) = parse_complete_appearance(&decoded, depth + 1) {
                    return Ok(item);
                }
            }
        }
    }

    Err("Unsupported appearance import format".to_string())
}

fn parse_appearances_container(bytes: &[u8]) -> Result<Option<Vec<(AppearanceCategory, CompleteAppearanceItem)>>, String> {
    match Appearances::decode(bytes) {
        Ok(container) => {
            let total = container.object.len() + container.outfit.len() + container.effect.len() + container.missile.len();
            if total == 0 {
                return Err("Appearances container was empty".to_string());
            }

            let mut entries: Vec<(AppearanceCategory, CompleteAppearanceItem)> = Vec::with_capacity(total);
            entries.extend(container.object.iter().map(|app| (AppearanceCategory::Objects, CompleteAppearanceItem::from_protobuf(app))));
            entries.extend(container.outfit.iter().map(|app| (AppearanceCategory::Outfits, CompleteAppearanceItem::from_protobuf(app))));
            entries.extend(container.effect.iter().map(|app| (AppearanceCategory::Effects, CompleteAppearanceItem::from_protobuf(app))));
            entries.extend(container.missile.iter().map(|app| (AppearanceCategory::Missiles, CompleteAppearanceItem::from_protobuf(app))));

            info!(
                "Detected .aec container with {} total entries, breakdown: objects={} outfits={} effects={} missiles={}",
                total,
                container.object.len(),
                container.outfit.len(),
                container.effect.len(),
                container.missile.len()
            );

            Ok(Some(entries))
        }
        Err(_) => Ok(None),
    }
}

fn try_decompress_lzma(data: &[u8]) -> Result<Vec<u8>, String> {
    if data.len() < 13 {
        return Err("Not enough bytes for LZMA".to_string());
    }
    lzma::decompress(data).map_err(|e| e.to_string())
}

fn try_decompress_gzip(data: &[u8]) -> Result<Vec<u8>, String> {
    if data.len() < 2 || data[0] != 0x1F || data[1] != 0x8B {
        return Err("Not gzip data".to_string());
    }
    let mut decoder = GzDecoder::new(data);
    let mut output = Vec::new();
    decoder.read_to_end(&mut output).map_err(|e| e.to_string())?;
    Ok(output)
}

fn try_decompress_zlib(data: &[u8]) -> Result<Vec<u8>, String> {
    if data.len() < 2 {
        return Err("Not zlib data".to_string());
    }
    let mut decoder = ZlibDecoder::new(data);
    let mut output = Vec::new();
    decoder.read_to_end(&mut output).map_err(|e| e.to_string())?;
    Ok(output)
}

fn decode_base64_payload(input: &str) -> Option<Vec<u8>> {
    let sanitized: String = input.chars().filter(|c| !c.is_whitespace()).collect();
    if sanitized.is_empty() || sanitized.len() % 4 != 0 {
        return None;
    }
    BASE64_ENGINE.decode(sanitized).ok()
}

fn is_probably_base64(input: &str) -> bool {
    let mut useful_len = 0;
    for c in input.chars() {
        if c.is_whitespace() {
            continue;
        }
        useful_len += 1;
        if !(c.is_ascii_alphanumeric() || matches!(c, '+' | '/' | '=')) {
            return false;
        }
    }
    useful_len > 0
}

fn determine_final_id(_category: AppearanceCategory, original_id: u32, items: &[Appearance]) -> u32 {
    let already_exists = items.iter().any(|app| app.id.unwrap_or(0) == original_id);
    let max_existing = items.iter().filter_map(|app| app.id).max().unwrap_or(0);
    let keep_original = !already_exists && original_id > max_existing;
    if keep_original {
        return original_id;
    }

    let mut candidate = cmp::max(max_existing.saturating_add(1), MIN_AUTO_ID);
    while items.iter().any(|app| app.id.unwrap_or(0) == candidate) {
        candidate += 1;
    }
    candidate
}

fn adjust_object_flags(item: &mut CompleteAppearanceItem) {
    if let Some(flags) = item.flags.as_mut() {
        if let Some(market) = flags.market.as_mut() {
            if market.trade_as_object_id.is_some() {
                market.trade_as_object_id = Some(item.id);
            }
            if market.show_as_object_id.is_some() {
                market.show_as_object_id = Some(item.id);
            }
        }
        if let Some(cyclopedia) = flags.cyclopedia_item.as_mut() {
            if cyclopedia.cyclopedia_type.is_some() {
                cyclopedia.cyclopedia_type = Some(item.id);
            }
        }
    }
}

#[tauri::command]
pub async fn delete_appearance(category: AppearanceCategory, id: u32, state: State<'_, AppState>) -> Result<(), String> {
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    let items = get_items_by_category_mut(appearances, &category);
    if let Some(pos) = items.iter().position(|app| app.id.unwrap_or(0) == id) {
        items.remove(pos);

        // CRITICAL: Rebuild indexes after deletion (all subsequent indexes are stale)
        rebuild_indexes(&state, appearances);
        invalidate_search_cache(&state);

        Ok(())
    } else {
        Err(format!("Appearance {} not found in {:?}", id, category))
    }
}

#[inline]
fn find_next_available_id(items: &[Appearance]) -> u32 {
    items.iter().map(|app| app.id.unwrap_or(0)).max().unwrap_or(0).saturating_add(1)
}

#[inline]
fn sort_by_id(items: &mut Vec<Appearance>) {
    items.sort_by_key(|app| app.id.unwrap_or(u32::MAX));
}
