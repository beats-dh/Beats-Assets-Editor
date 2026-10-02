pub mod battleye;
pub mod rsa;
pub mod urls;

use std::path::PathBuf;

/// Candidate locations for the client's `conf/config.ini`, given the app's
/// configured client root (the folder that also holds `assets/`).
pub(crate) fn config_ini_candidates(tibia_path: &str) -> Vec<PathBuf> {
    let root = PathBuf::from(tibia_path);
    let parent = root.parent().map(|p| p.to_path_buf());
    let mut v = vec![root.join("conf").join("config.ini"), root.join("config.ini")];
    if let Some(p) = parent {
        v.push(p.join("conf").join("config.ini"));
    }
    v
}

/// Candidate client executables to scan for the BattleEye gate. Mirrors the RCC
/// feature's search (root, `bin/`, and the same next to the parent).
pub(crate) fn exe_candidates(tibia_path: &str) -> Vec<PathBuf> {
    let base = PathBuf::from(tibia_path);
    let parent = base.parent().unwrap_or(&base).to_path_buf();
    let dirs = [base.clone(), base.join("bin"), parent.clone(), parent.join("bin")];

    let mut out = Vec::new();
    for dir in dirs {
        if let Ok(entries) = std::fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e.eq_ignore_ascii_case("exe")).unwrap_or(false) {
                    out.push(path);
                }
            }
        }
    }
    out.sort();
    out.dedup();
    out
}
