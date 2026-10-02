use crate::features::client_config::commands::exe_candidates;
use crate::features::client_config::parsers::battleye::{detect, set_enabled, BeStatus};
use std::path::PathBuf;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BattleEyeInfo {
    /// The client exe that holds the gate, if one was found.
    pub exe_path: Option<String>,
    pub status: BeStatus,
    /// Exes that were scanned (for diagnostics when nothing matched).
    pub scanned: Vec<String>,
}

/// Scan the candidate client exes and report the BattleEye gate state of the
/// first one that has it. Reading/scanning a ~40 MB exe is CPU work → blocking pool.
#[tauri::command]
pub async fn get_battleye_status(tibia_path: String) -> Result<BattleEyeInfo, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let candidates = exe_candidates(&tibia_path);
        let scanned: Vec<String> = candidates.iter().map(|p| p.to_string_lossy().to_string()).collect();

        for path in &candidates {
            let Ok(bytes) = std::fs::read(path) else {
                continue;
            };
            match detect(&bytes) {
                Ok(status) if status.found => {
                    return Ok(BattleEyeInfo {
                        exe_path: Some(path.to_string_lossy().to_string()),
                        status,
                        scanned,
                    });
                }
                // Ambiguous match on this exe: surface it rather than moving on.
                Err(e) => return Err(format!("{}: {}", path.display(), e)),
                _ => {}
            }
        }

        Ok(BattleEyeInfo {
            exe_path: None,
            status: BeStatus {
                found: false,
                enabled: None,
                offset: None,
                signature: None,
            },
            scanned,
        })
    })
    .await
    .map_err(|e| format!("BattleEye scan task failed: {}", e))?
}

/// Enable or disable the BattleEye gate in the given exe, writing atomically.
/// Errors (without writing) unless a signature uniquely matches.
#[tauri::command]
pub async fn set_battleye_enabled(exe_path: String, enabled: bool) -> Result<BeStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = PathBuf::from(&exe_path);
        let mut bytes = std::fs::read(&path).map_err(|e| format!("Failed to read {}: {}", exe_path, e))?;
        let status = set_enabled(&mut bytes, enabled)?;
        crate::core::fs_util::write_atomic(&path, &bytes).map_err(|e| format!("Failed to write {}: {}", exe_path, e))?;
        Ok(status)
    })
    .await
    .map_err(|e| format!("BattleEye patch task failed: {}", e))?
}
