// Tauri commands for RCC resource editing

use parking_lot::Mutex;
use serde::Serialize;
use std::path::{Component, Path, PathBuf};
use std::sync::LazyLock;
use tauri::command;

use super::rcc_parser::{RccFile, RccFileInfo};
use super::rcc_writer;
use super::spell_icons::{self, SPELL_SHEETS};

/// Scan a directory tree for .rcc files
#[command]
pub fn rcc_find_files(base_path: String) -> Result<Vec<String>, String> {
    let base = PathBuf::from(&base_path);
    let mut results = Vec::new();

    // Search in the given path and common relative locations
    let search_dirs = vec![base.clone(), base.join("bin"), base.parent().unwrap_or(&base).to_path_buf(), base.parent().unwrap_or(&base).join("bin")];

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
    let data = std::fs::read(&path).map_err(|e| format!("Failed to read RCC file: {}", e))?;

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

    let entry = rcc.entries.get(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;

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

    let entry = rcc.entries.get_mut(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;

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
        state.source_path.clone().ok_or("No source path and no output path specified")?
    };

    let output = rcc_writer::write_rcc(&rcc.entries)?;

    std::fs::write(&save_path, &output).map_err(|e| format!("Failed to write RCC: {}", e))?;

    Ok(save_path.to_string_lossy().to_string())
}

/// Recompile the loaded resources and INSTALL them over the source `.rcc` so the
/// client reads the edits. Unlike `rcc_save` (which targets an arbitrary file),
/// this overwrites the original `.rcc` in place, after a one-time
/// `graphics_resources.original.rcc` backup, writing atomically.
///
/// This is the `.rcc` counterpart of `exe_apply_to_client`: recompiling the
/// whole bundle (vs. patching in place) means added/expanded resources — e.g.
/// new spell icons that grow the spritesheet — are handled without size limits.
#[command]
pub fn rcc_install_to_client() -> Result<String, String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;
    let source = state.source_path.clone().ok_or("No source .rcc path is known (load one first)")?;

    // Recompile the bundle from the (possibly edited) entries.
    let output = rcc_writer::write_rcc(&rcc.entries)?;

    // One-time backup of the pristine original next to it.
    let backup = source.with_file_name("graphics_resources.original.rcc");
    if !backup.exists() {
        std::fs::copy(&source, &backup).map_err(|e| format!("Failed to back up original RCC: {}", e))?;
    }

    crate::core::fs_util::write_atomic(&source, &output).map_err(|e| format!("Failed to install RCC: {}", e))?;
    Ok(source.to_string_lossy().to_string())
}

/// Join an untrusted RCC entry path onto `base`, rejecting any component that
/// could escape the output directory (absolute paths, `..`, drive prefixes).
pub fn safe_output_path(base: &Path, entry_path: &str) -> Result<PathBuf, String> {
    let mut out = base.to_path_buf();

    for component in Path::new(entry_path).components() {
        match component {
            Component::Normal(part) => out.push(part),
            Component::CurDir => {}
            _ => return Err(format!("Unsafe RCC entry path: {}", entry_path)),
        }
    }

    Ok(out)
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

        let file_path = safe_output_path(&base, &entry.path)?;

        // Create parent directories
        if let Some(parent) = file_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        std::fs::write(&file_path, &entry.data).map_err(|e| format!("Failed to write {}: {}", entry.path, e))?;

        count += 1;
    }

    Ok(count)
}

/// Extract a single resource to a file
#[command]
pub fn rcc_extract_single(index: usize, output_path: String) -> Result<(), String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;

    let entry = rcc.entries.get(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;

    if entry.is_directory {
        return Err("Cannot extract a directory entry".into());
    }

    std::fs::write(&output_path, &entry.data).map_err(|e| format!("Failed to write file: {}", e))?;

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
    let new_data = std::fs::read(&file_path).map_err(|e| format!("Failed to read replacement file: {}", e))?;

    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;

    let entry = rcc.entries.get_mut(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;

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

    let entry = rcc.entries.get(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;

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
    let data = std::fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let file_name = std::path::Path::new(&file_path).file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| "unnamed".to_string());

    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;

    // Normalize the target path
    let target_path = if rcc_path.is_empty() {
        file_name.clone()
    } else {
        let clean = rcc_path.trim_matches('/').to_string();
        if clean.is_empty() {
            file_name.clone()
        } else {
            clean
        }
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
            let found = rcc.entries[current_parent].children.iter().find(|&&c| c < rcc.entries.len() && rcc.entries[c].is_directory && rcc.entries[c].name == *seg).copied();

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

// ---- spell icons -----------------------------------------------------------

/// Find the entry index of a resource by its full path in the loaded RCC.
fn entry_index_by_path(rcc: &RccFile, path: &str) -> Option<usize> {
    rcc.entries.iter().position(|e| !e.is_directory && e.path == path)
}

/// Write new bytes into an existing entry and refresh its file-list size.
fn set_entry_bytes(rcc: &mut RccFile, index: usize, bytes: Vec<u8>) {
    let len = bytes.len();
    rcc.entries[index].data = bytes;
    rcc.entries[index].compressed = false;
    if let Some(fi) = rcc.files.iter_mut().find(|f| f.index == index) {
        fi.size = len;
        fi.compressed = false;
    }
}

/// Number of spell-icon cells (from the first sheet present).
#[command]
pub fn rcc_spell_icon_count() -> Result<u32, String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;
    let (rel, cell) = SPELL_SHEETS[0];
    let idx = entry_index_by_path(rcc, rel).ok_or_else(|| format!("Spell sheet not found in RCC: {}", rel))?;
    spell_icons::icon_count(&rcc.entries[idx].data, cell)
}

/// Get the raw PNG bytes of a spell sheet (default: the 32x32 one) for preview.
#[command]
pub fn rcc_spell_sheet_png(cell: Option<u32>) -> Result<Vec<u8>, String> {
    let want = cell.unwrap_or(32);
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;
    let (rel, _) = SPELL_SHEETS.iter().copied().find(|(_, c)| *c == want).ok_or_else(|| format!("No spell sheet with cell size {}", want))?;
    let idx = entry_index_by_path(rcc, rel).ok_or_else(|| format!("Spell sheet not found in RCC: {}", rel))?;
    Ok(rcc.entries[idx].data.clone())
}

/// Add (append) or replace a spell icon across ALL sheets in lockstep, reading
/// the new icon from a PNG file on disk. Returns the affected icon index.
#[command]
pub fn rcc_add_or_replace_spell_icon(icon_file: String, index: Option<u32>) -> Result<u32, String> {
    let icon_png = std::fs::read(&icon_file).map_err(|e| format!("Failed to read icon: {}", e))?;
    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;

    let mut written_index = index.unwrap_or(0);
    for (rel, cell) in SPELL_SHEETS {
        let idx = entry_index_by_path(rcc, rel).ok_or_else(|| format!("Spell sheet not found in RCC: {}", rel))?;
        let (new_png, written) = spell_icons::add_or_replace(&rcc.entries[idx].data, cell, &icon_png, index)?;
        written_index = written;
        set_entry_bytes(rcc, idx, new_png);
    }
    Ok(written_index)
}

/// Clear a spell icon at `index` across all sheets.
#[command]
pub fn rcc_remove_spell_icon(index: u32) -> Result<(), String> {
    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;
    for (rel, cell) in SPELL_SHEETS {
        let idx = entry_index_by_path(rcc, rel).ok_or_else(|| format!("Spell sheet not found in RCC: {}", rel))?;
        let new_png = spell_icons::remove(&rcc.entries[idx].data, cell, index)?;
        set_entry_bytes(rcc, idx, new_png);
    }
    Ok(())
}

/// Swap two spell icons across all sheets.
#[command]
pub fn rcc_move_spell_icon(source_index: u32, target_index: u32) -> Result<(), String> {
    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;
    for (rel, cell) in SPELL_SHEETS {
        let idx = entry_index_by_path(rcc, rel).ok_or_else(|| format!("Spell sheet not found in RCC: {}", rel))?;
        let new_png = spell_icons::swap(&rcc.entries[idx].data, cell, source_index, target_index)?;
        set_entry_bytes(rcc, idx, new_png);
    }
    Ok(())
}

// ---- generic image grid (any RCC sprite sheet / image, by entry index) ------

/// Description of an image resource for the grid UI.
#[derive(serde::Serialize)]
pub struct ImageGridInfo {
    pub width: u32,
    pub height: u32,
    /// Inferred square cell size (a horizontal strip → height; else full width).
    pub cell: u32,
    pub count: u32,
}

/// The spell-icon sheets that must stay in lockstep, paired by cell size. When
/// the user edits one, the same logical index is edited on the sibling too.
fn spell_sheet_sibling(path: &str) -> Option<&'static str> {
    match path {
        "images/spells/spell-icons-32x32.png" => Some("images/spells/spell-icons-20x20.png"),
        "images/spells/spell-icons-20x20.png" => Some("images/spells/spell-icons-32x32.png"),
        _ => None,
    }
}

/// Cell size for a known spell sheet path (so we can act on the sibling too).
fn spell_sheet_cell(path: &str) -> Option<u32> {
    SPELL_SHEETS.iter().find(|(rel, _)| *rel == path).map(|(_, c)| *c)
}

/// Describe an image resource (size + inferred cell grid) by entry index.
#[command]
pub fn rcc_image_info(index: usize) -> Result<ImageGridInfo, String> {
    let state = RCC_STATE.lock();
    let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;
    let entry = rcc.entries.get(index).ok_or_else(|| format!("Invalid entry index: {}", index))?;
    let (width, height, cell) = spell_icons::describe(&entry.data)?;
    let count = if cell == 0 {
        0
    } else {
        width / cell
    };
    Ok(ImageGridInfo {
        width,
        height,
        cell,
        count,
    })
}

/// Apply an op to an image entry and, if it's a spell sheet, mirror the op on
/// its sibling at the proportional index (their counts match, so the index maps
/// 1:1). `op` receives the sheet bytes + that sheet's cell size.
fn edit_image_with_lockstep<F>(rcc: &mut RccFile, index: usize, cell: u32, op: F) -> Result<(), String>
where
    F: Fn(&[u8], u32) -> Result<Vec<u8>, String>,
{
    let path = rcc.entries.get(index).ok_or_else(|| format!("Invalid entry index: {}", index))?.path.clone();

    // Primary sheet.
    let new_png = op(&rcc.entries[index].data, cell)?;
    set_entry_bytes(rcc, index, new_png);

    // Spell-sheet sibling, if any (same logical index, its own cell size).
    if let Some(sibling) = spell_sheet_sibling(&path) {
        if let (Some(sib_idx), Some(sib_cell)) = (entry_index_by_path(rcc, sibling), spell_sheet_cell(sibling)) {
            let sib_png = op(&rcc.entries[sib_idx].data, sib_cell)?;
            set_entry_bytes(rcc, sib_idx, sib_png);
        }
    }
    Ok(())
}

/// Add (append) or replace a cell in an image, from a PNG file on disk. Returns
/// the affected cell index. Mirrors onto the spell-sheet sibling when relevant.
#[command]
pub fn rcc_image_add_or_replace(index: usize, cell: u32, icon_file: String, at_index: Option<u32>) -> Result<u32, String> {
    let icon_png = std::fs::read(&icon_file).map_err(|e| format!("Failed to read icon: {}", e))?;
    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;

    // Determine the written index from the primary sheet first.
    let (_new_png, written) = spell_icons::add_or_replace(&rcc.entries[index].data, cell, &icon_png, at_index)?;
    edit_image_with_lockstep(rcc, index, cell, |bytes, c| spell_icons::add_or_replace(bytes, c, &icon_png, Some(written)).map(|(png, _)| png))?;
    Ok(written)
}

/// Clear (make transparent) a cell in an image. Mirrors onto the sibling.
#[command]
pub fn rcc_image_remove(index: usize, cell: u32, at_index: u32) -> Result<(), String> {
    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;
    edit_image_with_lockstep(rcc, index, cell, |bytes, c| spell_icons::remove(bytes, c, at_index))
}

/// Swap two cells in an image. Mirrors onto the sibling.
#[command]
pub fn rcc_image_move(index: usize, cell: u32, source_index: u32, target_index: u32) -> Result<(), String> {
    let mut state = RCC_STATE.lock();
    let rcc = state.file.as_mut().ok_or("No RCC file loaded")?;
    edit_image_with_lockstep(rcc, index, cell, |bytes, c| spell_icons::swap(bytes, c, source_index, target_index))
}

// ---- install via Qt rcc.exe (option 2: official compiler, preserves compression)

/// Detect a usable Qt `rcc` executable on this machine, returning its path.
#[command]
pub fn rcc_detect_qt_rcc() -> Option<String> {
    super::qt_rcc::detect_rcc().map(|p| p.to_string_lossy().to_string())
}

/// Recompile the loaded resources with Qt's official `rcc` (preserving Qt's
/// compression) and INSTALL the result over the client's source `.rcc`.
///
/// This is the `.rcc` install path the reference Python tool uses; the client is
/// known to accept it, and there is no per-resource size limit (added/expanded
/// icons just work). `rcc_exe` is optional: if omitted, one is auto-detected.
/// CPU heavy (dump + external compile of a multi-MB bundle) → blocking pool.
#[command]
pub async fn rcc_install_to_client_qt(rcc_exe: Option<String>) -> Result<String, String> {
    // Snapshot the entries + source path under the lock, then release it so the
    // long external compile doesn't hold the global RCC mutex.
    let (entries, source) = {
        let state = RCC_STATE.lock();
        let rcc = state.file.as_ref().ok_or("No RCC file loaded")?;
        let source = state.source_path.clone().ok_or("No source .rcc path is known (load one first)")?;
        (rcc.entries.clone(), source)
    };

    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let exe = match rcc_exe {
            Some(p) => PathBuf::from(p),
            None => super::qt_rcc::detect_rcc().ok_or("Qt rcc.exe not found. Point to it manually (e.g. PySide6/rcc.exe).")?,
        };
        let compiled = super::qt_rcc::compile_with_qt(&entries, &exe)?;

        // One-time backup of the pristine original next to it.
        let backup = source.with_file_name("graphics_resources.original.rcc");
        if !backup.exists() {
            std::fs::copy(&source, &backup).map_err(|e| format!("Failed to back up original RCC: {}", e))?;
        }
        crate::core::fs_util::write_atomic(&source, &compiled).map_err(|e| format!("Failed to install RCC: {}", e))?;
        Ok(source.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| format!("Install task failed: {}", e))?
}
