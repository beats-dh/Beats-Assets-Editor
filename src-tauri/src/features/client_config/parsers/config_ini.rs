//! Minimal reader/writer for the client's `conf/config.ini`, focused on the
//! `[URLS]` section. It preserves the whole file (comments, other sections,
//! ordering) and only replaces the *values* of existing keys, so a save never
//! reformats or drops anything the client relies on.

use anyhow::{Context, Result};
use std::path::Path;

/// One `key=value` entry from a section, in file order.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct IniEntry {
    pub key: String,
    pub value: String,
}

/// Case-insensitive section-header match: `[urls]` == `[URLS]`.
fn section_name(line: &str) -> Option<String> {
    let t = line.trim();
    if t.starts_with('[') && t.ends_with(']') && t.len() >= 2 {
        Some(t[1..t.len() - 1].trim().to_ascii_lowercase())
    } else {
        None
    }
}

/// Split a `key=value` line into (key, value), or `None` if it isn't one
/// (blank, comment, or malformed). Comments start with `;` or `#`.
fn split_kv(line: &str) -> Option<(&str, &str)> {
    let t = line.trim_start();
    if t.is_empty() || t.starts_with(';') || t.starts_with('#') {
        return None;
    }
    let eq = line.find('=')?;
    let key = line[..eq].trim();
    if key.is_empty() {
        return None;
    }
    Some((key, line[eq + 1..].trim()))
}

/// Read every `key=value` entry of `[section]` (case-insensitive), in file order.
pub fn read_section(path: &Path, section: &str) -> Result<Vec<IniEntry>> {
    let text = std::fs::read_to_string(path).with_context(|| format!("Failed to read {:?}", path))?;
    let want = section.to_ascii_lowercase();
    let mut current: Option<String> = None;
    let mut out = Vec::new();

    for line in text.lines() {
        if let Some(name) = section_name(line) {
            current = Some(name);
            continue;
        }
        if current.as_deref() == Some(want.as_str()) {
            if let Some((k, v)) = split_kv(line) {
                out.push(IniEntry {
                    key: k.to_string(),
                    value: v.to_string(),
                });
            }
        }
    }
    Ok(out)
}

/// Rewrite the file's text, replacing the value of each `updates` key found
/// inside `[section]`. Keys not present are ignored (v1 does not add keys); the
/// rest of the file is preserved byte-for-byte except the changed lines. The
/// original newline style (CRLF vs LF) and trailing newline are preserved.
pub fn rewrite_section(original: &str, section: &str, updates: &[IniEntry]) -> String {
    let want = section.to_ascii_lowercase();
    let map: std::collections::HashMap<&str, &str> = updates.iter().map(|e| (e.key.as_str(), e.value.as_str())).collect();

    let newline = if original.contains("\r\n") {
        "\r\n"
    } else {
        "\n"
    };
    let ends_with_newline = original.ends_with('\n');

    let mut current: Option<String> = None;
    let mut lines_out: Vec<String> = Vec::new();

    for raw in original.split_inclusive('\n') {
        // Work on the line without its trailing newline; re-add uniformly.
        let line = raw.trim_end_matches(['\r', '\n']);

        if let Some(name) = section_name(line) {
            current = Some(name);
            lines_out.push(line.to_string());
            continue;
        }

        if current.as_deref() == Some(want.as_str()) {
            if let Some((k, _)) = split_kv(line) {
                if let Some(new_val) = map.get(k) {
                    lines_out.push(format!("{}={}", k, new_val));
                    continue;
                }
            }
        }
        lines_out.push(line.to_string());
    }

    let mut result = lines_out.join(newline);
    if ends_with_newline {
        result.push_str(newline);
    }
    result
}

/// Apply `updates` to `[section]` of the file at `path`, writing atomically.
pub fn write_section(path: &Path, section: &str, updates: &[IniEntry]) -> Result<()> {
    let original = std::fs::read_to_string(path).with_context(|| format!("Failed to read {:?}", path))?;
    let updated = rewrite_section(&original, section, updates);
    crate::core::fs_util::write_atomic(path, updated.as_bytes()).with_context(|| format!("Failed to write {:?}", path))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "[URLS]\r\ntibiaPageUrl=https://old.example   \r\nloginWebService=http://127.0.0.1:8081/login\r\n; a comment\r\n[OTHER]\r\nkeep=me\r\n";

    #[test]
    fn reads_urls_in_order_and_trims_padding() {
        let dir = std::env::temp_dir().join(format!("cfg_read_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let p = dir.join("config.ini");
        std::fs::write(&p, SAMPLE).unwrap();

        let entries = read_section(&p, "URLS").unwrap();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].key, "tibiaPageUrl");
        assert_eq!(entries[0].value, "https://old.example"); // trailing padding trimmed
        assert_eq!(entries[1].key, "loginWebService");
    }

    #[test]
    fn rewrite_replaces_only_targeted_values_and_preserves_rest() {
        let updates = vec![IniEntry {
            key: "loginWebService".into(),
            value: "http://myserver:7171/login".into(),
        }];
        let out = rewrite_section(SAMPLE, "URLS", &updates);

        assert!(out.contains("loginWebService=http://myserver:7171/login"));
        assert!(out.contains("tibiaPageUrl=https://old.example")); // untouched key preserved
        assert!(out.contains("; a comment")); // comment preserved
        assert!(out.contains("[OTHER]") && out.contains("keep=me")); // other section preserved
        assert!(out.ends_with("\r\n")); // CRLF + trailing newline preserved
    }

    #[test]
    fn rewrite_ignores_keys_outside_the_section() {
        // `keep` lives in [OTHER]; a URLS update for it must not touch it.
        let updates = vec![IniEntry {
            key: "keep".into(),
            value: "HACKED".into(),
        }];
        let out = rewrite_section(SAMPLE, "URLS", &updates);
        assert!(out.contains("keep=me"));
        assert!(!out.contains("HACKED"));
    }
}
