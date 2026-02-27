// Tauri commands for RCC resource editing

use parking_lot::Mutex;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::LazyLock;
use tauri::command;

use super::rcc_parser::{RccFile, RccFileInfo};
use super::rcc_writer;

/// Scan a directory tree for .rcc files
#[command]
pub fn rcc_find_files(base_path: String) -> Result<Vec<String>, String> {
    let base = PathBuf::from(&base_path);
    let mut results = Vec::new();

    // Search in the given path and common relative locations
    let search_dirs = vec![
        base.clone(),
        base.join("bin"),
        base.parent().unwrap_or(&base).to_path_buf(),
        base.parent().unwrap_or(&base).join("bin"),
    ];

    for dir in search_dirs {
        if dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(ext) = path.extension() {
                            if ext.eq_ignore_ascii_case("rcc") {
                                results.push(path.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // Deduplicate
    results.sort();
    results.dedup();

    Ok(results)
}

/// Global RCC state — holds the currently loaded file
struct RccState {
    file: Option<RccFile>,
    source_path: Option<PathBuf>,
}

static RCC_STATE: LazyLock<Mutex<RccState>> = LazyLock::new(|| {
    Mutex::new(RccState {
        file: None,
        source_path: None,
    })
});

#[derive(Serialize)]
pub struct RccLoadResult {
    pub files: Vec<RccFileInfo>,
    pub total_files: usize,
    pub total_size: usize,
    pub version: u32,
}

/// Load an RCC file and return the list of resources
#[command]
pub fn rcc_load(path: String) -> Result<RccLoadResult, String> {
    let data = std::fs::read(&path)
        .map_err(|e| format!("Failed to read RCC file: {}", e))?;

    let rcc = RccFile::parse(&data)?;

    let total_files = rcc.files.len();
    let total_size: usize = rcc.files.iter().map(|f| f.size).sum();
    let version = rcc.header.version;
    let files = rcc.files.clone();

    let mut state = RCC_STATE.lock();
    state.source_path = Some(PathBuf::from(&path));
    state.file = Some(rcc);

    Ok(RccLoadResult {
        files,
        total_files,
        total_size,
        version,
    })
}

/// Get the raw data of a specific resource by its entry index
#[command]
pub fn rcc_get_resource(index: usize) -> Result<Vec<u8>, String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;

    let entry = rcc
        .entries
        .get(index)
        .ok_or_else(|| format!("Invalid entry index: {}", index))?;

    if entry.is_directory {
        return Err("Cannot get data for a directory entry".into());
    }

    Ok(entry.data.clone())
}

/// Replace the data of a specific resource
#[command]
pub fn rcc_replace_resource(index: usize, data: Vec<u8>) -> Result<RccFileInfo, String> {
    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;

    let entry = rcc
        .entries
        .get_mut(index)
        .ok_or_else(|| format!("Invalid entry index: {}", index))?;

    if entry.is_directory {
        return Err("Cannot replace data for a directory entry".into());
    }

    entry.data = data;
    entry.compressed = false; // We store uncompressed after replacement

    // Update the file info list
    let info = RccFileInfo {
        index,
        name: entry.name.clone(),
        path: entry.path.clone(),
        size: entry.data.len(),
        compressed: false,
    };

    // Update in files list too
    if let Some(fi) = rcc.files.iter_mut().find(|f| f.index == index) {
        fi.size = entry.data.len();
        fi.compressed = false;
    }

    Ok(info)
}

/// Save the modified RCC to a file
#[command]
pub fn rcc_save(output_path: Option<String>) -> Result<String, String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;

    let save_path = if let Some(p) = output_path {
        PathBuf::from(p)
    } else {
        state
            .source_path
            .clone()
            .ok_or("No source path and no output path specified")?
    };

    let output = rcc_writer::write_rcc(&rcc.entries)?;

    std::fs::write(&save_path, &output)
        .map_err(|e| format!("Failed to write RCC: {}", e))?;

    Ok(save_path.to_string_lossy().to_string())
}

/// Extract all resources to a directory
#[command]
pub fn rcc_extract_all(output_dir: String) -> Result<usize, String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;

    let base = PathBuf::from(&output_dir);
    let mut count = 0;

    for entry in &rcc.entries {
        if entry.is_directory || entry.data.is_empty() {
            continue;
        }

        let file_path = base.join(&entry.path);

        // Create parent directories
        if let Some(parent) = file_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        std::fs::write(&file_path, &entry.data)
            .map_err(|e| format!("Failed to write {}: {}", entry.path, e))?;

        count += 1;
    }

    Ok(count)
}

/// Extract a single resource to a file
#[command]
pub fn rcc_extract_single(index: usize, output_path: String) -> Result<(), String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;

    let entry = rcc
        .entries
        .get(index)
        .ok_or_else(|| format!("Invalid entry index: {}", index))?;

    if entry.is_directory {
        return Err("Cannot extract a directory entry".into());
    }

    std::fs::write(&output_path, &entry.data)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

/// Get the list of currently loaded files (without reloading)
#[command]
pub fn rcc_get_files() -> Result<Vec<RccFileInfo>, String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;
    Ok(rcc.files.clone())
}

/// Replace a resource entry with data read from a file on disk
#[command]
pub fn rcc_replace_from_file(index: usize, file_path: String) -> Result<RccFileInfo, String> {
    let new_data = std::fs::read(&file_path)
        .map_err(|e| format!("Failed to read replacement file: {}", e))?;

    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;

    let entry = rcc
        .entries
        .get_mut(index)
        .ok_or_else(|| format!("Invalid entry index: {}", index))?;

    if entry.is_directory {
        return Err("Cannot replace data for a directory entry".into());
    }

    entry.data = new_data;
    entry.compressed = false;

    let info = RccFileInfo {
        index,
        name: entry.name.clone(),
        path: entry.path.clone(),
        size: entry.data.len(),
        compressed: false,
    };

    // Update files list
    if let Some(fi) = rcc.files.iter_mut().find(|f| f.index == index) {
        fi.size = entry.data.len();
        fi.compressed = false;
    }

    Ok(info)
}

/// Delete a resource entry
#[command]
pub fn rcc_delete_resource(index: usize) -> Result<Vec<RccFileInfo>, String> {
    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;

    let entry = rcc
        .entries
        .get(index)
        .ok_or_else(|| format!("Invalid entry index: {}", index))?;

    if entry.is_directory {
        return Err("Cannot delete a directory entry directly".into());
    }

    // Clear the entry data (mark as deleted)
    rcc.entries[index].data.clear();
    rcc.entries[index].name = String::new();

    // Remove from parent's children list
    for e in rcc.entries.iter_mut() {
        if e.is_directory {
            e.children.retain(|&c| c != index);
        }
    }

    // Rebuild files list
    rcc.files = rcc
        .entries
        .iter()
        .enumerate()
        .filter(|(_, e)| !e.is_directory && !e.name.is_empty())
        .map(|(i, e)| RccFileInfo {
            index: i,
            name: e.name.clone(),
            path: e.path.clone(),
            size: e.data.len(),
            compressed: e.compressed,
        })
        .collect();

    rcc.files.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(rcc.files.clone())
}

/// Add a new resource from a file on disk
#[command]
pub fn rcc_add_resource(file_path: String, rcc_path: String) -> Result<Vec<RccFileInfo>, String> {
    let data = std::fs::read(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let file_name = std::path::Path::new(&file_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unnamed".to_string());

    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;

    // Normalize the target path
    let target_path = if rcc_path.is_empty() {
        file_name.clone()
    } else {
        let clean = rcc_path.trim_matches('/').to_string();
        if clean.is_empty() { file_name.clone() } else { clean }
    };

    // Create a new file entry
    let new_index = rcc.entries.len();
    let new_entry = super::rcc_parser::RccEntry {
        name: file_name,
        path: target_path.clone(),
        is_directory: false,
        data,
        children: Vec::new(),
        compressed: false,
        country: 0,
        language: 0,
    };
    rcc.entries.push(new_entry);

    // Find or create parent directory chain
    let segments: Vec<&str> = target_path.split('/').collect();
    if segments.len() > 1 {
        let mut current_parent = 0usize; // root

        for seg in &segments[..segments.len() - 1] {
            let found = rcc.entries[current_parent]
                .children
                .iter()
                .find(|&&c| {
                    c < rcc.entries.len()
                        && rcc.entries[c].is_directory
                        && rcc.entries[c].name == *seg
                })
                .copied();

            if let Some(dir_idx) = found {
                current_parent = dir_idx;
            } else {
                // Create new directory entry
                let dir_idx = rcc.entries.len();
                let dir_entry = super::rcc_parser::RccEntry {
                    name: seg.to_string(),
                    path: String::new(),
                    is_directory: true,
                    data: Vec::new(),
                    children: Vec::new(),
                    compressed: false,
                    country: 0,
                    language: 0,
                };
                rcc.entries.push(dir_entry);
                rcc.entries[current_parent].children.push(dir_idx);
                current_parent = dir_idx;
            }
        }

        // Add file entry as child of deepest directory
        rcc.entries[current_parent].children.push(new_index);
    } else {
        // Add directly to root
        if !rcc.entries.is_empty() && rcc.entries[0].is_directory {
            rcc.entries[0].children.push(new_index);
        }
    }

    // Rebuild files list
    rcc.files = rcc
        .entries
        .iter()
        .enumerate()
        .filter(|(_, e)| !e.is_directory && !e.name.is_empty())
        .map(|(i, e)| RccFileInfo {
            index: i,
            name: e.name.clone(),
            path: e.path.clone(),
            size: e.data.len(),
            compressed: e.compressed,
        })
        .collect();

    rcc.files.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(rcc.files.clone())
}

