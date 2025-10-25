use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AppSettings {
    pub tibia_base_path: Option<String>,
}

fn settings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    // Use OS-specific app data directory to avoid touching watched source files
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    // Ensure directory exists
    fs::create_dir_all(&base_dir)
        .map_err(|e| format!("Failed to create app data directory {:?}: {}", base_dir, e))?;

    Ok(base_dir.join("settings.json"))
}

fn read_settings(app: &AppHandle) -> Result<AppSettings, String> {
    let path = settings_file_path(app)?;
    if !path.exists() {
        return Ok(AppSettings::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    serde_json::from_str::<AppSettings>(&content).map_err(|e| format!("Failed to parse settings: {}", e))
}

fn write_settings(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_file_path(app)?;
    let json = serde_json::to_string_pretty(settings).map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn set_tibia_base_path(app: AppHandle, tibia_path: String) -> Result<(), String> {
    let mut settings = read_settings(&app)?;
    settings.tibia_base_path = Some(tibia_path);
    write_settings(&app, &settings)
}

#[tauri::command]
pub async fn get_tibia_base_path(app: AppHandle) -> Result<Option<String>, String> {
    let settings = read_settings(&app)?;
    Ok(settings.tibia_base_path)
}