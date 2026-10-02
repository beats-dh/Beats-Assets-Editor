// Write embedded Qt resources back INTO a binary, in place.
//
// Ported faithfully from the reference Python tool (grm/core.py
// `embed_spell_jsons` + `patch_client_for_embedded_spells`). The technique only
// rewrites bytes that already exist — it never changes the PE layout — so it is
// safe and the client recognises the edit:
//
//   embed: a JSON resource lives as a zlib stream at a fixed offset, framed by
//   the surrounding Qt machinery as `compressed_size` bytes. We re-minify the
//   new JSON, pad it with spaces up to the ORIGINAL uncompressed length (spaces
//   are valid JSON whitespace, so the decoded value is unchanged and the stored
//   uncompressed-size field stays correct), zlib-compress at level 9, require it
//   to fit the original compressed slot, zero-pad the remainder (trailing zeros
//   are ignored by the inflater) and write it back at the same offset.
//
//   path patch: the client reads spells either from disk (`./spells/...`) or
//   embedded (`:/spells/...`). Both byte strings are the same length, so we can
//   swap one for the other in place to force the client to read the embedded
//   copy we just wrote.

use std::io::Write;
use std::path::Path;

use flate2::write::ZlibEncoder;
use flate2::Compression;

use crate::core::fs_util::write_atomic;

/// zlib stream header bytes we recognise (CMF=0x78 with common FLG values).
fn is_zlib_header(a: u8, b: u8) -> bool {
    a == 0x78 && matches!(b, 0x01 | 0x9c | 0xda | 0x5e) && (((a as u16) << 8 | b as u16) % 31 == 0)
}

/// A located embedded resource slot inside the binary.
#[derive(Debug, Clone)]
pub struct ZlibSlot {
    /// Absolute byte offset of the zlib stream in the binary.
    pub offset: usize,
    /// Number of bytes the original compressed stream occupies (the slot size).
    pub compressed_size: usize,
    /// The original decompressed bytes (defines the max uncompressed length).
    pub raw: Vec<u8>,
}

/// Inflate the zlib stream starting at `offset`, returning (raw, compressed_size).
fn inflate_at(data: &[u8], offset: usize) -> Option<(Vec<u8>, usize)> {
    use flate2::read::ZlibDecoder;
    use std::io::Read;
    let mut dec = ZlibDecoder::new(&data[offset..]);
    let mut raw = Vec::new();
    if dec.read_to_end(&mut raw).is_err() {
        return None;
    }
    // total_in() = number of compressed bytes actually consumed.
    let compressed_size = dec.total_in() as usize;
    if compressed_size == 0 {
        return None;
    }
    Some((raw, compressed_size))
}

/// Find the two spell JSON slots (`spells.json`, `spells-previews.json`) by
/// content sniffing, mirroring the Python `find_spell_json_resources`.
pub fn find_spell_json_slots(data: &[u8]) -> Result<(ZlibSlot, ZlibSlot), String> {
    let mut spells: Option<ZlibSlot> = None;
    let mut previews: Option<ZlibSlot> = None;
    let mut seen: std::collections::HashSet<usize> = std::collections::HashSet::new();

    let mut i = 0usize;
    while i + 2 <= data.len() {
        if !is_zlib_header(data[i], data[i + 1]) {
            i += 1;
            continue;
        }
        if !seen.insert(i) {
            i += 1;
            continue;
        }
        if let Some((raw, compressed_size)) = inflate_at(data, i) {
            // Search a generous prefix: after a re-embed the JSON is minified and
            // serde sorts object keys, so `spellid` may not be in the first KB.
            let scan = &raw[..raw.len().min(64 * 1024)];
            let stripped = trim_start(&raw);
            if spells.is_none() && stripped.first() == Some(&b'[') && contains(scan, b"\"spellid\"") {
                spells = Some(ZlibSlot {
                    offset: i,
                    compressed_size,
                    raw: raw.clone(),
                });
            }
            if previews.is_none() && stripped.first() == Some(&b'{') && contains(scan, b"\"timestamps\"") {
                previews = Some(ZlibSlot {
                    offset: i,
                    compressed_size,
                    raw,
                });
            }
        }
        i += 1;
    }

    match (spells, previews) {
        (Some(s), Some(p)) => Ok((s, p)),
        (s, p) => {
            let mut missing = Vec::new();
            if s.is_none() {
                missing.push("spells.json");
            }
            if p.is_none() {
                missing.push("spells-previews.json");
            }
            Err(format!("Embedded resources not found: {}", missing.join(", ")))
        }
    }
}

fn trim_start(b: &[u8]) -> &[u8] {
    let mut i = 0;
    while i < b.len() && (b[i] == b' ' || b[i] == b'\n' || b[i] == b'\r' || b[i] == b'\t') {
        i += 1;
    }
    &b[i..]
}

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    if needle.is_empty() || haystack.len() < needle.len() {
        return false;
    }
    haystack.windows(needle.len()).any(|w| w == needle)
}

/// Minify JSON (no insignificant whitespace), matching the Python embed step.
pub fn minify_json(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let value: serde_json::Value = serde_json::from_slice(bytes).map_err(|e| format!("Invalid JSON: {}", e))?;
    serde_json::to_vec(&value).map_err(|e| format!("Failed to re-encode JSON: {}", e))
}

/// Build the replacement bytes for one slot: minify -> space-pad to the original
/// uncompressed length -> zlib level 9 -> zero-pad to the slot's compressed size.
///
/// Returns an error if the new content (minified) is larger than the original
/// uncompressed length, or if its compressed form does not fit the slot.
pub fn build_slot_replacement(slot: &ZlibSlot, new_json: &[u8]) -> Result<Vec<u8>, String> {
    let minified = minify_json(new_json)?;
    let max_uncompressed = slot.raw.len();
    if minified.len() > max_uncompressed {
        return Err(format!("Content exceeds maximum size ({} > {} bytes uncompressed). Remove some data and try again.", minified.len(), max_uncompressed));
    }
    // Space-pad: spaces are valid JSON whitespace, so the decoded value is
    // identical AND the uncompressed length stays exactly what the binary's
    // size field already records.
    let mut padded = minified;
    padded.resize(max_uncompressed, b' ');

    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::new(9));
    encoder.write_all(&padded).map_err(|e| e.to_string())?;
    let compressed = encoder.finish().map_err(|e| e.to_string())?;

    if compressed.len() > slot.compressed_size {
        return Err(format!("Compressed content exceeds the embedded slot ({} > {} bytes). Remove some data and try again.", compressed.len(), slot.compressed_size));
    }
    // Zero-pad the rest of the slot. Trailing zeros after a complete zlib stream
    // are ignored by the inflater, so this is safe.
    let mut replacement = compressed;
    replacement.resize(slot.compressed_size, 0);
    Ok(replacement)
}

/// Result of an embed operation, for UI reporting.
#[derive(Debug, serde::Serialize)]
pub struct EmbedReport {
    pub name: String,
    pub compressed_used: usize,
    pub compressed_max: usize,
    pub uncompressed_used: usize,
    pub uncompressed_max: usize,
}

/// Embed `(name, json_bytes)` pairs into the binary at `exe_path`, writing the
/// result back atomically after creating a one-time `client.original.exe` backup.
pub fn embed_resources(exe_path: &Path, items: &[(String, Vec<u8>)]) -> Result<Vec<EmbedReport>, String> {
    let data = std::fs::read(exe_path).map_err(|e| format!("Failed to read binary: {}", e))?;
    let (spells_slot, previews_slot) = find_spell_json_slots(&data)?;

    let mut patched = data.clone();
    let mut reports = Vec::new();
    for (name, json) in items {
        let slot = match name.as_str() {
            "spells.json" => &spells_slot,
            "spells-previews.json" => &previews_slot,
            other => return Err(format!("Embedding '{}' is not supported (only spells.json / spells-previews.json).", other)),
        };
        let replacement = build_slot_replacement(slot, json)?;
        patched[slot.offset..slot.offset + slot.compressed_size].copy_from_slice(&replacement);
        let minified_len = minify_json(json)?.len();
        reports.push(EmbedReport {
            name: name.clone(),
            compressed_used: replacement.iter().rposition(|&b| b != 0).map(|p| p + 1).unwrap_or(0),
            compressed_max: slot.compressed_size,
            uncompressed_used: minified_len,
            uncompressed_max: slot.raw.len(),
        });
    }

    backup_once(exe_path, "client.original.exe")?;
    write_atomic(exe_path, &patched).map_err(|e| format!("Failed to write binary: {}", e))?;
    Ok(reports)
}

// ---------------------------------------------------------------------------
// Generic in-place embed (any compressed/raw resource, not just spell JSONs)
// ---------------------------------------------------------------------------

use super::pe_qt_parser::ExeSlot;

/// zlib-compress `raw` at max level.
fn zlib_compress(raw: &[u8]) -> Result<Vec<u8>, String> {
    let mut enc = ZlibEncoder::new(Vec::new(), Compression::new(9));
    enc.write_all(raw).map_err(|e| e.to_string())?;
    enc.finish().map_err(|e| e.to_string())
}

/// Embed arbitrary new bytes into one resource slot of `data`, in place.
///
/// - `ExeSlot::Zlib`: recompress `new_raw` (zlib L9), require it to fit the
///   original compressed budget, write it at the stream offset, zero-pad the
///   remainder (trailing zeros are ignored by the inflater), and update the
///   `uncompressed_size` field so it stays in sync with the new content. Unlike
///   the JSON-only path, the decompressed length MAY differ from the original.
/// - `ExeSlot::Raw`: require `new_raw` to fit the carved region, overwrite it,
///   and zero-pad the remainder.
///
/// Mutates `data` in place. Returns an `EmbedReport` for the UI.
fn embed_into_slot(data: &mut [u8], slot: &ExeSlot, name: &str, new_raw: &[u8]) -> Result<EmbedReport, String> {
    match *slot {
        ExeSlot::Zlib {
            stream_offset,
            compressed_budget,
            uncompressed_size_field,
        } => {
            let compressed = zlib_compress(new_raw)?;
            if compressed.len() > compressed_budget {
                return Err(format!(
                    "'{}' is too large to embed: it compresses to {} bytes but the slot only holds {}. Reduce the content (or save it to disk / the .rcc instead).",
                    name,
                    compressed.len(),
                    compressed_budget
                ));
            }
            // Bounds: the stream + its budget, and the size field, must be inside.
            let end = stream_offset.checked_add(compressed_budget).ok_or("slot overflow")?;
            if end > data.len() || uncompressed_size_field + 4 > data.len() {
                return Err("Resource slot is out of bounds for this binary.".into());
            }
            // Overwrite the compressed stream, zero-padding the rest of the budget.
            data[stream_offset..stream_offset + compressed.len()].copy_from_slice(&compressed);
            for b in &mut data[stream_offset + compressed.len()..end] {
                *b = 0;
            }
            // Keep the uncompressed-size field in sync with the new content.
            let uc = u32::try_from(new_raw.len()).map_err(|_| "content too large for u32 size field")?;
            data[uncompressed_size_field..uncompressed_size_field + 4].copy_from_slice(&uc.to_be_bytes());
            Ok(EmbedReport {
                name: name.to_string(),
                compressed_used: compressed.len(),
                compressed_max: compressed_budget,
                uncompressed_used: new_raw.len(),
                uncompressed_max: compressed_budget, // budget is the hard limit here
            })
        }
        ExeSlot::Raw {
            offset,
            region,
        } => {
            if new_raw.len() > region {
                return Err(format!("'{}' is too large to embed: {} bytes but the slot only holds {}. Reduce the content (or save it to disk / the .rcc instead).", name, new_raw.len(), region));
            }
            let end = offset.checked_add(region).ok_or("slot overflow")?;
            if end > data.len() {
                return Err("Resource slot is out of bounds for this binary.".into());
            }
            data[offset..offset + new_raw.len()].copy_from_slice(new_raw);
            for b in &mut data[offset + new_raw.len()..end] {
                *b = 0;
            }
            Ok(EmbedReport {
                name: name.to_string(),
                compressed_used: new_raw.len(),
                compressed_max: region,
                uncompressed_used: new_raw.len(),
                uncompressed_max: region,
            })
        }
    }
}

/// Embed arbitrary `(slot, name, new_bytes)` items into the binary at
/// `exe_path`, writing back atomically after a one-time `client.original.exe`
/// backup. This is the generic counterpart of [`embed_resources`] and works for
/// any recovered resource (QML, CSS, text, PNG, …), not only the spell JSONs.
pub fn embed_slots(exe_path: &Path, items: &[(ExeSlot, String, Vec<u8>)]) -> Result<Vec<EmbedReport>, String> {
    let mut data = std::fs::read(exe_path).map_err(|e| format!("Failed to read binary: {}", e))?;
    let mut reports = Vec::with_capacity(items.len());
    for (slot, name, new_raw) in items {
        reports.push(embed_into_slot(&mut data, slot, name, new_raw)?);
    }
    backup_once(exe_path, "client.original.exe")?;
    write_atomic(exe_path, &data).map_err(|e| format!("Failed to write binary: {}", e))?;
    Ok(reports)
}

/// Spell-path byte variants the client may use (all equal length per index).
const SPELL_PATHS_EMBEDDED: [&[u8]; 2] = [b":/spells/spells.json", b":/spells/spells-previews.json"];
const SPELL_PATHS_EXTERNAL: [&[u8]; 2] = [b"./spells/spells.json", b"./spells/spells-previews.json"];
const SPELL_PATHS_BUNDLED: [&[u8]; 2] = [b":/custom/spells.json", b":/custom/spells-previews.json"];

/// Patch the client so it reads the EMBEDDED spell JSONs (`:/spells/...`).
///
/// Mirrors the Python `patch_client_for_embedded_spells`: detects which variant
/// is currently present (exactly once each) and swaps it for the embedded one,
/// preserving byte length. Returns true if a patch was applied, false if it was
/// already pointing at the embedded paths.
pub fn patch_spell_paths(exe_path: &Path) -> Result<bool, String> {
    let data = std::fs::read(exe_path).map_err(|e| format!("Failed to read binary: {}", e))?;

    let count_variant = |variant: &[&[u8]; 2]| -> [usize; 2] { [count_occurrences(&data, variant[0]), count_occurrences(&data, variant[1])] };

    if count_variant(&SPELL_PATHS_EMBEDDED) == [1, 1] {
        return Ok(false); // already embedded
    }

    // Pick a source variant present exactly once each.
    let source = [&SPELL_PATHS_EXTERNAL, &SPELL_PATHS_BUNDLED].into_iter().find(|v| count_variant(v) == [1, 1]);
    let source = source.ok_or("No patchable spell-path variant found in the binary.")?;

    let mut patched = data;
    for (old, new) in source.iter().zip(SPELL_PATHS_EMBEDDED.iter()) {
        if old.len() != new.len() {
            return Err("Internal error: spell-path length mismatch.".into());
        }
        replace_once(&mut patched, old, new)?;
    }

    backup_once(exe_path, "client.original.exe")?;
    write_atomic(exe_path, &patched).map_err(|e| format!("Failed to write binary: {}", e))?;
    Ok(true)
}

/// Patch the client so it reads the spell JSONs from DISK (`./spells/...`).
///
/// The inverse of [`patch_spell_paths`]: swaps whatever variant is present for
/// the external one (same byte length). Combined with writing the JSON files
/// into the client's `spells/` folder, this removes the embed size limit
/// entirely — the game reads the loose files, which can be any size.
///
/// Returns true if a patch was applied, false if it was already external.
pub fn patch_spell_paths_to_disk(exe_path: &Path) -> Result<bool, String> {
    let data = std::fs::read(exe_path).map_err(|e| format!("Failed to read binary: {}", e))?;
    let count_variant = |variant: &[&[u8]; 2]| -> [usize; 2] { [count_occurrences(&data, variant[0]), count_occurrences(&data, variant[1])] };

    if count_variant(&SPELL_PATHS_EXTERNAL) == [1, 1] {
        return Ok(false); // already reading from disk
    }
    let source = [&SPELL_PATHS_EMBEDDED, &SPELL_PATHS_BUNDLED].into_iter().find(|v| count_variant(v) == [1, 1]);
    let source = source.ok_or("No patchable spell-path variant found in the binary.")?;

    let mut patched = data;
    for (old, new) in source.iter().zip(SPELL_PATHS_EXTERNAL.iter()) {
        if old.len() != new.len() {
            return Err("Internal error: spell-path length mismatch.".into());
        }
        replace_once(&mut patched, old, new)?;
    }

    backup_once(exe_path, "client.original.exe")?;
    write_atomic(exe_path, &patched).map_err(|e| format!("Failed to write binary: {}", e))?;
    Ok(true)
}

fn count_occurrences(haystack: &[u8], needle: &[u8]) -> usize {
    if needle.is_empty() || haystack.len() < needle.len() {
        return 0;
    }
    let mut count = 0;
    let mut i = 0;
    while i + needle.len() <= haystack.len() {
        if &haystack[i..i + needle.len()] == needle {
            count += 1;
            i += needle.len();
        } else {
            i += 1;
        }
    }
    count
}

fn replace_once(buf: &mut [u8], old: &[u8], new: &[u8]) -> Result<(), String> {
    let pos = buf.windows(old.len()).position(|w| w == old).ok_or_else(|| format!("Pattern to patch not found: {}", String::from_utf8_lossy(old)))?;
    buf[pos..pos + new.len()].copy_from_slice(new);
    Ok(())
}

/// Copy `path` to a sibling named `backup_name` once (no overwrite).
fn backup_once(path: &Path, backup_name: &str) -> Result<(), String> {
    let backup = path.with_file_name(backup_name);
    if !backup.exists() {
        std::fs::copy(path, &backup).map_err(|e| format!("Failed to create backup {}: {}", backup.display(), e))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_zlib(raw: &[u8]) -> Vec<u8> {
        let mut e = ZlibEncoder::new(Vec::new(), Compression::new(9));
        e.write_all(raw).unwrap();
        e.finish().unwrap()
    }

    #[test]
    fn minify_strips_whitespace() {
        let out = minify_json(b"{\n  \"a\" : 1\n}").unwrap();
        assert_eq!(out, b"{\"a\":1}");
    }

    #[test]
    fn build_replacement_fits_and_roundtrips() {
        // Original raw is a spells-like JSON array padded large.
        let original = b"[{\"spellid\":1,\"name\":\"old name here padding padding\"}]".to_vec();
        let stream = make_zlib(&original);
        let slot = ZlibSlot {
            offset: 0,
            compressed_size: stream.len() + 32, // generous slot
            raw: original.clone(),
        };
        let new_json = b"[{\"spellid\":1,\"name\":\"new\"}]";
        let replacement = build_slot_replacement(&slot, new_json).unwrap();
        assert_eq!(replacement.len(), slot.compressed_size);

        // Inflate the replacement and confirm it decodes to the new JSON value.
        use flate2::read::ZlibDecoder;
        use std::io::Read;
        let mut dec = ZlibDecoder::new(&replacement[..]);
        let mut raw = Vec::new();
        dec.read_to_end(&mut raw).unwrap();
        assert_eq!(raw.len(), original.len()); // space-padded to original length
        let value: serde_json::Value = serde_json::from_slice(&raw).unwrap();
        assert_eq!(value[0]["name"], "new");
    }

    #[test]
    fn build_replacement_rejects_too_large() {
        let original = b"[{\"spellid\":1}]".to_vec();
        let slot = ZlibSlot {
            offset: 0,
            compressed_size: 1024,
            raw: original,
        };
        // Much larger than the original uncompressed length.
        let big = format!("[{{\"spellid\":1,\"x\":\"{}\"}}]", "y".repeat(500));
        let err = build_slot_replacement(&slot, big.as_bytes()).unwrap_err();
        assert!(err.contains("exceeds maximum size"), "got: {}", err);
    }

    #[test]
    fn count_and_replace_helpers() {
        let mut buf = b"hello ./spells/spells.json world".to_vec();
        assert_eq!(count_occurrences(&buf, b"./spells/spells.json"), 1);
        replace_once(&mut buf, b"./spells/spells.json", b":/spells/spells.json").unwrap();
        assert!(contains(&buf, b":/spells/spells.json"));
    }

    #[test]
    fn disk_patch_swaps_embedded_to_external() {
        // Fake binary containing the EMBEDDED spell paths exactly once each.
        let mut bin = b"prefix ".to_vec();
        bin.extend_from_slice(b":/spells/spells.json");
        bin.extend_from_slice(b" middle ");
        bin.extend_from_slice(b":/spells/spells-previews.json");
        bin.extend_from_slice(b" suffix");

        let mut tmp = std::env::temp_dir();
        tmp.push(format!("canary_diskpatch_{}.bin", std::process::id()));
        std::fs::write(&tmp, &bin).unwrap();

        // First patch swaps embedded -> external and reports a change.
        assert!(patch_spell_paths_to_disk(&tmp).unwrap());
        let after = std::fs::read(&tmp).unwrap();
        assert!(contains(&after, b"./spells/spells.json"));
        assert!(contains(&after, b"./spells/spells-previews.json"));
        assert!(!contains(&after, b":/spells/spells.json"));
        assert_eq!(after.len(), bin.len(), "length must be preserved");

        // Idempotent: a second call reports no change.
        assert!(!patch_spell_paths_to_disk(&tmp).unwrap());

        let _ = std::fs::remove_file(&tmp);
        let _ = std::fs::remove_file(tmp.with_file_name("client.original.exe"));
    }

    #[test]
    fn generic_zlib_embed_updates_size_field_and_roundtrips() {
        use flate2::read::ZlibDecoder;
        use std::io::Read;

        // Build a buffer: [u32 payload_len][u32 uncompressed_size][zlib stream][slack].
        let original = b"import QtQuick\nItem { width: 100 }".to_vec();
        let stream = make_zlib(&original);
        let budget = stream.len() + 40; // generous compressed budget
        let mut data = Vec::new();
        data.extend_from_slice(&0u32.to_be_bytes()); // payload_len (unused by writer)
        let uc_field = data.len();
        data.extend_from_slice(&(original.len() as u32).to_be_bytes()); // uncompressed_size
        let stream_off = data.len();
        data.extend_from_slice(&stream);
        data.resize(stream_off + budget, 0); // slack to fill the budget

        // New content with a DIFFERENT length (shorter) than the original.
        let new_raw = b"import QtQuick\nItem { width: 7 }";
        let slot = ExeSlot::Zlib {
            stream_offset: stream_off,
            compressed_budget: budget,
            uncompressed_size_field: uc_field,
        };
        let report = embed_into_slot(&mut data, &slot, "x.qml", new_raw).unwrap();
        assert_eq!(report.uncompressed_used, new_raw.len());

        // The size field must now equal the NEW length.
        let written_uc = u32::from_be_bytes([data[uc_field], data[uc_field + 1], data[uc_field + 2], data[uc_field + 3]]);
        assert_eq!(written_uc as usize, new_raw.len());

        // The stream must inflate back to exactly the new content.
        let mut dec = ZlibDecoder::new(&data[stream_off..]);
        let mut got = Vec::new();
        dec.read_to_end(&mut got).unwrap();
        assert_eq!(got, new_raw);
    }

    #[test]
    fn generic_zlib_embed_rejects_too_large() {
        let original = b"small".to_vec();
        let stream = make_zlib(&original);
        let budget = stream.len(); // tight budget
        let mut data = vec![0u8; 8];
        let uc_field = 4;
        let stream_off = 8;
        data.extend_from_slice(&stream);
        data.resize(stream_off + budget, 0);
        let slot = ExeSlot::Zlib {
            stream_offset: stream_off,
            compressed_budget: budget,
            uncompressed_size_field: uc_field,
        };
        // Incompressible-ish, definitely larger than the tiny budget.
        let big: Vec<u8> = (0..4096).map(|i| (i * 31 + 7) as u8).collect();
        let err = embed_into_slot(&mut data, &slot, "x.bin", &big).unwrap_err();
        assert!(err.contains("too large to embed"), "got: {}", err);
    }

    #[test]
    fn generic_raw_embed_overwrites_region() {
        let mut data = vec![0xAAu8; 64];
        let slot = ExeSlot::Raw {
            offset: 8,
            region: 16,
        };
        let new_raw = b"\x89PNGnewdata";
        embed_into_slot(&mut data, &slot, "x.png", new_raw).unwrap();
        assert_eq!(&data[8..8 + new_raw.len()], new_raw);
        // remainder of the region zero-padded
        assert!(data[8 + new_raw.len()..24].iter().all(|&b| b == 0));
        // bytes outside the region untouched
        assert_eq!(data[7], 0xAA);
        assert_eq!(data[24], 0xAA);
    }

    /// Opt-in: real client.exe embed roundtrip. Set CANARY_TEST_EXE to run.
    /// Copies the binary to a temp file, edits one spell name inside spells.json,
    /// embeds it, then re-reads the slot and confirms the edit is present and the
    /// file size is unchanged (in-place, no PE-layout change).
    #[test]
    fn real_exe_embed_roundtrip() {
        let Ok(src) = std::env::var("CANARY_TEST_EXE") else {
            return;
        };
        let original = std::fs::read(&src).expect("read CANARY_TEST_EXE");
        let (spells_slot, _previews) = find_spell_json_slots(&original).expect("find slots");

        // Decode the embedded spells.json, change the first spell's name.
        let mut value: serde_json::Value = serde_json::from_slice(trim_start(&spells_slot.raw)).expect("parse embedded spells.json");
        let arr = value.as_array_mut().expect("spells is array");
        let marker = "CANARY_EMBED_TEST";
        arr[0]["name"] = serde_json::Value::String(marker.to_string());
        let new_json = serde_json::to_vec(&value).unwrap();

        // Write to a temp copy and embed.
        let mut tmp = std::env::temp_dir();
        tmp.push(format!("canary_embed_test_{}.exe", std::process::id()));
        std::fs::write(&tmp, &original).unwrap();
        let report = match embed_resources(&tmp, &[("spells.json".to_string(), new_json)]) {
            Ok(r) => r,
            // A real client.exe that has ALREADY been embedded has a tight slot
            // (its compressed budget shrank to the last write). A new edit may
            // legitimately not fit — that's the documented in-place limit, not a
            // failure. Accept the friendly error and stop.
            Err(e) if e.contains("exceeds the embedded slot") || e.contains("exceeds maximum size") => {
                let _ = std::fs::remove_file(&tmp);
                let _ = std::fs::remove_file(tmp.with_file_name("client.original.exe"));
                eprintln!("skip: spells slot already tight ({e})");
                return;
            }
            Err(e) => panic!("embed: {e}"),
        };
        assert_eq!(report.len(), 1);

        // Re-read: size unchanged, and the slot at the same offset decodes to
        // the edited value.
        let patched = std::fs::read(&tmp).unwrap();
        assert_eq!(patched.len(), original.len(), "binary size must be unchanged");
        // Inflate exactly at the known spells offset (robust to content sniffing).
        let (raw_after, _csize) = inflate_at(&patched, spells_slot.offset).expect("inflate patched spells slot");
        let decoded: serde_json::Value = serde_json::from_slice(trim_start(&raw_after)).expect("parse patched spells.json");
        assert_eq!(decoded[0]["name"], marker, "embedded edit must be readable back");

        // Re-detection on the patched binary must still work (idempotent
        // re-apply). This is the path exe_apply_to_client takes on a 2nd run.
        let redetect = find_spell_json_slots(&patched);
        assert!(redetect.is_ok(), "re-detect failed: {:?}", redetect.err());

        let _ = std::fs::remove_file(&tmp);
        let _ = std::fs::remove_file(tmp.with_file_name("client.original.exe"));
    }

    /// Opt-in: real client.exe GENERIC embed roundtrip for a NON-spell resource.
    /// Picks a recovered QML resource, edits its text, embeds via the slot map,
    /// and confirms the edit reads back and the binary size is unchanged.
    #[test]
    fn real_exe_generic_embed_roundtrip() {
        use super::super::pe_qt_parser::{parse_pe_resources_with_slots, ExeSlot};
        let Ok(src) = std::env::var("CANARY_TEST_EXE") else {
            return;
        };
        let original = std::fs::read(&src).expect("read CANARY_TEST_EXE");
        let (rcc, slots) = parse_pe_resources_with_slots(&original).expect("parse with slots");
        assert!(!slots.is_empty(), "expected a non-empty slot map from the scan path");

        // Find a zlib-slot QML resource big enough to shrink safely.
        let pick = rcc.entries.iter().enumerate().find(|(i, e)| !e.is_directory && e.name.ends_with(".qml") && e.data.len() > 200 && matches!(slots.get(i), Some(ExeSlot::Zlib { .. })));
        let Some((idx, entry)) = pick else {
            eprintln!("skip: no suitable QML slot found");
            return;
        };
        let slot = *slots.get(&idx).unwrap();

        // Edit: append a comment (smaller-or-equal compresses comfortably).
        let mut new_text = String::from_utf8_lossy(&entry.data).into_owned();
        new_text.push_str("\n// CANARY_GENERIC_EMBED\n");
        let new_bytes = new_text.into_bytes();

        let mut tmp = std::env::temp_dir();
        tmp.push(format!("canary_generic_embed_{}.exe", std::process::id()));
        std::fs::write(&tmp, &original).unwrap();
        let report = embed_slots(&tmp, &[(slot, entry.name.clone(), new_bytes.clone())]);
        // If it doesn't fit the slot, that's an acceptable (documented) limit —
        // just ensure the error is the friendly one, not a panic/corruption.
        match report {
            Ok(reports) => {
                assert_eq!(reports.len(), 1);
                let patched = std::fs::read(&tmp).unwrap();
                assert_eq!(patched.len(), original.len(), "binary size must be unchanged");
                if let ExeSlot::Zlib {
                    stream_offset,
                    ..
                } = slot
                {
                    let (raw_after, _) = inflate_at(&patched, stream_offset).expect("inflate patched qml slot");
                    assert!(raw_after.windows(b"CANARY_GENERIC_EMBED".len()).any(|w| w == b"CANARY_GENERIC_EMBED"), "edit not found in re-read QML");
                }
            }
            Err(e) => assert!(e.contains("too large to embed"), "unexpected error: {}", e),
        }

        let _ = std::fs::remove_file(&tmp);
        let _ = std::fs::remove_file(tmp.with_file_name("client.original.exe"));
    }
}
