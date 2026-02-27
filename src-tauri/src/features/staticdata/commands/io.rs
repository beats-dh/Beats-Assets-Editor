use crate::features::staticdata::parsers::{load_staticdata, save_staticdata, get_statistics, StaticDataStats};
use crate::core::protobuf::staticdata::{CreatureType, Title, HouseData, BossData, QuestData};
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub fn load_staticdata_file(path: String, state: State<'_, AppState>) -> Result<StaticDataStats, String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    match load_staticdata(&path_buf) {
        Ok(staticdata) => {
            let stats = get_statistics(&staticdata);
            *state.staticdata.write() = Some(staticdata);
            Ok(stats)
        }
        Err(e) => Err(format!("Failed to parse staticdata: {}", e)),
    }
}

#[tauri::command]
pub fn get_staticdata_creatures(state: State<'_, AppState>) -> Result<Vec<CreatureType>, String> {
    let staticdata_lock = state.staticdata.read();
    match &*staticdata_lock {
        Some(sd) => Ok(sd.creatures.clone()),
        None => Err("No staticdata loaded".to_string()),
    }
}

#[tauri::command]
pub fn get_staticdata_titles(state: State<'_, AppState>) -> Result<Vec<Title>, String> {
    let staticdata_lock = state.staticdata.read();
    match &*staticdata_lock {
        Some(sd) => Ok(sd.titles.clone()),
        None => Err("No staticdata loaded".to_string()),
    }
}

#[tauri::command]
pub fn get_staticdata_houses(state: State<'_, AppState>) -> Result<Vec<HouseData>, String> {
    let staticdata_lock = state.staticdata.read();
    match &*staticdata_lock {
        Some(sd) => Ok(sd.houses.clone()),
        None => Err("No staticdata loaded".to_string()),
    }
}

#[tauri::command]
pub fn get_staticdata_bosses(state: State<'_, AppState>) -> Result<Vec<BossData>, String> {
    let staticdata_lock = state.staticdata.read();
    match &*staticdata_lock {
        Some(sd) => Ok(sd.bosses.clone()),
        None => Err("No staticdata loaded".to_string()),
    }
}

#[tauri::command]
pub fn get_staticdata_quests(state: State<'_, AppState>) -> Result<Vec<QuestData>, String> {
    let staticdata_lock = state.staticdata.read();
    match &*staticdata_lock {
        Some(sd) => Ok(sd.quests.clone()),
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
    let staticdata_lock = state.staticdata.read();
    match &*staticdata_lock {
        Some(sd) => {
            save_staticdata(path, sd).map_err(|e| format!("Failed to save staticdata: {}", e))
        }
        None => Err("No staticdata loaded to save".to_string())
    }
}

#[tauri::command]
pub fn remove_staticdata_item(category: String, id: u32, state: State<'_, AppState>) -> Result<(), String> {
    let mut staticdata_lock = state.staticdata.write();
    if let Some(sd) = staticdata_lock.as_mut() {
        match category.as_str() {
            "creatures" => sd.creatures.retain(|x| x.id != Some(id)),
            "bosses" => sd.bosses.retain(|x| x.id != Some(id)),
            "quests" => sd.quests.retain(|x| x.id != Some(id)),
            "titles" => sd.titles.retain(|x| x.id != Some(id)),
            _ => return Err(format!("Category {} is not supported for removal", category)),
        }
        Ok(())
    } else {
        Err("No staticdata loaded".to_string())
    }
}

#[tauri::command]
pub fn update_staticdata_creature(item: CreatureType, state: State<'_, AppState>) -> Result<(), String> {
    let mut staticdata_lock = state.staticdata.write();
    if let Some(sd) = staticdata_lock.as_mut() {
        if let Some(id) = item.id {
            if let Some(pos) = sd.creatures.iter().position(|x| x.id == Some(id)) {
                sd.creatures[pos] = item;
            } else {
                sd.creatures.push(item);
            }
            Ok(())
        } else {
            Err("Item must have an ID".to_string())
        }
    } else {
        Err("No staticdata loaded".to_string())
    }
}

#[tauri::command]
pub fn update_staticdata_boss(item: BossData, state: State<'_, AppState>) -> Result<(), String> {
    let mut staticdata_lock = state.staticdata.write();
    if let Some(sd) = staticdata_lock.as_mut() {
        if let Some(id) = item.id {
            if let Some(pos) = sd.bosses.iter().position(|x| x.id == Some(id)) {
                sd.bosses[pos] = item;
            } else {
                sd.bosses.push(item);
            }
            Ok(())
        } else {
            Err("Item must have an ID".to_string())
        }
    } else {
        Err("No staticdata loaded".to_string())
    }
}

#[tauri::command]
pub fn update_staticdata_quest(item: QuestData, state: State<'_, AppState>) -> Result<(), String> {
    let mut staticdata_lock = state.staticdata.write();
    if let Some(sd) = staticdata_lock.as_mut() {
        if let Some(id) = item.id {
            if let Some(pos) = sd.quests.iter().position(|x| x.id == Some(id)) {
                sd.quests[pos] = item;
            } else {
                sd.quests.push(item);
            }
            Ok(())
        } else {
            Err("Item must have an ID".to_string())
        }
    } else {
        Err("No staticdata loaded".to_string())
    }
}

#[tauri::command]
pub fn update_staticdata_title(item: Title, state: State<'_, AppState>) -> Result<(), String> {
    let mut staticdata_lock = state.staticdata.write();
    if let Some(sd) = staticdata_lock.as_mut() {
        if let Some(id) = item.id {
            if let Some(pos) = sd.titles.iter().position(|x| x.id == Some(id)) {
                sd.titles[pos] = item;
            } else {
                sd.titles.push(item);
            }
            Ok(())
        } else {
            Err("Item must have an ID".to_string())
        }
    } else {
        Err("No staticdata loaded".to_string())
    }
}
