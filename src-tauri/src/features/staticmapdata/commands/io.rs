use crate::features::staticmapdata::parsers::{load_staticmapdata, get_statistics, StaticMapDataStats};
use crate::core::protobuf::staticmapdata::HouseDetail;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub fn load_staticmapdata_file(path: String, state: State<'_, AppState>) -> Result<StaticMapDataStats, String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    match load_staticmapdata(&path_buf) {
        Ok(staticmapdata) => {
            let stats = get_statistics(&staticmapdata);
            *state.staticmapdata.write() = Some(staticmapdata);
            Ok(stats)
        }
        Err(e) => Err(format!("Failed to parse staticmapdata: {}", e)),
    }
}

#[tauri::command]
pub fn get_staticmapdata_houses(state: State<'_, AppState>) -> Result<Vec<HouseDetail>, String> {
    let staticmapdata_lock = state.staticmapdata.read();
    match &*staticmapdata_lock {
        Some(sd) => Ok(sd.houses.clone()),
        None => Err("No staticmapdata loaded".to_string()),
    }
}

#[tauri::command]
pub async fn list_staticmapdata_files(tibia_path: String) -> Result<Vec<String>, String> {
    use std::fs;
    let assets_path = PathBuf::from(tibia_path).join("assets");
    let entries = fs::read_dir(&assets_path).map_err(|e| format!("Failed to read assets directory: {}", e))?;
    let mut files_data: Vec<(String, u64)> = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if let Some(file_name) = path.file_name() {
            let file_name_str = file_name.to_string_lossy().to_string();
            if file_name_str.starts_with("staticmapdata-") && file_name_str.ends_with(".dat") {
                let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
                files_data.push((file_name_str, size));
            }
        }
    }
    
    files_data.sort_by(|(_, size_a), (_, size_b)| size_b.cmp(size_a));
    Ok(files_data.into_iter().map(|(name, _)| name).collect())
}
