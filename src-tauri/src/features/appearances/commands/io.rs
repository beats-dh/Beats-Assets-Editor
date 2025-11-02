use crate::features::appearances::parsers::{get_statistics, load_appearances, AppearanceStats};
use crate::state::AppState;
use std::path::PathBuf;
use tauri::State;
use super::helpers::{rebuild_indexes, invalidate_search_cache};

/// HEAVILY OPTIMIZED load_appearances_file:
/// - TRUE async I/O with tokio::task::spawn_blocking (no UI freeze!)
/// - Builds O(1) ID indexes immediately after load
/// - Clears search cache to prevent stale results
/// - Uses parking_lot locks (3x faster than std)
#[tauri::command]
pub async fn load_appearances_file(path: String, state: State<'_, AppState>) -> Result<AppearanceStats, String> {
    log::info!("OPTIMIZED LOAD: Loading appearances from: {}", path);

    // CRITICAL OPTIMIZATION: Move blocking I/O to thread pool
    // This prevents UI freeze during large file loads (10-100+ MB)
    let path_clone = path.clone();
    let appearances =
        tokio::task::spawn_blocking(move || load_appearances(&path_clone)).await.map_err(|e| format!("Task join error: {}", e))?.map_err(|e| format!("Failed to load appearances: {}", e))?;

    let stats = get_statistics(&appearances);

    log::info!("Building O(1) ID indexes for {} objects, {} outfits, {} effects, {} missiles", appearances.object.len(), appearances.outfit.len(), appearances.effect.len(), appearances.missile.len());

    // CRITICAL: Acquire write lock first, then store appearances AND rebuild indexes atomically
    // This prevents race condition where readers see new indexes with old data
    {
        let mut appearances_lock = state.appearances.write();
        *appearances_lock = Some(appearances);

        // Build indexes AFTER storing while holding write lock (readers blocked until both complete)
        // This ensures indexes always match the stored data
        rebuild_indexes(&state, appearances_lock.as_ref().unwrap());

        // Clear search cache (data changed)
        invalidate_search_cache(&state);
    } // Write lock released here

    *state.tibia_path.lock() = Some(PathBuf::from(path));

    log::info!("Load complete with indexes built");

    Ok(stats)
}

/// Get current statistics
/// OPTIMIZED: parking_lot RwLock (3x faster than std)
#[tauri::command]
pub async fn get_appearance_stats(state: State<'_, AppState>) -> Result<AppearanceStats, String> {
    let appearances_lock = state.appearances.read();

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
    let common_paths = vec![r"C:\Program Files\Tibia", r"C:\Program Files (x86)\Tibia", r"C:\Users\Public\Tibia"];

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
pub async fn list_appearance_files(tibia_path: String) -> Result<Vec<String>, String> {
    use std::fs;

    let assets_path = PathBuf::from(tibia_path).join("assets");

    let entries = fs::read_dir(&assets_path).map_err(|e| format!("Failed to read assets directory: {}", e))?;

    let mut files_data: Vec<(String, u64)> = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if let Some(file_name) = path.file_name() {
            let file_name_str = file_name.to_string_lossy().to_string();

            if (file_name_str.starts_with("appearances-") || file_name_str == "appearances_latest.dat") && file_name_str.ends_with(".dat") {
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

/// HEAVILY OPTIMIZED save_appearances_file:
/// - Clone data while holding lock (minimal lock time)
/// - TRUE async I/O with tokio::task::spawn_blocking
/// - Encoding and file write don't block UI thread
/// - Uses parking_lot locks (3x faster)
#[tauri::command]
pub async fn save_appearances_file(state: tauri::State<'_, AppState>) -> Result<usize, String> {
    use prost::Message;

    // Clone necessary data while holding locks (minimize lock time)
    let (appearances_clone, path_clone) = {
        let appearances_lock = state.appearances.read();
        let appearances = match &*appearances_lock {
            Some(appearances) => appearances.clone(),
            None => return Err("No appearances loaded".to_string()),
        };

        let tibia_path_lock = state.tibia_path.lock();
        let path = match &*tibia_path_lock {
            Some(p) => p.clone(),
            None => return Err("No appearances file path available".to_string()),
        };

        (appearances, path)
    }; // Locks dropped here!

    // CRITICAL OPTIMIZATION: Move blocking encode + write to thread pool
    // Encoding protobuf + writing 10-100+ MB files would freeze UI
    let size = tokio::task::spawn_blocking(move || {
        let mut buf = Vec::new();
        appearances_clone.encode(&mut buf).map_err(|e| format!("Failed to encode appearances: {}", e))?;

        std::fs::write(&path_clone, &buf).map_err(|e| format!("Failed to write appearances to {:?}: {}", path_clone, e))?;

        Ok::<usize, String>(buf.len())
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))??;

    log::info!("Saved {} bytes to disk", size);

    Ok(size)
}
