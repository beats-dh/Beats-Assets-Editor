use super::conversion::{clone_with_new_id, complete_flags_to_proto, complete_to_protobuf};
use super::types::AppearanceCategory;
use crate::commands::{AppState, CompleteAppearanceItem, CompleteFlags};
use crate::core::protobuf::{Appearance, Appearances};
use serde::Deserialize;
use std::fs;
use std::path::Path;
use tauri::State;

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

#[tauri::command]
pub async fn export_appearance_to_json(
    category: AppearanceCategory,
    id: u32,
    path: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let appearances_lock = state.appearances.lock().unwrap();
    let appearances = appearances_lock
        .as_ref()
        .ok_or_else(|| "No appearances loaded".to_string())?;

    let items = get_items_by_category(appearances, &category);

    let appearance = items
        .iter()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found", id))?;

    let complete = CompleteAppearanceItem::from_protobuf(appearance);
    let json = serde_json::to_string_pretty(&complete)
        .map_err(|e| format!("Failed to serialize appearance: {}", e))?;

    if let Some(parent) = Path::new(&path).parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory {:?}: {}", parent, e))?;
        }
    }

    fs::write(&path, json).map_err(|e| format!("Failed to write file {}: {}", path, e))?;

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
    let mut appearances_lock = state.appearances.lock().unwrap();
    let appearances = appearances_lock
        .as_mut()
        .ok_or_else(|| "No appearances loaded".to_string())?;

    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read file {}: {}", path, e))?;

    let mut imported: CompleteAppearanceItem = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse appearance JSON: {}", e))?;

    let mode = mode.unwrap_or_default();

    let items = get_items_by_category_mut(appearances, &category);

    let assigned_id = match mode {
        ImportMode::Replace => {
            let target_id = new_id.unwrap_or(imported.id);
            imported.id = target_id;
            if !items.iter().any(|app| app.id.unwrap_or(0) == target_id) {
                return Err(format!(
                    "Cannot replace appearance {}; ID not found in {:?}",
                    target_id, category
                ));
            }
            target_id
        }
        ImportMode::New => {
            let mut candidate = new_id.unwrap_or_else(|| find_next_available_id(items));
            while items.iter().any(|app| app.id.unwrap_or(0) == candidate) {
                candidate += 1;
            }
            imported.id = candidate;
            candidate
        }
    };

    let proto = complete_to_protobuf(&imported);

    match mode {
        ImportMode::Replace => {
            if let Some(pos) = items
                .iter()
                .position(|app| app.id.unwrap_or(0) == assigned_id)
            {
                items[pos] = proto;
            }
        }
        ImportMode::New => {
            items.push(proto);
            sort_by_id(items);
        }
    }

    let stored = items
        .iter()
        .find(|app| app.id.unwrap_or(0) == imported.id)
        .cloned()
        .ok_or_else(|| "Failed to store imported appearance".to_string())?;

    Ok(CompleteAppearanceItem::from_protobuf(&stored))
}

#[tauri::command]
pub async fn duplicate_appearance(
    category: AppearanceCategory,
    source_id: u32,
    target_id: Option<u32>,
    state: State<'_, AppState>,
) -> Result<CompleteAppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();
    let appearances = appearances_lock
        .as_mut()
        .ok_or_else(|| "No appearances loaded".to_string())?;

    let items = get_items_by_category_mut(appearances, &category);

    let source = items
        .iter()
        .find(|app| app.id.unwrap_or(0) == source_id)
        .cloned()
        .ok_or_else(|| format!("Appearance {} not found in {:?}", source_id, category))?;

    let mut candidate = target_id.unwrap_or_else(|| find_next_available_id(items));
    while items.iter().any(|app| app.id.unwrap_or(0) == candidate) {
        candidate += 1;
    }

    let duplicate = clone_with_new_id(&source, candidate);
    items.push(duplicate);
    sort_by_id(items);

    let stored = items
        .iter()
        .find(|app| app.id.unwrap_or(0) == candidate)
        .cloned()
        .ok_or_else(|| "Failed to duplicate appearance".to_string())?;

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
    let mut appearances_lock = state.appearances.lock().unwrap();
    let appearances = appearances_lock
        .as_mut()
        .ok_or_else(|| "No appearances loaded".to_string())?;

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

    let stored = items
        .iter()
        .find(|app| app.id.unwrap_or(0) == candidate)
        .cloned()
        .ok_or_else(|| "Failed to create appearance".to_string())?;

    Ok(CompleteAppearanceItem::from_protobuf(&stored))
}

#[tauri::command]
pub async fn copy_appearance_flags(
    category: AppearanceCategory,
    id: u32,
    state: State<'_, AppState>,
) -> Result<CompleteFlags, String> {
    let copied_flags = {
        let appearances_lock = state.appearances.lock().unwrap();
        let appearances = appearances_lock
            .as_ref()
            .ok_or_else(|| "No appearances loaded".to_string())?;

        let items = get_items_by_category(appearances, &category);
        let appearance = items
            .iter()
            .find(|app| app.id.unwrap_or(0) == id)
            .ok_or_else(|| format!("Appearance with ID {} not found", id))?;

        let flags = appearance
            .flags
            .as_ref()
            .ok_or_else(|| "Appearance has no flags to copy".to_string())?;

        CompleteFlags::from_protobuf(flags)
    };

    {
        let mut clipboard = state.flags_clipboard.lock().unwrap();
        *clipboard = Some(copied_flags.clone());
    }

    Ok(copied_flags)
}

#[tauri::command]
pub async fn paste_appearance_flags(
    category: AppearanceCategory,
    id: u32,
    state: State<'_, AppState>,
) -> Result<CompleteFlags, String> {
    let flags_to_apply = {
        let clipboard = state.flags_clipboard.lock().unwrap();
        clipboard
            .clone()
            .ok_or_else(|| "Flag clipboard is empty".to_string())?
    };

    {
        let mut appearances_lock = state.appearances.lock().unwrap();
        let appearances = appearances_lock
            .as_mut()
            .ok_or_else(|| "No appearances loaded".to_string())?;

        let items = get_items_by_category_mut(appearances, &category);
        let appearance = items
            .iter_mut()
            .find(|app| app.id.unwrap_or(0) == id)
            .ok_or_else(|| format!("Appearance {} not found in {:?}", id, category))?;

        appearance.flags = Some(complete_flags_to_proto(&flags_to_apply));
    }

    Ok(flags_to_apply)
}

#[tauri::command]
pub async fn delete_appearance(
    category: AppearanceCategory,
    id: u32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut appearances_lock = state.appearances.lock().unwrap();
    let appearances = appearances_lock
        .as_mut()
        .ok_or_else(|| "No appearances loaded".to_string())?;

    let items = get_items_by_category_mut(appearances, &category);
    if let Some(pos) = items.iter().position(|app| app.id.unwrap_or(0) == id) {
        items.remove(pos);
        Ok(())
    } else {
        Err(format!("Appearance {} not found in {:?}", id, category))
    }
}

fn get_items_by_category<'a>(
    appearances: &'a Appearances,
    category: &AppearanceCategory,
) -> &'a Vec<Appearance> {
    match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    }
}

fn get_items_by_category_mut<'a>(
    appearances: &'a mut Appearances,
    category: &AppearanceCategory,
) -> &'a mut Vec<Appearance> {
    match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    }
}

fn find_next_available_id(items: &[Appearance]) -> u32 {
    items
        .iter()
        .map(|app| app.id.unwrap_or(0))
        .max()
        .unwrap_or(0)
        .saturating_add(1)
}

fn sort_by_id(items: &mut Vec<Appearance>) {
    items.sort_by_key(|app| app.id.unwrap_or(u32::MAX));
}
