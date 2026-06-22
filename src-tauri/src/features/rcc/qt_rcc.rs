// Compile a `.rcc` using Qt's official `rcc` tool (the same approach as the
// reference Python tool). Unlike the in-house `rcc_writer` (which stores
// entries uncompressed), `rcc.exe` produces a byte-identical-in-spirit, zlib/
// zstd-compressed bundle that the client is known to accept — and it imposes no
// size limit, so added/expanded resources (e.g. new spell icons) just work.
//
// Flow (mirrors grm/core.py compile_rcc):
//   1. dump every in-memory resource into a temp dir, preserving its path
//   2. write a `.qrc` listing them under prefix "/"
//   3. run `rcc --binary <qrc> -o <out.rcc>`
//   4. read the produced bytes back

use std::path::{Path, PathBuf};
use std::process::Command;

use super::rcc_parser::RccEntry;

/// Candidate locations for a Qt `rcc` executable, in priority order.
fn rcc_candidates() -> Vec<PathBuf> {
    let mut out = Vec::new();
    // PySide6 / PyQt6 site-packages under common Python install roots.
    if let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        let home = PathBuf::from(home);
        let roots = [home.join("AppData/Local/Python"), home.join("AppData/Local/Programs/Python"), home.join("AppData/Roaming/Python")];
        for root in roots {
            if let Ok(entries) = std::fs::read_dir(&root) {
                for e in entries.flatten() {
                    for pkg in ["PySide6", "PyQt6"] {
                        let cand = e.path().join("Lib/site-packages").join(pkg).join("rcc.exe");
                        if cand.exists() {
                            out.push(cand);
                        }
                    }
                }
            }
        }
    }
    // PATH-resolved `rcc` / `rcc.exe` as a last resort.
    out.push(PathBuf::from("rcc.exe"));
    out.push(PathBuf::from("rcc"));
    out
}

/// Detect a usable Qt `rcc` executable, verifying it actually runs.
pub fn detect_rcc() -> Option<PathBuf> {
    for cand in rcc_candidates() {
        if probe_rcc(&cand) {
            return Some(cand);
        }
    }
    None
}

/// Returns true if `rcc --version` runs successfully.
fn probe_rcc(exe: &Path) -> bool {
    Command::new(exe).arg("--version").output().map(|o| o.status.success()).unwrap_or(false)
}

/// XML-escape a string for use inside a `.qrc` attribute/text node.
fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;").replace('\'', "&apos;")
}

/// Compile the given resource entries into a `.rcc` binary using `rcc_exe`.
///
/// `rcc_exe` may be a detected path or one the user pointed at. The compiled
/// bytes are returned; the caller decides where to install them.
pub fn compile_with_qt(entries: &[RccEntry], rcc_exe: &Path) -> Result<Vec<u8>, String> {
    if !probe_rcc(rcc_exe) {
        return Err(format!("rcc executable does not run: {}", rcc_exe.display()));
    }

    // Unique temp dir (no Date/rand available here — use pid + a counter).
    let tmp_root = std::env::temp_dir().join(format!("canary_rcc_build_{}", std::process::id()));
    // Best-effort clean slate.
    let _ = std::fs::remove_dir_all(&tmp_root);
    std::fs::create_dir_all(&tmp_root).map_err(|e| format!("Failed to create temp dir: {}", e))?;

    // 1. Dump files, collecting their relative paths.
    let mut rel_paths: Vec<String> = Vec::new();
    let dump_result = (|| -> Result<(), String> {
        for entry in entries {
            if entry.is_directory || entry.path.is_empty() {
                continue;
            }
            let rel = entry.path.replace('\\', "/");
            let out_path = safe_join(&tmp_root, &rel)?;
            if let Some(parent) = out_path.parent() {
                std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create dir for {}: {}", rel, e))?;
            }
            std::fs::write(&out_path, &entry.data).map_err(|e| format!("Failed to write {}: {}", rel, e))?;
            rel_paths.push(rel);
        }
        Ok(())
    })();
    if let Err(e) = dump_result {
        let _ = std::fs::remove_dir_all(&tmp_root);
        return Err(e);
    }
    if rel_paths.is_empty() {
        let _ = std::fs::remove_dir_all(&tmp_root);
        return Err("No resources to compile.".into());
    }
    rel_paths.sort();

    // 2. Write the .qrc.
    let qrc_path = tmp_root.join("graphics_resources.qrc");
    let mut qrc = String::from("<!DOCTYPE RCC><RCC version=\"1.0\">\n  <qresource prefix=\"/\">\n");
    for rel in &rel_paths {
        let esc = xml_escape(rel);
        qrc.push_str(&format!("    <file alias=\"{}\">{}</file>\n", esc, esc));
    }
    qrc.push_str("  </qresource>\n</RCC>\n");
    if let Err(e) = std::fs::write(&qrc_path, qrc) {
        let _ = std::fs::remove_dir_all(&tmp_root);
        return Err(format!("Failed to write .qrc: {}", e));
    }

    // 3. Run rcc --binary (cwd = temp dir so aliases resolve).
    //
    // Force the SAME on-disk format the client ships and our parser reads back:
    // RCC format v1 with zlib compression and no zstd. (rcc 6.x defaults to a
    // newer version + zstd, which the client may accept but our reader can't
    // re-open.) `--compress 9` maximises ratio; `--threshold 0` always tries.
    let out_rcc = tmp_root.join("graphics_resources_custom.rcc");
    let output = Command::new(rcc_exe)
        .arg("--binary")
        .arg("--format-version")
        .arg("1")
        .arg("--no-zstd")
        .arg("--compress-algo")
        .arg("zlib")
        .arg("--compress")
        .arg("9")
        .arg("--threshold")
        .arg("0")
        .arg(&qrc_path)
        .arg("-o")
        .arg(&out_rcc)
        .current_dir(&tmp_root)
        .output();

    let result = match output {
        Ok(o) if o.status.success() => std::fs::read(&out_rcc).map_err(|e| format!("Failed to read compiled .rcc: {}", e)),
        Ok(o) => Err(format!("rcc failed (exit {:?}): {}", o.status.code(), String::from_utf8_lossy(&o.stderr).trim())),
        Err(e) => Err(format!("Failed to launch rcc: {}", e)),
    };

    // 4. Clean up the temp dir regardless of outcome.
    let _ = std::fs::remove_dir_all(&tmp_root);
    result
}

/// Join an untrusted relative resource path onto `base`, rejecting anything that
/// could escape the temp dir (absolute, `..`, drive prefixes).
fn safe_join(base: &Path, rel: &str) -> Result<PathBuf, String> {
    use std::path::Component;
    let mut out = base.to_path_buf();
    for comp in Path::new(rel).components() {
        match comp {
            Component::Normal(p) => out.push(p),
            Component::CurDir => {}
            _ => return Err(format!("Unsafe resource path: {}", rel)),
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn xml_escape_handles_specials() {
        assert_eq!(xml_escape("a&b<c>d\"e'f"), "a&amp;b&lt;c&gt;d&quot;e&apos;f");
    }

    #[test]
    fn safe_join_rejects_escape() {
        let base = std::env::temp_dir();
        assert!(safe_join(&base, "../evil").is_err());
        assert!(safe_join(&base, "a/b/c.png").is_ok());
    }

    /// Opt-in: compile a real .rcc round-trip via the system rcc.exe, then verify
    /// the output re-parses and the client-facing resource set matches.
    /// Set CANARY_TEST_RCC (and have a Qt rcc available) to run.
    #[test]
    fn compile_real_rcc_when_env_set() {
        use super::super::rcc_parser::RccFile;
        let Ok(path) = std::env::var("CANARY_TEST_RCC") else {
            return;
        };
        let Some(rcc_exe) = detect_rcc() else {
            eprintln!("skip: no Qt rcc found");
            return;
        };
        let data = std::fs::read(&path).expect("read CANARY_TEST_RCC");
        let original = RccFile::parse(&data).expect("parse original");

        let compiled = compile_with_qt(&original.entries, &rcc_exe).expect("compile with qt");
        let rebuilt = RccFile::parse(&compiled).expect("re-parse compiled");

        let mut orig_paths: Vec<&str> = original.entries.iter().filter(|e| !e.is_directory).map(|e| e.path.as_str()).collect();
        let mut new_paths: Vec<&str> = rebuilt.entries.iter().filter(|e| !e.is_directory).map(|e| e.path.as_str()).collect();
        orig_paths.sort();
        new_paths.sort();
        let oset: std::collections::HashSet<&str> = orig_paths.iter().copied().collect();
        let nset: std::collections::HashSet<&str> = new_paths.iter().copied().collect();
        let only_orig: Vec<&str> = orig_paths.iter().copied().filter(|p| !nset.contains(p)).take(6).collect();
        let only_new: Vec<&str> = new_paths.iter().copied().filter(|p| !oset.contains(p)).take(6).collect();
        eprintln!("qt-compiled size = {} bytes (original {} bytes)", compiled.len(), data.len());
        eprintln!("orig files = {}, rebuilt files = {}", orig_paths.len(), new_paths.len());
        eprintln!("only in ORIGINAL (first 6): {:?}", only_orig);
        eprintln!("only in REBUILT  (first 6): {:?}", only_new);
        assert!(only_orig.is_empty() && only_new.is_empty(), "path sets differ");

        let mut orig: std::collections::HashMap<&str, &[u8]> = std::collections::HashMap::new();
        for e in &original.entries {
            if !e.is_directory {
                orig.insert(e.path.as_str(), e.data.as_slice());
            }
        }
        for e in &rebuilt.entries {
            if e.is_directory {
                continue;
            }
            let o = orig.get(e.path.as_str()).unwrap_or_else(|| panic!("missing path: {}", e.path));
            assert_eq!(*o, e.data.as_slice(), "bytes differ for {}", e.path);
        }
    }
}
