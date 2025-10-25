use std::path::PathBuf;
use tauri::State;
use crate::commands::AppState;
use crate::core::{load_appearances, get_statistics, AppearanceStats};

#[tauri::command]
pub async fn load_appearances_file(
    path: String,
    state: State<'_, AppState>,
) -> Result<AppearanceStats, String> {
    log::info!("Loading appearances from: {}", path);

    let appearances = load_appearances(&path)
        .map_err(|e| format!("Failed to load appearances: {}", e))?;

    let stats = get_statistics(&appearances);

    // Store in state
    *state.appearances.lock().unwrap() = Some(appearances);
    *state.tibia_path.lock().unwrap() = Some(PathBuf::from(path));

    Ok(stats)
}

/// Get current statistics
#[tauri::command]
pub async fn get_appearance_stats(
    state: State<'_, AppState>,
) -> Result<AppearanceStats, String> {
    let appearances_lock = state.appearances.lock().unwrap();

    match &*appearances_lock {
        Some(appearances) => Ok(get_statistics(appearances)),
        None => Err("No appearances loaded".to_string()),
    }
}

/// Select Tibia client directory
#[tauri::command]
pub async fn select_tibia_directory() -> Result<String, String> {
    // This will be implemented with tauri dialog plugin
    // For now, try to detect common Tibia installation paths
    let common_paths = vec![
        r"C:\Program Files\Tibia",
        r"C:\Program Files (x86)\Tibia",
        r"C:\Users\Public\Tibia",
    ];

    for path in common_paths {
        if std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    // Fallback to a default path
    Ok(r"C:\Program Files\Tibia".to_string())
}

/// List available appearance files in Tibia directory
#[tauri::command]
pub async fn list_appearance_files(
    tibia_path: String,
) -> Result<Vec<String>, String> {
    use std::fs;

    let assets_path = PathBuf::from(tibia_path).join("assets");

    let entries = fs::read_dir(&assets_path)
        .map_err(|e| format!("Failed to read assets directory: {}", e))?;

    let mut files_data: Vec<(String, u64)> = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if let Some(file_name) = path.file_name() {
            let file_name_str = file_name.to_string_lossy().to_string();

            if (file_name_str.starts_with("appearances-") || file_name_str == "appearances_latest.dat") 
                && file_name_str.ends_with(".dat") {
                let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
                files_data.push((file_name_str, size));
            }
        }
    }

    // Sort files, prioritizing the working file first, then by size (desc)
    files_data.sort_by(|(a_name, a_size), (b_name, b_size)| {
        if a_name == "appearances-feee1f9feba00a63606228c8bc46fa003c90dff144fb1b60a3759f97aad6e3c8.dat" {
            std::cmp::Ordering::Less
        } else if b_name == "appearances-feee1f9feba00a63606228c8bc46fa003c90dff144fb1b60a3759f97aad6e3c8.dat" {
            std::cmp::Ordering::Greater
        } else if a_name == "appearances_latest.dat" {
            std::cmp::Ordering::Less
        } else if b_name == "appearances_latest.dat" {
            std::cmp::Ordering::Greater
        } else {
            b_size.cmp(a_size).then_with(|| a_name.cmp(b_name))
        }
    });

    let files = files_data.into_iter().map(|(name, _)| name).collect::<Vec<String>>();

    Ok(files)
}

#[tauri::command]
pub async fn save_appearances_file(state: tauri::State<'_, AppState>) -> Result<usize, String> {
    use prost::Message;

    let appearances_lock = state.appearances.lock().unwrap();
    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let tibia_path_lock = state.tibia_path.lock().unwrap();
    let path = match &*tibia_path_lock {
        Some(p) => p.clone(),
        None => return Err("No appearances file path available".to_string()),
    };

    let mut buf = Vec::new();
    appearances
        .encode(&mut buf)
        .map_err(|e| format!("Failed to encode appearances: {}", e))?;

    std::fs::write(&path, &buf)
        .map_err(|e| format!("Failed to write appearances to {:?}: {}", path, e))?;

    Ok(buf.len())
}