use super::conversion::{clone_with_new_id, complete_flags_to_proto, complete_to_protobuf};
use super::helpers::{get_items_by_category, get_items_by_category_mut, get_index_for_category, rebuild_indexes, invalidate_search_cache};
use crate::core::protobuf::{Appearance, Appearances};
use crate::features::appearances::{AppearanceCategory, CompleteAppearanceItem, CompleteFlags};
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use prost::Message;
use tauri::State;
use ahash::AHasher;
use std::hash::{DefaultHasher, Hash, Hasher};
use crate::features::sounds::commands::SoundsState;

#[derive(Debug, Clone, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportBatchResult {
    pub imported: Vec<u32>,
    pub skipped: Vec<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImportStartIds {
    pub objects: Option<u32>,
    pub outfits: Option<u32>,
    pub effects: Option<u32>,
    pub missiles: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LatestAssetIds {
    pub objects: u32,
    pub outfits: u32,
    pub effects: u32,
    pub missiles: u32,
    pub sounds: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImportPresence {
    pub objects: bool,
    pub outfits: bool,
    pub effects: bool,
    pub missiles: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImportContext {
    pub latest: LatestAssetIds,
    pub present: ImportPresence,
}

#[tauri::command]
pub async fn export_appearance_to_json(category: AppearanceCategory, id: u32, path: String, state: State<'_, AppState>) -> Result<String, String> {
    let appearances_lock = state.appearances.read();
    let appearances = match &*appearances_lock {
        Some(a) => a,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category(appearances, &category);
    let index_map = get_index_for_category(&state, &category);

    // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
    let appearance = if let Some(idx) = index_map.get(&id) {
        items.get(*idx).ok_or_else(|| format!("Appearance with ID {} not found", id))?
    } else {
        items.iter().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found", id))?
    };

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
pub async fn export_appearance_to_aec(category: AppearanceCategory, id: u32, path: String, state: State<'_, AppState>) -> Result<String, String> {
    let appearances_lock = state.appearances.read();
    let appearances = match &*appearances_lock {
        Some(a) => a,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category(appearances, &category);
    let index_map = get_index_for_category(&state, &category);

    let appearance = if let Some(idx) = index_map.get(&id) {
        items.get(*idx).ok_or_else(|| format!("Appearance with ID {} not found", id))?
    } else {
        items.iter().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found", id))?
    };

    let mut appearance = appearance.clone();

    let sprite_ids: Vec<u32> = appearance.frame_group.iter().filter_map(|fg| fg.sprite_info.as_ref()).flat_map(|info| info.sprite_id.iter().copied()).collect();

    let sprite_loader_lock = state.sprite_loader.read();
    let sprite_loader = sprite_loader_lock.as_ref();

    let mut sprite_data = Vec::new();
    if !sprite_ids.is_empty() {
        for sprite_id in &sprite_ids {
            if let Some(bytes) = state.imported_sprites.get(sprite_id) {
                sprite_data.push(bytes.clone());
                continue;
            }

            let loader = sprite_loader.ok_or_else(|| "No sprites loaded".to_string())?;
            let sprite = loader.get_sprite(*sprite_id).map_err(|e| format!("Failed to get sprite {}: {}", sprite_id, e))?;
            let bytes = sprite.to_png_bytes().map_err(|e| format!("Failed to convert sprite to PNG: {}", e))?;
            sprite_data.push(bytes);
        }
    }

    // Normalize sprite IDs to sequential order for AEC compatibility
    let mut counter = 0u32;
    for fg in appearance.frame_group.iter_mut() {
        if let Some(info) = fg.sprite_info.as_mut() {
            for sprite_id in info.sprite_id.iter_mut() {
                *sprite_id = counter;
                counter += 1;
            }
        }
    }

    let mut container = Appearances::default();
    match category {
        AppearanceCategory::Objects => container.object.push(appearance),
        AppearanceCategory::Outfits => container.outfit.push(appearance),
        AppearanceCategory::Effects => container.effect.push(appearance),
        AppearanceCategory::Missiles => container.missile.push(appearance),
    }

    if let Some(parent) = Path::new(&path).parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory {:?}: {}", parent, e))?;
        }
    }

    let mut buf = Vec::new();
    container.encode(&mut buf).map_err(|e| format!("Failed to encode AEC: {}", e))?;
    fs::write(&path, buf).map_err(|e| format!("Failed to write file {}: {}", path, e))?;

    Ok(path)
}

#[tauri::command]
pub async fn import_appearance_from_json(
    category: AppearanceCategory,
    path: String,
    mode: Option<ImportMode>,
    new_id: Option<u32>,
    state: State<'_, AppState>,
) -> Result<CompleteAppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    let content = read_text_file(&path)?;

    let mut imported: CompleteAppearanceItem = serde_json::from_str(&content).map_err(|e| format!("Failed to parse appearance JSON: {}", e))?;

    let mode = mode.unwrap_or_default();

    let index_map = get_index_for_category(&state, &category);

    let assigned_id = match mode {
        ImportMode::Replace => {
            let target_id = new_id.unwrap_or(imported.id);
            imported.id = target_id;
            // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
            if !index_map.contains_key(&target_id) {
                return Err(format!("Cannot replace appearance {}; ID not found in {:?}", target_id, category));
            }
            target_id
        }
        ImportMode::New => {
            let items = get_items_by_category(appearances, &category);
            let mut candidate = new_id.unwrap_or_else(|| find_next_available_id(items));
            // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
            while index_map.contains_key(&candidate) {
                candidate += 1;
            }
            imported.id = candidate;
            candidate
        }
    };

    let proto = complete_to_protobuf(&imported);
    let result_id = imported.id;

    // Use explicit scope to drop mutable borrow before rebuild_indexes
    let stored_id = match mode {
        ImportMode::Replace => {
            let items = get_items_by_category_mut(appearances, &category);
            // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
            if let Some(pos) = index_map.get(&assigned_id) {
                items[*pos] = proto;
            }
            // Replace mode doesn't change indexes, only content
            invalidate_search_cache(&state);
            result_id
        }
        ImportMode::New => {
            {
                let items = get_items_by_category_mut(appearances, &category);
                items.push(proto);
                sort_by_id(items);
            } // Drop mutable borrow here
              // CRITICAL: Rebuild indexes after inserting and sorting (indexes changed)
            rebuild_indexes(&state, appearances);
            invalidate_search_cache(&state);
            result_id
        }
    };

    // OPTIMIZATION: Use O(1) index lookup after rebuild instead of O(n) linear search
    let index_map_after = get_index_for_category(&state, &category);
    let items_after = get_items_by_category(appearances, &category);
    let stored = if let Some(pos) = index_map_after.get(&stored_id) {
        items_after.get(*pos).ok_or_else(|| "Failed to store imported appearance".to_string())?.clone()
    } else {
        return Err("Failed to store imported appearance".to_string());
    };

    Ok(CompleteAppearanceItem::from_protobuf(&stored))
}

#[tauri::command]
pub async fn import_appearances_from_files(category: AppearanceCategory, paths: Vec<String>, start_id: Option<u32>, state: State<'_, AppState>) -> Result<ImportBatchResult, String> {
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    if paths.is_empty() {
        return Ok(ImportBatchResult {
            imported: Vec::new(),
            skipped: Vec::new(),
        });
    }

    let mut parsed_items = Vec::new();
    for path in &paths {
        let extension = Path::new(path).extension().and_then(|ext| ext.to_str()).unwrap_or("").to_lowercase();

        if extension == "aec" {
            let mut aec_items = parse_aec_items(path, &category)?;
            remap_imported_sprites(&mut aec_items, state.inner())?;
            parsed_items.extend(aec_items.into_iter().map(|appearance| ImportedAppearance::Proto(appearance)));
        } else {
            let content = read_text_file(path)?;
            let imported: CompleteAppearanceItem = serde_json::from_str(&content).map_err(|e| format!("Failed to parse appearance JSON: {}", e))?;
            parsed_items.push(ImportedAppearance::Complete(imported));
        }
    }

    let existing_signatures = collect_existing_signatures(&category, &appearances.object, state.inner())?;

    let mut result = ImportBatchResult {
        imported: Vec::new(),
        skipped: Vec::new(),
    };
    let mut seen_signatures = existing_signatures;
    let to_insert = process_import_bucket(&category, parsed_items, start_id, state.inner(), &mut seen_signatures, &mut result)?;

    if !to_insert.is_empty() {
        let items = get_items_by_category_mut(appearances, &category);
        items.extend(to_insert);
        sort_by_id(items);
        rebuild_indexes(&state, appearances);
        invalidate_search_cache(&state);
    }

    Ok(result)
}

#[tauri::command]
pub async fn import_appearances_from_files_all(paths: Vec<String>, start_ids: Option<ImportStartIds>, state: State<'_, AppState>) -> Result<ImportBatchResult, String> {
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    if paths.is_empty() {
        return Ok(ImportBatchResult {
            imported: Vec::new(),
            skipped: Vec::new(),
        });
    }

    let mut buckets = ImportBuckets::default();
    for path in &paths {
        let extension = Path::new(path).extension().and_then(|ext| ext.to_str()).unwrap_or("").to_lowercase();

        if extension == "aec" {
            let mut aec = parse_aec_container(path)?;

            if !aec.outfit.is_empty() {
                remap_imported_sprites(&mut aec.outfit, state.inner())?;
                buckets.outfits.extend(aec.outfit.into_iter().map(ImportedAppearance::Proto));
            }
            if !aec.object.is_empty() {
                remap_imported_sprites(&mut aec.object, state.inner())?;
                buckets.objects.extend(aec.object.into_iter().map(ImportedAppearance::Proto));
            }
            if !aec.effect.is_empty() {
                remap_imported_sprites(&mut aec.effect, state.inner())?;
                buckets.effects.extend(aec.effect.into_iter().map(ImportedAppearance::Proto));
            }
            if !aec.missile.is_empty() {
                remap_imported_sprites(&mut aec.missile, state.inner())?;
                buckets.missiles.extend(aec.missile.into_iter().map(ImportedAppearance::Proto));
            }
        } else {
            let content = read_text_file(path)?;
            let imported: CompleteAppearanceItem = serde_json::from_str(&content).map_err(|e| format!("Failed to parse appearance JSON: {}", e))?;
            // Infer category from ID if it's not set (e.g. from older editors or incomplete data)
            let category = AppearanceCategory::Objects;
            buckets.push(category, ImportedAppearance::Complete(imported));
        }
    }

    let mut result = ImportBatchResult {
        imported: Vec::new(),
        skipped: Vec::new(),
    };
    let mut to_insert = InsertBuckets::default();

    for (category, items) in buckets.into_entries() {
        let items: Vec<ImportedAppearance> = items;
        if items.is_empty() {
            continue;
        }
        let existing_signatures = collect_existing_signatures(&category, &appearances.object, state.inner())?;
        let mut seen_signatures = existing_signatures;
        let to_import = process_import_bucket(&category, items, start_id_for_category(start_ids.as_ref(), &category), state.inner(), &mut seen_signatures, &mut result)?;
        if !to_import.is_empty() {
            to_insert.push(category, to_import);
        }
    }

    if to_insert.has_any() {
        if !to_insert.objects.is_empty() {
            let items = get_items_by_category_mut(appearances, &AppearanceCategory::Objects);
            items.extend(to_insert.objects);
            sort_by_id(items);
        }
        if !to_insert.outfits.is_empty() {
            let items = get_items_by_category_mut(appearances, &AppearanceCategory::Outfits);
            items.extend(to_insert.outfits);
            sort_by_id(items);
        }
        if !to_insert.effects.is_empty() {
            let items = get_items_by_category_mut(appearances, &AppearanceCategory::Effects);
            items.extend(to_insert.effects);
            sort_by_id(items);
        }
        if !to_insert.missiles.is_empty() {
            let items = get_items_by_category_mut(appearances, &AppearanceCategory::Missiles);
            items.extend(to_insert.missiles);
            sort_by_id(items);
        }
        rebuild_indexes(&state, appearances);
        invalidate_search_cache(&state);
    }

    Ok(result)
}

#[tauri::command]
pub async fn get_import_context(paths: Vec<String>, state: State<'_, AppState>, sounds_state: State<'_, SoundsState>) -> Result<ImportContext, String> {
    let appearances_lock = state.appearances.read();
    let appearances = appearances_lock.as_ref().ok_or_else(|| "No appearances loaded".to_string())?;

    let latest = LatestAssetIds {
        objects: max_id(&appearances.object),
        outfits: max_id(&appearances.outfit),
        effects: max_id(&appearances.effect),
        missiles: max_id(&appearances.missile),
        sounds: max_sound_id(&sounds_state)?,
    };

    let present = detect_import_presence(&paths)?;

    Ok(ImportContext {
        latest,
        present,
    })
}

#[tauri::command]
pub async fn duplicate_appearance(category: AppearanceCategory, source_id: u32, target_id: Option<u32>, state: State<'_, AppState>) -> Result<CompleteAppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    let index_map = get_index_for_category(&state, &category);

    // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
    let items = get_items_by_category(appearances, &category);
    let source = if let Some(pos) = index_map.get(&source_id) {
        items.get(*pos).ok_or_else(|| format!("Appearance {} not found in {:?}", source_id, category))?.clone()
    } else {
        return Err(format!("Appearance {} not found in {:?}", source_id, category));
    };

    let mut candidate = target_id.unwrap_or_else(|| find_next_available_id(items));
    // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
    while index_map.contains_key(&candidate) {
        candidate += 1;
    }

    let duplicate = clone_with_new_id(&source, candidate);
    let stored_id = candidate;

    {
        let items = get_items_by_category_mut(appearances, &category);
        items.push(duplicate);
        sort_by_id(items);
    } // Drop mutable borrow here

    // CRITICAL: Rebuild indexes after inserting and sorting (indexes changed)
    rebuild_indexes(&state, appearances);
    invalidate_search_cache(&state);

    // OPTIMIZATION: Use O(1) index lookup after rebuild instead of O(n) linear search
    let index_map_after = get_index_for_category(&state, &category);
    let items_after = get_items_by_category(appearances, &category);
    let stored = if let Some(pos) = index_map_after.get(&stored_id) {
        items_after.get(*pos).ok_or_else(|| "Failed to duplicate appearance".to_string())?.clone()
    } else {
        return Err("Failed to duplicate appearance".to_string());
    };

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

    let items = get_items_by_category(appearances, &category);

    let candidate = new_id.unwrap_or_else(|| find_next_available_id(items));
    let mut appearance = Appearance::default();
    appearance.id = Some(candidate);
    let name = name.map(|s| s.into_bytes());
    let description = description.map(|s| s.into_bytes());

    appearance.name = name;
    appearance.description = description;

    let stored_id = candidate;

    {
        let items = get_items_by_category_mut(appearances, &category);
        items.push(appearance);
        sort_by_id(items);
    } // Drop mutable borrow here

    // CRITICAL: Rebuild indexes after inserting and sorting (indexes changed)
    rebuild_indexes(&state, appearances);
    invalidate_search_cache(&state);

    // OPTIMIZATION: Use O(1) index lookup after rebuild instead of O(n) linear search
    let index_map_after = get_index_for_category(&state, &category);
    let items_after = get_items_by_category(appearances, &category);
    let stored = if let Some(pos) = index_map_after.get(&stored_id) {
        items_after.get(*pos).ok_or_else(|| "Failed to create appearance".to_string())?.clone()
    } else {
        return Err("Failed to create appearance".to_string());
    };

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
        let index_map = get_index_for_category(&state, &category);

        // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
        let appearance = if let Some(pos) = index_map.get(&id) {
            items.get(*pos).ok_or_else(|| format!("Appearance with ID {} not found", id))?
        } else {
            items.iter().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found", id))?
        };

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
        let index_map = get_index_for_category(&state, &category);

        // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
        let appearance = if let Some(pos) = index_map.get(&id) {
            items.get_mut(*pos).ok_or_else(|| format!("Appearance {} not found in {:?}", id, category))?
        } else {
            items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found in {:?}", id, category))?
        };

        appearance.flags = Some(complete_flags_to_proto(&flags_to_apply));
    }

    // CRITICAL: Invalidate search cache after mutating flags
    // Subcategory filtering relies on flags.market.category, so cache can be stale
    invalidate_search_cache(&state);

    Ok(flags_to_apply)
}

#[tauri::command]
pub async fn delete_appearance(category: AppearanceCategory, id: u32, state: State<'_, AppState>) -> Result<(), String> {
    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    let items = get_items_by_category_mut(appearances, &category);
    let index_map = get_index_for_category(&state, &category);

    // OPTIMIZATION: Use O(1) index lookup instead of O(n) linear search
    if let Some(pos) = index_map.get(&id) {
        items.remove(*pos);

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

fn read_text_file(path: &str) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|e| format!("Failed to read file {}: {}", path, e))?;
    if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        return String::from_utf8(bytes[3..].to_vec()).map_err(|e| format!("Failed to decode UTF-8 file {}: {}", path, e));
    }
    if bytes.starts_with(&[0xFF, 0xFE]) {
        return decode_utf16(&bytes[2..], true, path);
    }
    if bytes.starts_with(&[0xFE, 0xFF]) {
        return decode_utf16(&bytes[2..], false, path);
    }
    String::from_utf8(bytes).map_err(|e| format!("Failed to decode UTF-8 file {}: {}", path, e))
}

fn decode_utf16(bytes: &[u8], little_endian: bool, path: &str) -> Result<String, String> {
    if bytes.len() % 2 != 0 {
        return Err(format!("Failed to decode UTF-16 file {}: odd byte length", path));
    }
    let mut units = Vec::with_capacity(bytes.len() / 2);
    for chunk in bytes.chunks_exact(2) {
        let value = if little_endian {
            u16::from_le_bytes([chunk[0], chunk[1]])
        } else {
            u16::from_be_bytes([chunk[0], chunk[1]])
        };
        units.push(value);
    }
    String::from_utf16(&units).map_err(|e| format!("Failed to decode UTF-16 file {}: {}", path, e))
}

enum ImportedAppearance {
    Complete(CompleteAppearanceItem),
    Proto(Appearance),
}

impl ImportedAppearance {
    fn id(&self) -> u32 {
        match self {
            ImportedAppearance::Complete(item) => item.id,
            ImportedAppearance::Proto(item) => item.id.unwrap_or(0),
        }
    }

    fn into_proto(self, target_id: u32) -> Appearance {
        match self {
            ImportedAppearance::Complete(mut item) => {
                item.id = target_id;
                complete_to_protobuf(&item)
            }
            ImportedAppearance::Proto(mut item) => {
                item.id = Some(target_id);
                item
            }
        }
    }
}

#[derive(Default)]
struct ImportBuckets {
    objects: Vec<ImportedAppearance>,
    outfits: Vec<ImportedAppearance>,
    effects: Vec<ImportedAppearance>,
    missiles: Vec<ImportedAppearance>,
}

impl ImportBuckets {
    fn push(&mut self, category: AppearanceCategory, item: ImportedAppearance) {
        match category {
            AppearanceCategory::Objects => self.objects.push(item),
            AppearanceCategory::Outfits => self.outfits.push(item),
            AppearanceCategory::Effects => self.effects.push(item),
            AppearanceCategory::Missiles => self.missiles.push(item),
        }
    }

    fn into_entries(self) -> Vec<(AppearanceCategory, Vec<ImportedAppearance>)> {
        vec![(AppearanceCategory::Objects, self.objects), (AppearanceCategory::Outfits, self.outfits), (AppearanceCategory::Effects, self.effects), (AppearanceCategory::Missiles, self.missiles)]
    }
}

#[derive(Default)]
struct InsertBuckets {
    objects: Vec<Appearance>,
    outfits: Vec<Appearance>,
    effects: Vec<Appearance>,
    missiles: Vec<Appearance>,
}

impl InsertBuckets {
    fn push(&mut self, category: AppearanceCategory, items: Vec<Appearance>) {
        match category {
            AppearanceCategory::Objects => self.objects.extend(items),
            AppearanceCategory::Outfits => self.outfits.extend(items),
            AppearanceCategory::Effects => self.effects.extend(items),
            AppearanceCategory::Missiles => self.missiles.extend(items),
        }
    }

    fn has_any(&self) -> bool {
        !self.objects.is_empty() || !self.outfits.is_empty() || !self.effects.is_empty() || !self.missiles.is_empty()
    }
}

fn appearance_signature_from_import(imported: &ImportedAppearance, state: &AppState) -> Result<u64, String> {
    let mut appearance = match imported {
        ImportedAppearance::Complete(item) => complete_to_protobuf(item),
        ImportedAppearance::Proto(item) => item.clone(),
    };
    appearance.id = Some(0);
    appearance_signature(&appearance, state)
}

fn collect_existing_signatures(_category: &AppearanceCategory, existing_items: &[Appearance], state: &AppState) -> Result<HashSet<u64>, String> {
    if state.imported_sprites.is_empty() {
        return Ok(HashSet::new());
    }

    let mut existing_signatures = HashSet::new();
    for appearance in existing_items {
        if appearance_uses_imported_sprites(appearance, state) {
            if let Ok(signature) = appearance_signature(appearance, state) {
                existing_signatures.insert(signature);
            }
        }
    }
    Ok(existing_signatures)
}

fn process_import_bucket(
    category: &AppearanceCategory,
    items: Vec<ImportedAppearance>,
    start_id: Option<u32>,
    state: &AppState,
    seen_signatures: &mut HashSet<u64>,
    result: &mut ImportBatchResult,
) -> Result<Vec<Appearance>, String> {
    let index_map = get_index_for_category(&state, &category);
    let mut seen_ids: HashSet<u32> = index_map.iter().map(|entry| *entry.key()).collect();
    let mut to_insert = Vec::new();

    for (idx, imported) in items.into_iter().enumerate() {
        let target_id = match start_id {
            Some(start) => start.checked_add(idx as u32).ok_or_else(|| "Start ID overflow".to_string())?,
            None => imported.id(),
        };

        if seen_ids.contains(&target_id) {
            result.skipped.push(target_id);
            continue;
        }

        let signature = appearance_signature_from_import(&imported, state)?;
        if !seen_signatures.insert(signature) {
            result.skipped.push(target_id);
            continue;
        }

        let proto = imported.into_proto(target_id);
        seen_ids.insert(target_id);
        result.imported.push(target_id);
        to_insert.push(proto);
    }

    Ok(to_insert)
}

pub fn appearance_signature(appearance: &Appearance, state: &AppState) -> Result<u64, String> {
    let mut hasher = DefaultHasher::new();

    if let Some(flags) = &appearance.flags {
        let mut buf = Vec::new();
        flags.encode(&mut buf).map_err(|e| format!("Failed to encode flags: {}", e))?;
        buf.hash(&mut hasher);
    }

    for fg in appearance.frame_group.iter() {
        fg.fixed_frame_group.hash(&mut hasher);
        fg.id.hash(&mut hasher);

        if let Some(info) = &fg.sprite_info {
            info.pattern_width.hash(&mut hasher);
            info.pattern_height.hash(&mut hasher);
            info.pattern_depth.hash(&mut hasher);
            info.layers.hash(&mut hasher);
            info.bounding_square.hash(&mut hasher);
            info.is_opaque.hash(&mut hasher);
            for bbox in info.bounding_box_per_direction.iter() {
                bbox.x.hash(&mut hasher);
                bbox.y.hash(&mut hasher);
                bbox.width.hash(&mut hasher);
                bbox.height.hash(&mut hasher);
            }
            if let Some(anim) = info.animation.as_ref() {
                anim.synchronized.hash(&mut hasher);
                anim.loop_type.hash(&mut hasher);
                anim.loop_count.hash(&mut hasher);
                anim.sprite_phase.len().hash(&mut hasher);
            }
        }
    }

    let sprite_loader_lock = state.sprite_loader.read();
    let sprite_loader = sprite_loader_lock.as_ref().ok_or_else(|| "No sprite loaded for signature".to_string())?;

    for fg in &appearance.frame_group {
        if let Some(info) = &fg.sprite_info {
            for sprite_id in &info.sprite_id {
                let bytes = if let Some(mem_bytes) = state.imported_sprites.get(sprite_id) {
                    mem_bytes.clone()
                } else {
                    let sprite = sprite_loader.get_sprite(*sprite_id).map_err(|e| format!("Failed getting sprite {}: {}", sprite_id, e))?;
                    sprite.to_png_bytes().map_err(|e| format!("Failed to export png: {}", e))?
                };
                bytes.hash(&mut hasher);
            }
        }
    }

    Ok(hasher.finish())
}

fn appearance_uses_imported_sprites(appearance: &Appearance, state: &AppState) -> bool {
    for sprite_id in appearance.frame_group.iter().filter_map(|fg| fg.sprite_info.as_ref()).flat_map(|info| info.sprite_id.iter().copied()) {
        if state.imported_sprites.contains_key(&sprite_id) {
            return true;
        }
    }
    false
}

fn parse_aec_items(path: &str, category: &AppearanceCategory) -> Result<Vec<Appearance>, String> {
    let bytes = fs::read(path).map_err(|e| format!("Failed to read file {}: {}", path, e))?;
    let appearances = Appearances::decode(bytes.as_slice()).map_err(|e| format!("Failed to decode AEC: {}", e))?;

    let items = match category {
        AppearanceCategory::Objects => appearances.object,
        AppearanceCategory::Outfits => appearances.outfit,
        AppearanceCategory::Effects => appearances.effect,
        AppearanceCategory::Missiles => appearances.missile,
    };

    Ok(items)
}

fn parse_aec_container(path: &str) -> Result<Appearances, String> {
    let bytes = fs::read(path).map_err(|e| format!("Failed to read file {}: {}", path, e))?;
    Appearances::decode(bytes.as_slice()).map_err(|e| format!("Failed to decode AEC: {}", e))
}

fn max_id(items: &[Appearance]) -> u32 {
    items.iter().map(|appearance| appearance.id.unwrap_or(0)).max().unwrap_or(0)
}

fn max_sound_id(state: &State<'_, SoundsState>) -> Result<u32, String> {
    let parser = state.parser.lock().map_err(|e| e.to_string())?;
    let data = match parser.get_sounds_data() {
        Some(data) => data,
        None => return Ok(0),
    };

    Ok(data.sounds.iter().map(|sound| sound.id).max().unwrap_or(0))
}

fn start_id_for_category(start_ids: Option<&ImportStartIds>, category: &AppearanceCategory) -> Option<u32> {
    let start_ids = start_ids?;
    match category {
        AppearanceCategory::Objects => start_ids.objects,
        AppearanceCategory::Outfits => start_ids.outfits,
        AppearanceCategory::Effects => start_ids.effects,
        AppearanceCategory::Missiles => start_ids.missiles,
    }
}

fn detect_import_presence(paths: &[String]) -> Result<ImportPresence, String> {
    let mut presence = ImportPresence {
        objects: false,
        outfits: false,
        effects: false,
        missiles: false,
    };

    for path in paths {
        let extension = Path::new(path).extension().and_then(|ext| ext.to_str()).unwrap_or("").to_lowercase();

        if extension == "aec" {
            let container = parse_aec_container(path)?;
            if !container.object.is_empty() {
                presence.objects = true;
            }
            if !container.outfit.is_empty() {
                presence.outfits = true;
            }
            if !container.effect.is_empty() {
                presence.effects = true;
            }
            if !container.missile.is_empty() {
                presence.missiles = true;
            }
        } else {
            let content = read_text_file(path)?;
            let _imported: CompleteAppearanceItem = serde_json::from_str(&content).map_err(|e| format!("Failed to parse appearance JSON: {}", e))?;
            // JSON imports default to Objects category
            presence.objects = true;
        }
    }

    Ok(presence)
}

fn remap_imported_sprites(appearances: &mut [Appearance], state: &AppState) -> Result<(), String> {
    let total_sprites: usize = appearances.iter().map(|appearance| appearance.frame_group.iter().filter_map(|fg| fg.sprite_info.as_ref()).map(|info| info.sprite_id.len()).sum::<usize>()).sum();
    if total_sprites == 0 {
        return Ok(());
    }

    let mut unique_sprites: Vec<Vec<u8>> = Vec::new();
    let mut hash_lookup: HashMap<u64, usize> = HashMap::new();
    let mut ordered_map: Vec<usize> = Vec::with_capacity(total_sprites);

    for appearance in appearances.iter() {
        let sprite_loader_lock = state.sprite_loader.read();
        let sprite_loader = sprite_loader_lock.as_ref();

        let sprite_ids: Vec<u32> = appearance.frame_group.iter().filter_map(|fg| fg.sprite_info.as_ref()).flat_map(|info| info.sprite_id.iter().copied()).collect();
        for sprite_id in sprite_ids {
            let sprite_bytes = if let Some(mem_bytes) = state.imported_sprites.get(&sprite_id) {
                mem_bytes.clone()
            } else if let Some(loader) = sprite_loader {
                if let Ok(sprite) = loader.get_sprite(sprite_id) {
                    sprite.to_png_bytes().unwrap_or_default()
                } else {
                    Vec::new()
                }
            } else {
                Vec::new()
            };

            if sprite_bytes.is_empty() {
                continue;
            }

            let mut hasher = AHasher::default();
            sprite_bytes.hash(&mut hasher);
            let hash = hasher.finish();

            let unique_index = if let Some(&idx) = hash_lookup.get(&hash) {
                if unique_sprites.get(idx).map_or(false, |existing| existing == &sprite_bytes) {
                    idx
                } else {
                    let new_idx = unique_sprites.len();
                    unique_sprites.push(sprite_bytes.clone());
                    hash_lookup.insert(hash, new_idx);
                    new_idx
                }
            } else {
                let new_idx = unique_sprites.len();
                unique_sprites.push(sprite_bytes.clone());
                hash_lookup.insert(hash, new_idx);
                new_idx
            };

            ordered_map.push(unique_index);
        }
    }

    let mut unique_ids: Vec<u32> = Vec::with_capacity(unique_sprites.len());
    for sprite_bytes in unique_sprites.into_iter() {
        let mut hasher = AHasher::default();
        sprite_bytes.hash(&mut hasher);
        let hash = hasher.finish();

        if let Some(existing_id) = state.imported_sprite_hashes.get(&hash) {
            if let Some(existing_bytes) = state.imported_sprites.get(existing_id.value()) {
                if existing_bytes.value().as_slice() == sprite_bytes.as_slice() {
                    unique_ids.push(*existing_id.value());
                    continue;
                }
            }
        }

        let new_id = next_imported_sprite_id(state)?;
        state.imported_sprites.insert(new_id, sprite_bytes);
        state.imported_sprite_hashes.insert(hash, new_id);
        unique_ids.push(new_id);
    }

    let mut remap_index = 0usize;
    for appearance in appearances.iter_mut() {
        for fg in appearance.frame_group.iter_mut() {
            if let Some(info) = fg.sprite_info.as_mut() {
                for sprite_id in info.sprite_id.iter_mut() {
                    if remap_index < ordered_map.len() {
                        let unique_index = ordered_map[remap_index];
                        *sprite_id = unique_ids.get(unique_index).copied().unwrap_or(0);
                    } else {
                        *sprite_id = 0;
                    }
                    remap_index += 1;
                }
            }
        }
    }

    Ok(())
}

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
