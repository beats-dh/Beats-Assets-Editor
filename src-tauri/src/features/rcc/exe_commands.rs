// Tauri commands for reading Qt resources compiled into a binary (`.exe`).
//
// The binary is treated as a READ-ONLY source: resources can be listed,
// previewed, edited in memory and exported to disk, but are never written back
// into the executable. This mirrors the `.rcc` command surface (rcc_*) so the
// frontend can reuse the same browser UI.

use super::commands::{safe_output_path, RccLoadResult};
use super::pe_qt_parser::{self, ExeSlot};
use super::pe_qt_writer::{self, EmbedReport};
use super::rcc_parser::{RccFile, RccFileInfo};
use parking_lot::Mutex;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::LazyLock;
use tauri::command;

/// Currently loaded binary's resource bundle.
struct ExeState {
    file: Option<RccFile>,
    source_path: Option<PathBuf>,
    /// entry index -> physical slot in the binary (for in-place writeback).
    slots: HashMap<usize, ExeSlot>,
}

static EXE_STATE: LazyLock<Mutex<ExeState>> = LazyLock::new(|| {
    Mutex::new(ExeState {
        file: None,
        source_path: None,
        slots: HashMap::new(),
    })
});

/// Scan a directory tree (and common `bin/` siblings) for `.exe` files.
#[command]
pub fn exe_find_files(base_path: String) -> Result<Vec<String>, String> {
    let base = PathBuf::from(&base_path);
    let mut results = Vec::new();

    let search_dirs = vec![base.clone(), base.join("bin"), base.parent().unwrap_or(&base).to_path_buf(), base.parent().unwrap_or(&base).join("bin")];

    for dir in search_dirs {
        if dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(ext) = path.extension() {
                            if ext.eq_ignore_ascii_case("exe") {
                                results.push(path.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    results.sort();
    results.dedup();
    Ok(results)
}

/// Load a binary and parse its compiled-in Qt resources.
///
/// Parsing a multi-MB executable plus the array-locating scans is CPU heavy, so
/// it runs on the blocking pool to avoid stalling the UI.
#[command]
pub async fn exe_load(path: String) -> Result<RccLoadResult, String> {
    let path_for_parse = path.clone();
    let (rcc, slots) = tauri::async_runtime::spawn_blocking(move || -> Result<(RccFile, HashMap<usize, ExeSlot>), String> {
        let data = std::fs::read(&path_for_parse).map_err(|e| format!("Failed to read EXE: {}", e))?;
        pe_qt_parser::parse_pe_resources_with_slots(&data)
    })
    .await
    .map_err(|e| format!("Parse task failed: {}", e))??;

    let total_files = rcc.files.len();
    let total_size: usize = rcc.files.iter().map(|f| f.size).sum();
    let version = rcc.header.version;
    let files = rcc.files.clone();

    let mut state = EXE_STATE.lock();
    state.source_path = Some(PathBuf::from(&path));
    state.file = Some(rcc);
    state.slots = slots;

    Ok(RccLoadResult {
        files,
        total_files,
        total_size,
        version,
    })
}

/// Get the raw (decompressed) bytes of a resource by entry index.
#[command]
pub fn exe_get_resource(index: usize) -> Result<Vec<u8>, String> {
    let state = EXE_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No EXE loaded")?;
    let entry = rcc.entries.get(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;
    if entry.is_directory {
        return Err("Cannot get data for a directory entry".into());
    }
    Ok(entry.data.clone())
}

/// List the currently loaded resources.
#[command]
pub fn exe_get_files() -> Result<Vec<RccFileInfo>, String> {
    let state = EXE_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No EXE loaded")?;
    Ok(rcc.files.clone())
}

/// Replace a resource's bytes IN MEMORY (for editing before export). This never
/// writes back to the executable.
#[command]
pub fn exe_replace_resource(index: usize, data: Vec<u8>) -> Result<RccFileInfo, String> {
    let mut state = EXE_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No EXE loaded")?;
    let entry = rcc.entries.get_mut(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;
    if entry.is_directory {
        return Err("Cannot replace data for a directory entry".into());
    }
    entry.data = data;
    entry.compressed = false;

    let info = RccFileInfo {
        index,
        name: entry.name.clone(),
        path: entry.path.clone(),
        size: entry.data.len(),
        compressed: false,
    };
    if let Some(fi) = rcc.files.iter_mut().find(|f| f.index == index) {
        fi.size = entry.data.len();
        fi.compressed = false;
    }
    Ok(info)
}

/// Extract every resource to a directory, preserving the resource path layout.
#[command]
pub fn exe_extract_all(output_dir: String) -> Result<usize, String> {
    let state = EXE_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No EXE loaded")?;

    let base = PathBuf::from(&output_dir);
    let mut count = 0;
    for entry in &rcc.entries {
        if entry.is_directory || entry.data.is_empty() {
            continue;
        }
        let file_path = safe_output_path(&base, &entry.path)?;
        if let Some(parent) = file_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
        std::fs::write(&file_path, &entry.data).map_err(|e| format!("Failed to write {}: {}", entry.path, e))?;
        count += 1;
    }
    Ok(count)
}

/// Extract a single resource to a chosen file path.
#[command]
pub fn exe_extract_single(index: usize, output_path: String) -> Result<(), String> {
    let state = EXE_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No EXE loaded")?;
    let entry = rcc.entries.get(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;
    if entry.is_directory {
        return Err("Cannot extract a directory entry".into());
    }
    std::fs::write(&output_path, &entry.data).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}

/// The currently loaded binary path, or an error if none is loaded.
fn loaded_exe_path() -> Result<PathBuf, String> {
    let state = EXE_STATE.lock();
    state.source_path.clone().ok_or_else(|| "No EXE loaded".into())
}

/// Result of "apply to client" for the binary, reported to the UI.
#[derive(serde::Serialize)]
pub struct ExeApplyResult {
    pub embedded: Vec<EmbedReport>,
    pub path_patched: bool,
}

/// Apply the given JSON edits back INTO the loaded client.exe so the game reads
/// them: embed each `(name, contents)` in its zlib slot, then patch the spell
/// paths to the embedded variant. Creates a one-time `client.original.exe`
/// backup. CPU heavy (read + compress + write of a multi-MB binary) → blocking.
///
/// `items` is a list of `[name, json_string]` pairs; only `spells.json` and
/// `spells-previews.json` are embeddable.
#[command]
pub async fn exe_apply_to_client(items: Vec<(String, String)>) -> Result<ExeApplyResult, String> {
    let exe = loaded_exe_path()?;
    tauri::async_runtime::spawn_blocking(move || -> Result<ExeApplyResult, String> {
        let pairs: Vec<(String, Vec<u8>)> = items.into_iter().map(|(name, json)| (name, json.into_bytes())).collect();
        let embedded = pe_qt_writer::embed_resources(&exe, &pairs)?;
        let path_patched = pe_qt_writer::patch_spell_paths(&exe)?;
        Ok(ExeApplyResult {
            embedded,
            path_patched,
        })
    })
    .await
    .map_err(|e| format!("Apply task failed: {}", e))?
}

/// Patch ONLY the spell paths in the loaded client.exe (no embed). Returns true
/// if a change was applied, false if it was already pointing at embedded paths.
#[command]
pub async fn exe_patch_spell_paths() -> Result<bool, String> {
    let exe = loaded_exe_path()?;
    tauri::async_runtime::spawn_blocking(move || pe_qt_writer::patch_spell_paths(&exe)).await.map_err(|e| format!("Patch task failed: {}", e))?
}

/// Result of a disk-mode spell apply, for UI reporting.
#[derive(serde::Serialize)]
pub struct SpellDiskResult {
    pub written_path: String,
    pub path_patched: bool,
}

/// Apply a spell JSON via DISK MODE — **no size limit**.
///
/// Writes `spells/<name>` into the client folder (the parent of `bin/`, where
/// `client.exe` lives) and patches the binary so it reads spells from disk
/// (`./spells/...`). The loose file can be any size, so this is the way to grow
/// spells beyond the embedded slot. `name` must be `spells.json` or
/// `spells-previews.json`; `content` is the full JSON text.
#[command]
pub async fn exe_apply_spell_to_disk(name: String, content: String) -> Result<SpellDiskResult, String> {
    if name != "spells.json" && name != "spells-previews.json" {
        return Err(format!("Disk mode only supports spells.json / spells-previews.json (got '{}').", name));
    }
    // Validate it's real JSON before touching anything on disk.
    serde_json::from_str::<serde_json::Value>(&content).map_err(|e| format!("Invalid JSON: {}", e))?;

    let exe = loaded_exe_path()?;
    tauri::async_runtime::spawn_blocking(move || -> Result<SpellDiskResult, String> {
        // client.exe lives in <base>/bin/ — the client base is its grandparent.
        let bin_dir = exe.parent().ok_or("Cannot resolve the bin/ directory of client.exe")?;
        let base = bin_dir.parent().ok_or("Cannot resolve the client base directory")?;
        let spells_dir = base.join("spells");
        std::fs::create_dir_all(&spells_dir).map_err(|e| format!("Failed to create spells/ folder: {}", e))?;

        let target = spells_dir.join(&name);
        // Back up an existing loose file once before overwriting.
        if target.exists() {
            let bak = spells_dir.join(format!("{}.bak", name));
            if !bak.exists() {
                let _ = std::fs::copy(&target, &bak);
            }
        }
        crate::core::fs_util::write_atomic(&target, content.as_bytes()).map_err(|e| format!("Failed to write {}: {}", target.display(), e))?;

        // Point the client at the disk copy.
        let path_patched = pe_qt_writer::patch_spell_paths_to_disk(&exe)?;
        Ok(SpellDiskResult {
            written_path: target.to_string_lossy().to_string(),
            path_patched,
        })
    })
    .await
    .map_err(|e| format!("Disk apply task failed: {}", e))?
}

/// Whether a resource entry can be written back into the binary in place
/// (i.e. we recorded a physical slot for it during the scan).
#[command]
pub fn exe_can_apply_resource(index: usize) -> Result<bool, String> {
    let state = EXE_STATE.lock();
    Ok(state.slots.contains_key(&index))
}

/// Apply the in-memory (edited) bytes of resource `index` back INTO the loaded
/// client.exe, in place, so the game reads it. Works for ANY recovered resource
/// that has a physical slot — text (JSON/QML/CSS/…) or binary (PNG). For the
/// spell JSONs it also patches the spell paths to the embedded variant so the
/// client loads the embedded copy. Creates a one-time client.original.exe backup.
#[command]
pub async fn exe_apply_resource(index: usize) -> Result<ExeApplyResult, String> {
    let exe = loaded_exe_path()?;
    // Snapshot the slot + current bytes + name under the lock, then release it.
    let (slot, name, bytes, is_spell) = {
        let state = EXE_STATE.lock();
        let rcc = state.file.as_ref().ok_or("No EXE loaded")?;
        let entry = rcc.entries.get(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;
        if entry.is_directory {
            return Err("Cannot apply a directory entry".into());
        }
        let slot = *state.slots.get(&index).ok_or("This resource has no in-place slot in the binary (it can't be embedded — save it to disk or the .rcc instead).")?;
        let is_spell = matches!(entry.name.as_str(), "spells.json" | "spells-previews.json");
        (slot, entry.name.clone(), entry.data.clone(), is_spell)
    };

    tauri::async_runtime::spawn_blocking(move || -> Result<ExeApplyResult, String> {
        let embedded = pe_qt_writer::embed_slots(&exe, &[(slot, name, bytes)])?;
        // Only the spell JSONs need the path patch; for other resources the
        // client already reads them from the embedded bundle.
        let path_patched = if is_spell {
            pe_qt_writer::patch_spell_paths(&exe)?
        } else {
            false
        };
        Ok(ExeApplyResult {
            embedded,
            path_patched,
        })
    })
    .await
    .map_err(|e| format!("Apply task failed: {}", e))?
}

/// Replace resource `index`'s in-memory bytes with the contents of a file on
/// disk (e.g. a new PNG), then apply it into the binary in place. Returns the
/// embed report. Use for binary resources that aren't editable as text.
#[command]
pub async fn exe_replace_resource_from_file(index: usize, file_path: String) -> Result<ExeApplyResult, String> {
    let new_bytes = std::fs::read(&file_path).map_err(|e| format!("Failed to read replacement file: {}", e))?;
    // Update the in-memory copy first so previews/extracts reflect it.
    {
        let mut state = EXE_STATE.lock();
        let rcc = state.file.as_mut().ok_or("No EXE loaded")?;
        let entry = rcc.entries.get_mut(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;
        if entry.is_directory {
            return Err("Cannot replace a directory entry".into());
        }
        entry.data = new_bytes;
        if let Some(fi) = rcc.files.iter_mut().find(|f| f.index == index) {
            fi.size = entry.data.len();
        }
    }
    exe_apply_resource(index).await
}
