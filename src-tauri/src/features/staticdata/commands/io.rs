use crate::features::staticdata::parsers::{doc_statistics, load_staticdata, load_staticdata_doc, save_staticdata_doc, StaticDataDoc, StaticDataStats};
use crate::state::AppState;
use std::path::PathBuf;
use tauri::State;

// The staticdata browser reads/edits/saves the version-detected document
// (`state.staticdata_doc`), which transparently handles both the legacy schema
// and the newer client schema. Because the per-category message shapes share
// field names across schemas, getters return `serde_json::Value` (identical JSON
// either way) and updaters accept `serde_json::Value` (deserialized into the
// loaded schema's type). `state.staticdata` keeps a legacy decode purely so the
// DAT-merge feature keeps working unchanged.

#[tauri::command]
pub fn load_staticdata_file(path: String, state: State<'_, AppState>) -> Result<StaticDataStats, String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    let doc = load_staticdata_doc(&path_buf).map_err(|e| format!("Failed to parse staticdata: {}", e))?;
    let stats = doc_statistics(&doc);

    // Best-effort legacy decode for the DAT-merge feature (it operates on the
    // legacy schema). Never fatal — the browser uses the versioned doc.
    if let Ok(legacy) = load_staticdata(&path_buf) {
        *state.staticdata.write() = Some(legacy);
    }
    *state.staticdata_doc.write() = Some(doc);
    Ok(stats)
}

/// Serialize a slice to JSON (the frontend receives the same shape for both
/// schemas because the per-category messages share field names).
fn to_json<T: serde::Serialize>(items: &[T]) -> Result<serde_json::Value, String> {
    serde_json::to_value(items).map_err(|e| e.to_string())
}

/// Upsert `item` (by `id`) into a category vector of the loaded schema.
fn upsert<T: serde::de::DeserializeOwned>(vec: &mut Vec<T>, item: serde_json::Value, get_id: impl Fn(&T) -> Option<u32>) -> Result<(), String> {
    let parsed: T = serde_json::from_value(item).map_err(|e| format!("Invalid item: {}", e))?;
    let id = get_id(&parsed).ok_or("Item must have an ID")?;
    if let Some(pos) = vec.iter().position(|x| get_id(x) == Some(id)) {
        vec[pos] = parsed;
    } else {
        vec.push(parsed);
    }
    Ok(())
}

macro_rules! getter {
    ($name:ident, $new_field:ident, $old_field:ident) => {
        #[tauri::command]
        pub fn $name(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
            let lock = state.staticdata_doc.read();
            match &*lock {
                Some(StaticDataDoc::New(n)) => to_json(&n.$new_field),
                Some(StaticDataDoc::Old(o)) => to_json(&o.$old_field),
                None => Err("No staticdata loaded".to_string()),
            }
        }
    };
}

// Legacy category labels map to the new schema's equivalents:
//   creatures→monsters, titles→achievements, houses, bosses, quests.
getter!(get_staticdata_creatures, monsters, creatures);
getter!(get_staticdata_titles, achievements, titles);
getter!(get_staticdata_houses, houses, houses);
getter!(get_staticdata_bosses, bosses, bosses);
getter!(get_staticdata_quests, quests, quests);

/// New-schema-only category (legacy files have none → empty list).
#[tauri::command]
pub fn get_staticdata_monster_classes(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let lock = state.staticdata_doc.read();
    match &*lock {
        Some(StaticDataDoc::New(n)) => to_json(&n.monster_classes),
        Some(StaticDataDoc::Old(_)) => Ok(serde_json::Value::Array(Vec::new())),
        None => Err("No staticdata loaded".to_string()),
    }
}

#[tauri::command]
pub async fn list_staticdata_files(tibia_path: String) -> Result<Vec<String>, String> {
    use std::fs;
    let assets_path = PathBuf::from(tibia_path).join("assets");
    let entries = fs::read_dir(&assets_path).map_err(|e| format!("Failed to read assets directory: {}", e))?;
    let mut files_data: Vec<(String, u64)> = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if let Some(file_name) = path.file_name() {
            let file_name_str = file_name.to_string_lossy().to_string();
            if file_name_str.starts_with("staticdata-") && file_name_str.ends_with(".dat") {
                let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
                files_data.push((file_name_str, size));
            }
        }
    }

    files_data.sort_by(|(_, size_a), (_, size_b)| size_b.cmp(size_a));
    Ok(files_data.into_iter().map(|(name, _)| name).collect())
}

#[tauri::command]
pub fn save_staticdata_file(path: String, state: State<'_, AppState>) -> Result<(), String> {
    let lock = state.staticdata_doc.read();
    match &*lock {
        Some(doc) => save_staticdata_doc(path, doc).map_err(|e| format!("Failed to save staticdata: {}", e)),
        None => Err("No staticdata loaded to save".to_string()),
    }
}

#[tauri::command]
pub fn remove_staticdata_item(category: String, id: u32, state: State<'_, AppState>) -> Result<(), String> {
    let mut lock = state.staticdata_doc.write();
    let doc = lock.as_mut().ok_or("No staticdata loaded")?;
    match doc {
        StaticDataDoc::New(n) => match category.as_str() {
            "creatures" => n.monsters.retain(|x| x.id != Some(id)),
            "bosses" => n.bosses.retain(|x| x.id != Some(id)),
            "quests" => n.quests.retain(|x| x.id != Some(id)),
            "titles" => n.achievements.retain(|x| x.id != Some(id)),
            "monster_classes" => n.monster_classes.retain(|x| x.id != Some(id)),
            _ => return Err(format!("Category {} is not supported for removal", category)),
        },
        StaticDataDoc::Old(o) => match category.as_str() {
            "creatures" => o.creatures.retain(|x| x.id != Some(id)),
            "bosses" => o.bosses.retain(|x| x.id != Some(id)),
            "quests" => o.quests.retain(|x| x.id != Some(id)),
            "titles" => o.titles.retain(|x| x.id != Some(id)),
            _ => return Err(format!("Category {} is not supported for removal", category)),
        },
    }
    Ok(())
}

#[tauri::command]
pub fn update_staticdata_creature(item: serde_json::Value, state: State<'_, AppState>) -> Result<(), String> {
    let mut lock = state.staticdata_doc.write();
    let doc = lock.as_mut().ok_or("No staticdata loaded")?;
    match doc {
        StaticDataDoc::New(n) => upsert(&mut n.monsters, item, |x| x.id),
        StaticDataDoc::Old(o) => upsert(&mut o.creatures, item, |x| x.id),
    }
}

#[tauri::command]
pub fn update_staticdata_boss(item: serde_json::Value, state: State<'_, AppState>) -> Result<(), String> {
    let mut lock = state.staticdata_doc.write();
    let doc = lock.as_mut().ok_or("No staticdata loaded")?;
    match doc {
        StaticDataDoc::New(n) => upsert(&mut n.bosses, item, |x| x.id),
        StaticDataDoc::Old(o) => upsert(&mut o.bosses, item, |x| x.id),
    }
}

#[tauri::command]
pub fn update_staticdata_quest(item: serde_json::Value, state: State<'_, AppState>) -> Result<(), String> {
    let mut lock = state.staticdata_doc.write();
    let doc = lock.as_mut().ok_or("No staticdata loaded")?;
    match doc {
        StaticDataDoc::New(n) => upsert(&mut n.quests, item, |x| x.id),
        StaticDataDoc::Old(o) => upsert(&mut o.quests, item, |x| x.id),
    }
}

#[tauri::command]
pub fn update_staticdata_title(item: serde_json::Value, state: State<'_, AppState>) -> Result<(), String> {
    let mut lock = state.staticdata_doc.write();
    let doc = lock.as_mut().ok_or("No staticdata loaded")?;
    match doc {
        StaticDataDoc::New(n) => upsert(&mut n.achievements, item, |x| x.id),
        StaticDataDoc::Old(o) => upsert(&mut o.titles, item, |x| x.id),
    }
}

/// New-schema-only category editor (no-op on legacy files).
#[tauri::command]
pub fn update_staticdata_monster_class(item: serde_json::Value, state: State<'_, AppState>) -> Result<(), String> {
    let mut lock = state.staticdata_doc.write();
    let doc = lock.as_mut().ok_or("No staticdata loaded")?;
    match doc {
        StaticDataDoc::New(n) => upsert(&mut n.monster_classes, item, |x| x.id),
        StaticDataDoc::Old(_) => Err("monster_classes only exist in the new client schema".to_string()),
    }
}
