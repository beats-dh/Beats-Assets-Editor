use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};

/// Write `contents` to `path` atomically: write to a temporary file in the same
/// directory and then rename it over the destination. This prevents leaving a
/// truncated/corrupt file behind if the process dies mid-write (the rename is
/// atomic on the same filesystem, on both Unix and Windows).
pub fn write_atomic(path: &Path, contents: &[u8]) -> Result<()> {
    let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("output");
    let tmp_path: PathBuf = match path.parent().filter(|p| !p.as_os_str().is_empty()) {
        Some(dir) => dir.join(format!(".{}.tmp", file_name)),
        None => PathBuf::from(format!(".{}.tmp", file_name)),
    };

    fs::write(&tmp_path, contents).with_context(|| format!("Failed to write temp file {:?}", tmp_path))?;

    if let Err(e) = fs::rename(&tmp_path, path) {
        // Best-effort cleanup so a failed save doesn't leave the temp behind.
        let _ = fs::remove_file(&tmp_path);
        return Err(e).with_context(|| format!("Failed to atomically replace {:?}", path));
    }

    Ok(())
}
