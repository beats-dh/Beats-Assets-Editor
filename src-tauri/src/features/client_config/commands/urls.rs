use crate::features::client_config::commands::config_ini_candidates;
use crate::features::client_config::parsers::config_ini::{read_section, write_section, IniEntry};

const URLS_SECTION: &str = "URLS";

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientUrls {
    /// Absolute path of the config.ini that was read (for display).
    pub config_path: String,
    pub entries: Vec<IniEntry>,
}

fn resolve_config(tibia_path: &str) -> Result<std::path::PathBuf, String> {
    config_ini_candidates(tibia_path).into_iter().find(|p| p.is_file()).ok_or_else(|| format!("config.ini not found under {} (looked in conf/ and the folder root)", tibia_path))
}

/// Read every `[URLS]` entry from the client's config.ini, in file order.
#[tauri::command]
pub fn get_client_urls(tibia_path: String) -> Result<ClientUrls, String> {
    let path = resolve_config(&tibia_path)?;
    let entries = read_section(&path, URLS_SECTION).map_err(|e| format!("Failed to read URLs: {}", e))?;
    Ok(ClientUrls {
        config_path: path.to_string_lossy().to_string(),
        entries,
    })
}

/// Overwrite the values of the given `[URLS]` keys, preserving the rest of the
/// file. Keys not already present are ignored.
#[tauri::command]
pub fn save_client_urls(tibia_path: String, entries: Vec<IniEntry>) -> Result<(), String> {
    let path = resolve_config(&tibia_path)?;
    write_section(&path, URLS_SECTION, &entries).map_err(|e| format!("Failed to save URLs: {}", e))
}
