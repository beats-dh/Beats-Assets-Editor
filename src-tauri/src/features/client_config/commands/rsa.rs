use crate::features::client_config::commands::exe_candidates;
use crate::features::client_config::parsers::rsa::{detect, set_modulus, RsaStatus};
use std::path::PathBuf;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RsaInfo {
    /// The client exe that holds the modulus, if one was found.
    pub exe_path: Option<String>,
    pub status: RsaStatus,
    pub scanned: Vec<String>,
}

/// Scan the candidate client exes and report the RSA modulus of the first one
/// that has it. Reading a ~40 MB exe is CPU work → blocking pool.
#[tauri::command]
pub async fn get_rsa_modulus(tibia_path: String) -> Result<RsaInfo, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let candidates = exe_candidates(&tibia_path);
        let scanned: Vec<String> = candidates.iter().map(|p| p.to_string_lossy().to_string()).collect();

        for path in &candidates {
            let Ok(bytes) = std::fs::read(path) else {
                continue;
            };
            match detect(&bytes) {
                Ok(status) if status.found => {
                    return Ok(RsaInfo {
                        exe_path: Some(path.to_string_lossy().to_string()),
                        status,
                        scanned,
                    });
                }
                Err(e) => return Err(format!("{}: {}", path.display(), e)),
                _ => {}
            }
        }

        Ok(RsaInfo {
            exe_path: None,
            status: RsaStatus {
                found: false,
                modulus: None,
                offset: None,
                is_ot_default: false,
            },
            scanned,
        })
    })
    .await
    .map_err(|e| format!("RSA scan task failed: {}", e))?
}

/// Replace the RSA modulus in the given exe, writing atomically. Errors
/// (without writing) unless the current modulus is uniquely located and the
/// new value is valid hex that fits the 1024-bit slot.
#[tauri::command]
pub async fn set_rsa_modulus(exe_path: String, modulus: String) -> Result<RsaStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = PathBuf::from(&exe_path);
        let mut bytes = std::fs::read(&path).map_err(|e| format!("Failed to read {}: {}", exe_path, e))?;
        let status = set_modulus(&mut bytes, &modulus)?;
        crate::core::fs_util::write_atomic(&path, &bytes).map_err(|e| format!("Failed to write {}: {}", exe_path, e))?;
        Ok(status)
    })
    .await
    .map_err(|e| format!("RSA patch task failed: {}", e))?
}
