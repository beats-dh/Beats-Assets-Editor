// Settings feature module
// Contains all settings-related functionality

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Preset {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub tibia_base_path: Option<String>,
    #[serde(default)]
    pub monster_base_path: Option<String>,
    #[serde(default)]
    pub npc_base_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AppSettings {
    pub tibia_base_path: Option<String>,
    pub monster_base_path: Option<String>,
    pub npc_base_path: Option<String>,
    // `#[serde(default)]` keeps older settings.json files (without these fields)
    // parseable — the preset system is additive.
    #[serde(default)]
    pub presets: Vec<Preset>,
    #[serde(default)]
    pub active_preset_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PresetsState {
    pub presets: Vec<Preset>,
    pub active_preset_id: Option<String>,
}

fn settings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    // Use OS-specific app data directory to avoid touching watched source files
    let base_dir = app.path().app_data_dir().map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    // Ensure directory exists
    fs::create_dir_all(&base_dir).map_err(|e| format!("Failed to create app data directory {:?}: {}", base_dir, e))?;

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

#[tauri::command]
pub async fn set_monster_base_path(app: AppHandle, monster_path: String) -> Result<(), String> {
    let mut settings = read_settings(&app)?;
    settings.monster_base_path = Some(monster_path);
    write_settings(&app, &settings)
}

#[tauri::command]
pub async fn get_monster_base_path(app: AppHandle) -> Result<Option<String>, String> {
    let settings = read_settings(&app)?;
    Ok(settings.monster_base_path)
}

#[tauri::command]
pub async fn set_npc_base_path(app: AppHandle, npc_path: String) -> Result<(), String> {
    let mut settings = read_settings(&app)?;
    settings.npc_base_path = Some(npc_path);
    write_settings(&app, &settings)
}

#[tauri::command]
pub async fn get_npc_base_path(app: AppHandle) -> Result<Option<String>, String> {
    let settings = read_settings(&app)?;
    Ok(settings.npc_base_path)
}

#[tauri::command]
pub async fn get_presets(app: AppHandle) -> Result<PresetsState, String> {
    let settings = read_settings(&app)?;
    Ok(PresetsState {
        presets: settings.presets,
        active_preset_id: settings.active_preset_id,
    })
}

/// Creates or updates a preset (upsert by id).
#[tauri::command]
pub async fn save_preset(app: AppHandle, preset: Preset) -> Result<(), String> {
    let mut settings = read_settings(&app)?;
    if let Some(existing) = settings.presets.iter_mut().find(|p| p.id == preset.id) {
        *existing = preset;
    } else {
        settings.presets.push(preset);
    }
    write_settings(&app, &settings)
}

#[tauri::command]
pub async fn delete_preset(app: AppHandle, id: String) -> Result<(), String> {
    let mut settings = read_settings(&app)?;
    settings.presets.retain(|p| p.id != id);
    if settings.active_preset_id.as_deref() == Some(id.as_str()) {
        settings.active_preset_id = None;
    }
    write_settings(&app, &settings)
}

/// Applies a preset: copies its paths to the active settings and marks it active.
/// Returns the applied preset so the frontend can refresh its path state.
#[tauri::command]
pub async fn apply_preset(app: AppHandle, id: String) -> Result<Preset, String> {
    let mut settings = read_settings(&app)?;
    let preset = settings.presets.iter().find(|p| p.id == id).cloned().ok_or_else(|| format!("Preset {} not found", id))?;
    settings.tibia_base_path = preset.tibia_base_path.clone();
    settings.monster_base_path = preset.monster_base_path.clone();
    settings.npc_base_path = preset.npc_base_path.clone();
    settings.active_preset_id = Some(id);
    write_settings(&app, &settings)?;
    Ok(preset)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn settings_with_presets_roundtrip() {
        let settings = AppSettings {
            tibia_base_path: Some("/a".into()),
            presets: vec![Preset {
                id: "1".into(),
                name: "Prod".into(),
                tibia_base_path: Some("/b".into()),
                monster_base_path: None,
                npc_base_path: None,
            }],
            active_preset_id: Some("1".into()),
            ..Default::default()
        };
        let json = serde_json::to_string(&settings).unwrap();
        let back: AppSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(back.presets.len(), 1);
        assert_eq!(back.presets[0].name, "Prod");
        assert_eq!(back.active_preset_id.as_deref(), Some("1"));
    }

    #[test]
    fn old_settings_without_presets_still_parses() {
        // A settings.json written before presets existed must still load.
        let json = r#"{"tibia_base_path":"/x","monster_base_path":null,"npc_base_path":null}"#;
        let settings: AppSettings = serde_json::from_str(json).unwrap();
        assert!(settings.presets.is_empty());
        assert!(settings.active_preset_id.is_none());
        assert_eq!(settings.tibia_base_path.as_deref(), Some("/x"));
    }
}
