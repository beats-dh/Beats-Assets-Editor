// Tauri commands for QM translation file editing

use parking_lot::Mutex;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::LazyLock;
use tauri::command;

use super::qm_parser::{QmEntry, QmFile};
use super::qm_writer;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

struct QmState {
    file: Option<QmFile>,
    source_path: Option<PathBuf>,
}

static QM_STATE: LazyLock<Mutex<QmState>> = LazyLock::new(|| {
    Mutex::new(QmState {
        file: None,
        source_path: None,
    })
});

// ---------------------------------------------------------------------------
// Frontend-facing types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
pub struct QmLoadResult {
    pub entries: Vec<QmEntry>,
    pub total: usize,
    pub has_source_text: bool,
    pub path: String,
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/// Scan a directory for .qm translation files
#[command]
pub fn qm_find_files(base_path: String) -> Result<Vec<String>, String> {
    let base = PathBuf::from(&base_path);
    let mut results = Vec::new();

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
                            if ext.eq_ignore_ascii_case("qm") {
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

/// Load and parse a .qm file
#[command]
pub fn qm_load(path: String) -> Result<QmLoadResult, String> {
    let p = PathBuf::from(&path);
    let data = std::fs::read(&p).map_err(|e| format!("Failed to read {path}: {e}"))?;

    let qm = super::qm_parser::parse_qm(&data)
        .map_err(|e| format!("Failed to parse QM: {e}"))?;

    let result = QmLoadResult {
        total: qm.entries.len(),
        has_source_text: qm.has_source_text,
        entries: qm.entries.clone(),
        path: path.clone(),
    };

    let mut state = QM_STATE.lock();
    state.file = Some(qm);
    state.source_path = Some(p);

    Ok(result)
}

/// Return all currently loaded entries without reloading
#[command]
pub fn qm_get_entries() -> Result<Vec<QmEntry>, String> {
    let state = QM_STATE.lock();
    match &state.file {
        Some(f) => Ok(f.entries.clone()),
        None => Err("No QM file loaded".to_string()),
    }
}

/// Update the translation for a single entry (by its index)
#[command]
pub fn qm_update_translation(
    index: usize,
    translation: Option<String>,
) -> Result<(), String> {
    let mut state = QM_STATE.lock();
    let file = state.file.as_mut().ok_or("No QM file loaded")?;

    let entry = file
        .entries
        .iter_mut()
        .find(|e| e.index == index)
        .ok_or(format!("Entry with index {index} not found"))?;

    entry.translation = translation;
    Ok(())
}

/// Batch-update multiple translations at once
#[command]
pub fn qm_update_translations(
    updates: Vec<(usize, Option<String>)>,
) -> Result<usize, String> {
    let mut state = QM_STATE.lock();
    let file = state.file.as_mut().ok_or("No QM file loaded")?;

    let mut count = 0usize;
    for (index, translation) in updates {
        if let Some(entry) = file.entries.iter_mut().find(|e| e.index == index) {
            entry.translation = translation;
            count += 1;
        }
    }
    Ok(count)
}

/// Save the QM file to disk (original path or a new one)
#[command]
pub fn qm_save(output_path: Option<String>) -> Result<String, String> {
    let state = QM_STATE.lock();
    let file = state.file.as_ref().ok_or("No QM file loaded")?;

    let dest: PathBuf = match &output_path {
        Some(p) => PathBuf::from(p),
        None => state
            .source_path
            .clone()
            .ok_or("No output path specified and no source path known")?,
    };

    let bytes = qm_writer::write_qm(file);
    std::fs::write(&dest, &bytes)
        .map_err(|e| format!("Failed to write {}: {e}", dest.display()))?;

    Ok(dest.to_string_lossy().to_string())
}

/// Export all entries as CSV (index, context, source_text, comment, translation)
#[command]
pub fn qm_export_csv(output_path: String) -> Result<usize, String> {
    let state = QM_STATE.lock();
    let file = state.file.as_ref().ok_or("No QM file loaded")?;

    let mut csv = String::from("index,hash,context,source_text,comment,translation\n");
    for entry in &file.entries {
        let escape = |s: &str| format!("\"{}\"", s.replace('"', "\"\""));
        csv.push_str(&format!(
            "{},{},{},{},{},{}\n",
            entry.index,
            entry.hash,
            escape(&entry.context),
            escape(&entry.source_text),
            escape(&entry.comment),
            escape(entry.translation.as_deref().unwrap_or(""))
        ));
    }

    std::fs::write(&output_path, csv.as_bytes())
        .map_err(|e| format!("Failed to write CSV: {e}"))?;

    Ok(file.entries.len())
}

/// Import translations from CSV (columns: index, translation)
/// Only the `index` and `translation` columns are used; others are ignored.
#[command]
pub fn qm_import_csv(file_path: String) -> Result<usize, String> {
    let data = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read CSV: {e}"))?;

    let mut updates: Vec<(usize, Option<String>)> = Vec::new();
    let mut lines = data.lines();

    // Skip header row
    if let Some(header) = lines.next() {
        let cols: Vec<&str> = header.split(',').collect();
        let index_col = cols.iter().position(|&c| c.trim() == "index").unwrap_or(0);
        let trans_col = cols
            .iter()
            .position(|&c| c.trim() == "translation")
            .unwrap_or(5);

        for line in lines {
            let fields = parse_csv_line(line);
            if let (Some(idx_str), Some(trans)) =
                (fields.get(index_col), fields.get(trans_col))
            {
                if let Ok(idx) = idx_str.trim().parse::<usize>() {
                    let t = trans.trim().to_string();
                    updates.push((idx, if t.is_empty() { None } else { Some(t) }));
                }
            }
        }
    }

    let count = updates.len();

    // Apply
    let mut state = QM_STATE.lock();
    let file = state.file.as_mut().ok_or("No QM file loaded")?;
    for (index, translation) in updates {
        if let Some(entry) = file.entries.iter_mut().find(|e| e.index == index) {
            entry.translation = translation;
        }
    }

    Ok(count)
}

/// Debug: return raw hex dumps of the first few messages to diagnose parse issues
#[command]
pub fn qm_debug_raw() -> Result<String, String> {
    // Clone path then release lock before doing file I/O
    let path = {
        let state = QM_STATE.lock();
        state.source_path.clone().ok_or("No QM file loaded")?
    };

    let data = std::fs::read(&path).map_err(|e| format!("Failed to read: {e}"))?;

    let mut out = String::new();
    out.push_str(&format!("File: {}\nSize: {} bytes\n\n", path.display(), data.len()));

    // Parse sections
    let mut pos = 16usize;
    let mut messages_start = 0usize;
    let mut messages_size = 0usize;
    let mut hashes_start = 0usize;
    let mut hashes_size = 0usize;

    out.push_str("=== Sections ===\n");
    while pos + 5 <= data.len() {
        let tag = data[pos];
        pos += 1;
        if pos + 4 > data.len() { break; }
        let size = u32::from_be_bytes(data[pos..pos + 4].try_into().unwrap()) as usize;
        pos += 4;
        let label = match tag {
            0x2F => "Contexts (legacy)",
            0x42 => "Hashes",
            0x46 => "Dependencies",
            0x4C => "Language",
            0x69 => "Messages",
            0x88 => "NumerusRules",
            _ => "Unknown",
        };
        out.push_str(&format!("  0x{:02X} {:20} {:>8} bytes at offset {}\n", tag, label, size, pos));
        match tag {
            0x69 => { messages_start = pos; messages_size = size; }
            0x42 => { hashes_start = pos; hashes_size = size; }
            _ => {}
        }
        pos += size;
    }

    // Show first 8 messages with decoded fields
    out.push_str("\n=== First 8 messages (decoded) ===\n");
    let num_hashes = std::cmp::min(8, hashes_size / 8);
    for i in 0..num_hashes {
        let base = hashes_start + i * 8;
        let hash = u32::from_be_bytes(data[base..base + 4].try_into().unwrap());
        let offset = u32::from_be_bytes(data[base + 4..base + 8].try_into().unwrap()) as usize;
        out.push_str(&format!("\n[{}] hash=0x{:08X} offset={}\n", i, hash, offset));

        if offset >= messages_size {
            out.push_str(&format!("  OUT OF BOUNDS\n"));
            continue;
        }

        // Walk chunks and collect fields
        let msg_start = messages_start + offset;
        let mut p = msg_start;
        let section_end = messages_start + messages_size;
        let mut trans_be = String::from("(none)");
        let mut trans_le = String::from("(none)");
        let mut src_text = String::from("(none)");
        let mut comment = String::from("(none)");
        let mut trans_raw: Vec<u8> = Vec::new();

        while p < section_end {
            let tag = data[p]; p += 1;
            if tag == 0x01 { break; } // End
            if p + 4 > section_end { break; }
            let raw_len = u32::from_be_bytes(data[p..p+4].try_into().unwrap());
            p += 4;
            if raw_len == 0xFFFF_FFFF {
                if tag == 0x03 {
                    trans_be = String::from("(null/same-as-source)");
                    trans_le = trans_be.clone();
                }
                continue;
            }
            let len = raw_len as usize;
            if p + len > section_end { break; }
            let chunk = &data[p..p+len];
            p += len;
            match tag {
                0x03 => { // Translation
                    trans_raw = chunk.to_vec();
                    let be_chars: Vec<u16> = chunk.chunks_exact(2)
                        .map(|c| u16::from_be_bytes([c[0], c[1]])).collect();
                    trans_be = String::from_utf16_lossy(&be_chars).to_string();
                    let le_chars: Vec<u16> = chunk.chunks_exact(2)
                        .map(|c| u16::from_le_bytes([c[0], c[1]])).collect();
                    trans_le = String::from_utf16_lossy(&le_chars).to_string();
                }
                0x06 => { src_text = String::from_utf8_lossy(chunk).to_string(); }
                0x07 => { comment = String::from_utf8_lossy(chunk).to_string(); }
                _ => {}
            }
        }

        let hex_raw: Vec<String> = trans_raw.iter().map(|b| format!("{:02X}", b)).collect();
        out.push_str(&format!("  src:      {src_text}\n"));
        out.push_str(&format!("  comment:  {comment}\n"));
        out.push_str(&format!("  trans raw:{}\n", hex_raw.join(" ")));
        out.push_str(&format!("  trans BE: {trans_be}\n"));
        out.push_str(&format!("  trans LE: {trans_le}\n"));
    }

    Ok(out)
}

/// Minimal CSV line parser (handles quoted fields with escaped quotes)
fn parse_csv_line(line: &str) -> Vec<String> {
    let mut fields = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();

    while let Some(c) = chars.next() {
        match c {
            '"' if !in_quotes => in_quotes = true,
            '"' if in_quotes => {
                if chars.peek() == Some(&'"') {
                    chars.next();
                    current.push('"');
                } else {
                    in_quotes = false;
                }
            }
            ',' if !in_quotes => {
                fields.push(current.clone());
                current.clear();
            }
            _ => current.push(c),
        }
    }
    fields.push(current);
    fields
}
