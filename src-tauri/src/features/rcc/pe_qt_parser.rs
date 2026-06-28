// Parser for Qt resources compiled directly into a binary (e.g. `client.exe`).
//
// Unlike a standalone `.rcc` file, a compiled-in Qt resource bundle has NO
// `qres` magic header. The three arrays Qt generates — `qt_resource_struct`
// (the tree), `qt_resource_name` (UTF-16BE names) and `qt_resource_data`
// (payloads) — are emitted as plain byte arrays inside the binary's `.rdata`.
// The offsets stored inside the tree nodes are RELATIVE to each array's start,
// so once we locate the three arrays we can decode everything with the same
// primitives used for `.rcc` files (`qt_format`).
//
// Locating the arrays without symbols is done heuristically:
//   1. names  — the longest contiguous run of valid name entries.
//   2. struct — the base+stride whose nodes' name offsets all hit the name map.
//   3. data   — the base where several nodes' length-prefixed payloads validate.
//
// If the tree can't be reconstructed we fall back to a raw zlib scan so the
// caller can still recover (most of) the embedded files, just with synthetic
// names.

use super::qt_format::{self, FLAG_COMPRESSED, FLAG_COMPRESSED_ZSTD, FLAG_DIRECTORY};
use super::rcc_parser::{RccEntry, RccFile, RccFileInfo, RccHeader};
use std::collections::HashMap;

const MAX_NAME_LEN: usize = 256;
/// Minimum number of consecutive name entries for a region to be considered the
/// names section (filters out coincidental matches in code/data).
const MIN_NAMES_RUN: usize = 16;
const MAX_STRUCT_NODES: usize = 200_000;
/// Most consecutive empty-name (offset 0) nodes tolerated inside a struct run.
/// A few empty-named directories near the root are legitimate (Qt's anonymous
/// root and intermediate prefix dirs all reference name offset 0), but a long
/// run of offset-0 nodes means we've wandered into zero padding, not a real
/// struct array — so bail once we exceed this.
const MAX_CONSECUTIVE_EMPTY: usize = 8;
/// How many alternative name-section bases to try when calibrating (bounds the
/// extra struct scans triggered by leading zero padding before the names table).
const MAX_BASE_CANDIDATES: usize = 6;

fn be16(data: &[u8], off: usize) -> Option<u16> {
    data.get(off..off + 2).map(|b| u16::from_be_bytes([b[0], b[1]]))
}
fn be32(data: &[u8], off: usize) -> Option<u32> {
    data.get(off..off + 4).map(|b| u32::from_be_bytes([b[0], b[1], b[2], b[3]]))
}

/// Try to read one name entry at `pos`; returns `(name, next_pos)`.
///
/// An empty name (`len == 0`, 6 bytes) is valid and common: Qt's resource name
/// array starts with the empty root-directory name, so the very first entry of
/// the section is empty. Rejecting it would shift every subsequent name offset
/// and break struct matching.
fn try_read_name_entry(data: &[u8], pos: usize) -> Option<(String, usize)> {
    let len = be16(data, pos)? as usize;
    if len > MAX_NAME_LEN {
        return None;
    }
    let cstart = pos + 6; // skip u16 len + u32 hash
    let cend = cstart.checked_add(len * 2)?;
    if cend > data.len() {
        return None;
    }
    let mut s = String::with_capacity(len);
    for k in 0..len {
        let hi = data[cstart + k * 2];
        let lo = data[cstart + k * 2 + 1];
        let cp = ((hi as u16) << 8) | lo as u16;
        // Resource names are filenames: reject control chars and path separators
        // so random binary data doesn't masquerade as a long name run.
        if cp < 0x20 || cp == 0x2f {
            return None;
        }
        s.push(char::from_u32(cp as u32)?);
    }
    Some((s, cend))
}

/// Find the names section as the contiguous run with the most *non-empty* name
/// entries. Counting only non-empty names keeps long runs of zero bytes (very
/// common in a binary) from being mistaken for the names section, while still
/// allowing the leading empty root entry to anchor the true section start.
fn find_names_section(data: &[u8]) -> Option<(usize, usize)> {
    let mut best: Option<(usize, usize, usize)> = None; // (start, end, meaningful)
    let mut p = 0usize;
    while p + 6 <= data.len() {
        if let Some((first_name, first_next)) = try_read_name_entry(data, p) {
            let start = p;
            let mut next = first_next;
            let mut meaningful = usize::from(!first_name.is_empty());
            while let Some((name, n2)) = try_read_name_entry(data, next) {
                next = n2;
                if !name.is_empty() {
                    meaningful += 1;
                }
            }
            if best.map_or(true, |(_, _, m)| meaningful > m) {
                best = Some((start, next, meaningful));
            }
            p = next.max(p + 1); // skip past the run we just consumed
        } else {
            p += 1;
        }
    }
    best.filter(|(_, _, m)| *m >= MIN_NAMES_RUN).map(|(s, e, _)| (s, e))
}

/// Candidate base offsets for the names table.
///
/// `find_names_section` anchors on the first parseable entry, but zero padding
/// in front of `qt_resource_name` parses as leading *empty* name entries, so the
/// real table can start a few entries after the detected start. The struct's
/// name offsets are relative to that real start, so we offer the detected start
/// plus each leading-empty boundary and let the caller keep whichever base
/// yields the longest struct run.
fn candidate_name_bases(data: &[u8], start: usize, end: usize) -> Vec<usize> {
    let mut bases = vec![start];
    let mut p = start;
    while bases.len() < MAX_BASE_CANDIDATES {
        match try_read_name_entry(data, p) {
            Some((name, next)) if name.is_empty() && next > p && next < end => {
                bases.push(next);
                p = next;
            }
            _ => break,
        }
    }
    bases
}

/// Build a map from relative name offset -> decoded name for the names section.
fn build_name_map(data: &[u8], start: usize, end: usize) -> HashMap<u32, String> {
    let mut map = HashMap::new();
    let mut p = start;
    while p < end {
        match try_read_name_entry(data, p) {
            Some((name, next)) => {
                if let Ok(rel) = u32::try_from(p - start) {
                    map.insert(rel, name);
                }
                p = next;
            }
            None => break,
        }
    }
    map
}

/// Count how many consecutive struct nodes at `base` (stride `ns`) have a name
/// offset present in `name_map`.
///
/// Several nodes may legitimately reference the empty name at offset 0 — Qt's
/// anonymous root plus any unnamed prefix directories all do — so we tolerate a
/// short run of them. A *long* run of offset-0 nodes, however, means we've
/// wandered into zero padding, so we stop and drop that trailing run (otherwise
/// a multi-KB region of zeros would look like an endless, bogus struct array).
fn struct_run_len(data: &[u8], base: usize, ns: usize, name_map: &HashMap<u32, String>) -> usize {
    let mut i = 0usize;
    let mut empties = 0usize;
    loop {
        let off = match base.checked_add(i * ns) {
            Some(o) => o,
            None => break,
        };
        if off + ns > data.len() {
            break;
        }
        match be32(data, off) {
            Some(name_off) if name_map.contains_key(&name_off) => {
                if name_off == 0 {
                    empties += 1;
                    if empties > MAX_CONSECUTIVE_EMPTY {
                        // The tail is zero padding, not nodes — exclude it.
                        return i.saturating_sub(empties - 1);
                    }
                } else {
                    empties = 0;
                }
                i += 1;
                if i >= MAX_STRUCT_NODES {
                    break;
                }
            }
            _ => break,
        }
    }
    i
}

/// Locate the struct array: the (base, stride, node_count) with the longest run.
fn find_struct_section(data: &[u8], name_map: &HashMap<u32, String>) -> Option<(usize, usize, usize)> {
    let mut best: Option<(usize, usize, usize)> = None; // (base, ns, count)
    let limit = data.len().saturating_sub(14);
    for base in 0..limit {
        // Cheap pre-filter: node 0's name offset must be a known name.
        match be32(data, base) {
            Some(n) if name_map.contains_key(&n) => {}
            _ => continue,
        }
        for &ns in &[14usize, 22usize] {
            let count = struct_run_len(data, base, ns, name_map);
            if best.map_or(true, |(_, _, c)| count > c) {
                best = Some((base, ns, count));
            }
        }
    }
    best.filter(|(_, _, c)| *c >= 2)
}

#[derive(Clone, Copy)]
struct RawNode {
    name_offset: u32,
    flags: u16,
    is_dir: bool,
    child_count: u32,
    first_child: u32,
    data_offset: u32,
}

fn read_struct_node(data: &[u8], base: usize, ns: usize, i: usize) -> Option<RawNode> {
    let off = base.checked_add(i * ns)?;
    if off + 14 > data.len() {
        return None;
    }
    let name_offset = be32(data, off)?;
    let flags = be16(data, off + 4)?;
    let is_dir = (flags & FLAG_DIRECTORY) != 0;
    if is_dir {
        Some(RawNode {
            name_offset,
            flags,
            is_dir: true,
            child_count: be32(data, off + 6)?,
            first_child: be32(data, off + 10)?,
            data_offset: 0,
        })
    } else {
        Some(RawNode {
            name_offset,
            flags,
            is_dir: false,
            child_count: 0,
            first_child: 0,
            data_offset: be32(data, off + 10)?,
        })
    }
}

/// Validate that a length-prefixed payload sits at `data_base + data_offset`.
///
/// Used only for locating the data section, so this is deliberately strict: a
/// zero-length payload is rejected. Empty payloads ARE legal when *reading* (see
/// `qt_format::read_data`), but accepting them here let `find_data_base` lock
/// onto a region of zero bytes — every offset "validated" as an empty payload —
/// which yielded empty file contents (and giant garbage blobs for the few
/// offsets whose size field happened to be non-zero).
fn payload_valid(data: &[u8], data_base: usize, data_offset: u32, flags: u16) -> bool {
    let pos = match data_base.checked_add(data_offset as usize) {
        Some(p) => p,
        None => return false,
    };
    let size = match be32(data, pos) {
        Some(s) => s as usize,
        None => return false,
    };
    if size == 0 {
        return false; // see doc comment: empty payloads must not anchor calibration
    }
    let end = match pos.checked_add(4 + size) {
        Some(e) => e,
        None => return false,
    };
    if end > data.len() {
        return false;
    }
    if (flags & FLAG_COMPRESSED) != 0 && (flags & FLAG_COMPRESSED_ZSTD) == 0 {
        // [u32 uncompressed_size][zlib stream]; zlib magic high nibble is 8.
        if size < 6 {
            return false;
        }
        match data.get(pos + 8) {
            Some(&b) if (b & 0x0f) == 0x08 => {}
            _ => return false,
        }
    }
    true
}

/// True if a node is zlib-compressed (the strong discriminator: random bytes
/// almost never form a valid zlib stream that inflates).
fn is_zlib(n: &RawNode) -> bool {
    (n.flags & FLAG_COMPRESSED) != 0 && (n.flags & FLAG_COMPRESSED_ZSTD) == 0
}

/// Find the data array base by validating several file nodes' payloads.
///
/// Two-stage per candidate base: a cheap structural filter (each validator has a
/// non-empty, in-bounds, length-prefixed payload, with a plausible zlib header
/// when compressed), then a strong check that every compressed validator
/// *actually inflates*. The inflate check is what uniquely pins the real base —
/// at a wrong base the zlib streams are garbage and fail to decompress.
fn find_data_base(data: &[u8], nodes: &[RawNode]) -> Option<usize> {
    let mut files: Vec<&RawNode> = nodes.iter().filter(|n| !n.is_dir).collect();
    if files.is_empty() {
        return None;
    }
    files.sort_by_key(|n| n.data_offset);
    let n = files.len();

    // Validators spread across the offset range (the largest offset is the
    // strongest in-bounds constraint)...
    let mut validators: Vec<&RawNode> = (0..8).map(|k| files[(n - 1) * k / 7]).collect();
    // ...plus the highest-offset zlib files, so the inflate check has teeth.
    let mut zlib_files: Vec<&RawNode> = files.iter().copied().filter(|f| is_zlib(f)).collect();
    zlib_files.sort_by_key(|n| std::cmp::Reverse(n.data_offset));
    validators.extend(zlib_files.into_iter().take(3));
    validators.sort_by_key(|n| n.data_offset);
    validators.dedup_by_key(|n| n.data_offset);

    let has_zlib = validators.iter().any(|v| is_zlib(v));
    let max_off = files[n - 1].data_offset as usize;
    let limit = data.len().saturating_sub(max_off);

    for base in 0..limit {
        // Cheap structural pre-filter.
        if !validators.iter().all(|v| payload_valid(data, base, v.data_offset, v.flags)) {
            continue;
        }
        // Strong check: every compressed validator must inflate to non-empty
        // bytes. (When the bundle has no compressed files, the structural filter
        // is all we have — still far stronger than before, since empty payloads
        // no longer validate.)
        if !has_zlib || validators.iter().filter(|v| is_zlib(v)).all(|v| qt_format::read_data(data, base, v.data_offset, v.flags).map(|(d, _)| !d.is_empty()).unwrap_or(false)) {
            return Some(base);
        }
    }
    None
}

/// Reconstruct the full resource tree from a compiled-in Qt bundle.
fn parse_tree(data: &[u8]) -> Result<RccFile, String> {
    let (names_start, names_end) = find_names_section(data).ok_or("Could not locate Qt names section")?;

    // Calibrate the names base: leading zero padding can put `names_start` a few
    // entries before the real `qt_resource_name`, so try each leading-empty
    // boundary and keep the base whose name map yields the longest struct run.
    // Probe the most-trimmed base first (PE-embedded bundles usually have such
    // padding) so the common case settles in a single struct scan.
    let mut best: Option<(usize, HashMap<u32, String>, usize, usize, usize)> = None; // (base, map, struct_base, ns, count)
    for base in candidate_name_bases(data, names_start, names_end).into_iter().rev() {
        let name_map = build_name_map(data, base, names_end);
        if name_map.len() < MIN_NAMES_RUN {
            continue;
        }
        if let Some((sb, ns, count)) = find_struct_section(data, &name_map) {
            if best.as_ref().map_or(true, |b| count > b.4) {
                best = Some((base, name_map, sb, ns, count));
            }
            // A strong match is unambiguous — stop probing further bases.
            if count >= 64 {
                break;
            }
        }
    }
    let (names_start, name_map, struct_base, ns, node_count) = best.ok_or("Could not locate Qt struct section")?;

    let mut raw_nodes: Vec<RawNode> = Vec::with_capacity(node_count);
    for i in 0..node_count {
        match read_struct_node(data, struct_base, ns, i) {
            Some(node) => raw_nodes.push(node),
            None => break,
        }
    }
    if raw_nodes.is_empty() {
        return Err("No Qt struct nodes decoded".into());
    }

    let data_base = find_data_base(data, &raw_nodes).ok_or("Could not locate Qt data section")?;

    // Build entries (index-aligned with struct nodes).
    let count = raw_nodes.len();
    let mut entries: Vec<RccEntry> = Vec::with_capacity(count);
    for node in &raw_nodes {
        // Name offset 0 is Qt's sentinel for the anonymous root / unnamed prefix
        // directories. After base calibration offset 0 may resolve to the first
        // real name, so force it empty (build_paths collapses empty segments).
        let name = if node.name_offset == 0 {
            String::new()
        } else {
            name_map.get(&node.name_offset).cloned().unwrap_or_default()
        };

        let (entry_data, compressed) = if node.is_dir {
            (Vec::new(), false)
        } else {
            // Lenient: a single unreadable entry (e.g. zstd) shouldn't kill the
            // whole bundle — keep the name visible with empty bytes.
            qt_format::read_data(data, data_base, node.data_offset, node.flags).unwrap_or((Vec::new(), false))
        };

        let children = if node.is_dir {
            let first = node.first_child as usize;
            let cc = node.child_count as usize;
            (first..first.saturating_add(cc)).filter(|&c| c < count).collect()
        } else {
            Vec::new()
        };

        entries.push(RccEntry {
            name,
            path: String::new(),
            is_directory: node.is_dir,
            data: entry_data,
            children,
            compressed,
            country: 0,
            language: 0,
        });
    }

    finalize(entries, ns, struct_base, data_base, names_start)
}

/// Fill in paths, collect the flat file list and wrap into an `RccFile`.
fn finalize(mut entries: Vec<RccEntry>, ns: usize, struct_base: usize, data_base: usize, names_start: usize) -> Result<RccFile, String> {
    let mut path_map: HashMap<usize, String> = HashMap::new();
    RccFile::build_paths(&entries, 0, "", &mut path_map, 0);

    let mut files = Vec::new();
    for (i, entry) in entries.iter_mut().enumerate() {
        if let Some(p) = path_map.get(&i) {
            entry.path = p.clone();
        }
        if !entry.is_directory {
            files.push(RccFileInfo {
                index: i,
                name: entry.name.clone(),
                path: entry.path.clone(),
                size: entry.data.len(),
                compressed: entry.compressed,
            });
        }
    }
    files.sort_by(|a, b| a.path.cmp(&b.path));

    let header = RccHeader {
        version: if ns == 22 {
            2
        } else {
            1
        },
        tree_offset: u32::try_from(struct_base).unwrap_or(0),
        data_offset: u32::try_from(data_base).unwrap_or(0),
        names_offset: u32::try_from(names_start).unwrap_or(0),
        overallflags: 0,
    };

    Ok(RccFile {
        header,
        entries,
        files,
    })
}

// ---------------------------------------------------------------------------
// Fallback: raw zlib scan (used when tree reconstruction fails)
// ---------------------------------------------------------------------------

fn sniff_extension(bytes: &[u8]) -> &'static str {
    let head = &bytes[..bytes.len().min(256)];
    // Skip leading whitespace/BOM for the JSON check.
    let trimmed: Vec<u8> = head.iter().copied().skip_while(|&b| b == 0xEF || b == 0xBB || b == 0xBF || b == b' ' || b == b'\n' || b == b'\r' || b == b'\t').collect();
    if matches!(trimmed.first(), Some(b'{') | Some(b'[')) {
        return "json";
    }
    if bytes.len() >= 8 && &bytes[0..8] == b"\x89PNG\r\n\x1a\n" {
        return "png";
    }
    let as_str = String::from_utf8_lossy(head);
    if as_str.contains("import QtQuick") || as_str.contains("import Qt") {
        return "qml";
    }
    let printable = head.iter().filter(|&&b| b == 9 || b == 10 || b == 13 || (0x20..0x7f).contains(&b)).count();
    if !head.is_empty() && printable * 100 / head.len() >= 95 {
        return "txt";
    }
    "bin"
}

/// Where a recovered resource physically lives in the binary, so it can be
/// written back IN PLACE (no PE-layout change). Only the scan path produces
/// these; the tree-reconstruction path leaves the slot map empty.
#[derive(Debug, Clone, Copy)]
pub enum ExeSlot {
    /// A zlib stream framed by Qt as `[u32 uncompressed_size][zlib...]`.
    /// `stream_offset` points at the zlib header; `compressed_budget` is how many
    /// bytes of compressed data we may overwrite (the original consumed length);
    /// `uncompressed_size_field` is the absolute offset of the u32 BE size field
    /// that must be kept in sync with the decompressed length.
    Zlib {
        stream_offset: usize,
        compressed_budget: usize,
        uncompressed_size_field: usize,
    },
    /// A raw, self-delimiting blob carved inline (e.g. an uncompressed PNG).
    /// `offset` + `region` bound the bytes we may overwrite.
    Raw {
        offset: usize,
        region: usize,
    },
}

/// Accumulates recovered resources into `recovered/<type>/<type>_NNNN.<ext>`,
/// deduping identical payloads. Used by the scan fallback.
struct Recovered {
    entries: Vec<RccEntry>,
    /// ext -> (directory index, next sequence number)
    type_dirs: HashMap<&'static str, (usize, usize)>,
    /// dedup key: (len, first byte, last byte)
    seen: std::collections::HashSet<(usize, u8, u8)>,
    /// entry index -> physical slot in the binary (for in-place writeback).
    slots: HashMap<usize, ExeSlot>,
}

impl Recovered {
    fn new() -> Self {
        let mut entries = Vec::new();
        // entries[0] = root, entries[1] = "recovered" directory.
        entries.push(RccEntry {
            name: String::new(),
            path: String::new(),
            is_directory: true,
            data: Vec::new(),
            children: vec![1],
            compressed: false,
            country: 0,
            language: 0,
        });
        entries.push(RccEntry {
            name: "recovered".into(),
            path: String::new(),
            is_directory: true,
            data: Vec::new(),
            children: Vec::new(),
            compressed: false,
            country: 0,
            language: 0,
        });
        Recovered {
            entries,
            type_dirs: HashMap::new(),
            seen: std::collections::HashSet::new(),
            slots: HashMap::new(),
        }
    }

    /// Add one recovered payload; `compressed` records whether it came from a
    /// zlib stream, and `slot` (when present) records where it lives in the
    /// binary so it can be written back in place. Returns false if duplicate.
    ///
    /// Resources we can identify by content (the spell JSONs) are given their
    /// REAL name under a `spells/` directory so the UI recognises them (and the
    /// "apply to client.exe" path works). Everything else falls back to a
    /// synthetic `recovered/<type>/<type>_NNNN.<ext>` name.
    fn add(&mut self, bytes: Vec<u8>, ext: &'static str, compressed: bool, slot: Option<ExeSlot>) -> bool {
        let key = (bytes.len(), bytes.first().copied().unwrap_or(0), bytes.last().copied().unwrap_or(0));
        if !self.seen.insert(key) {
            return false;
        }
        if let Some(canonical) = recognise_named_resource(&bytes) {
            return self.add_named("spells", canonical, bytes, compressed, slot);
        }

        // Ensure the per-type directory exists.
        let dir_idx = match self.type_dirs.get(ext) {
            Some(&(d, _)) => d,
            None => {
                let d = self.entries.len();
                self.entries.push(RccEntry {
                    name: ext.into(),
                    path: String::new(),
                    is_directory: true,
                    data: Vec::new(),
                    children: Vec::new(),
                    compressed: false,
                    country: 0,
                    language: 0,
                });
                self.entries[1].children.push(d);
                self.type_dirs.insert(ext, (d, 0));
                d
            }
        };
        let seq = {
            let slot = self.type_dirs.get_mut(ext).expect("dir just ensured");
            slot.1 += 1;
            slot.1
        };
        let name = format!("{}_{:04}.{}", ext, seq, ext);
        let file_idx = self.entries.len();
        self.entries.push(RccEntry {
            name,
            path: String::new(),
            is_directory: false,
            data: bytes,
            children: Vec::new(),
            compressed,
            country: 0,
            language: 0,
        });
        self.entries[dir_idx].children.push(file_idx);
        if let Some(s) = slot {
            self.slots.insert(file_idx, s);
        }
        true
    }

    /// Add a payload under `dir_name/file_name` with an exact, known name. The
    /// directory is created once and reused. `seen` is already updated by the
    /// caller, so this assumes the payload is unique.
    fn add_named(&mut self, dir_name: &'static str, file_name: &'static str, bytes: Vec<u8>, compressed: bool, slot: Option<ExeSlot>) -> bool {
        let dir_idx = match self.type_dirs.get(dir_name) {
            Some(&(d, _)) => d,
            None => {
                let d = self.entries.len();
                self.entries.push(RccEntry {
                    name: dir_name.into(),
                    path: String::new(),
                    is_directory: true,
                    data: Vec::new(),
                    children: Vec::new(),
                    compressed: false,
                    country: 0,
                    language: 0,
                });
                self.entries[1].children.push(d);
                self.type_dirs.insert(dir_name, (d, 0));
                d
            }
        };
        let file_idx = self.entries.len();
        self.entries.push(RccEntry {
            name: file_name.into(),
            path: String::new(),
            is_directory: false,
            data: bytes,
            children: Vec::new(),
            compressed,
            country: 0,
            language: 0,
        });
        self.entries[dir_idx].children.push(file_idx);
        if let Some(s) = slot {
            self.slots.insert(file_idx, s);
        }
        true
    }
}

/// Recognise a known resource by its content, returning its canonical filename.
///
/// Mirrors the embed-side detection in `pe_qt_writer::find_spell_json_slots` so
/// the same two files we can write back are also surfaced with their real names.
fn recognise_named_resource(bytes: &[u8]) -> Option<&'static str> {
    // Skip leading whitespace/BOM.
    let trimmed: &[u8] = {
        let mut s = bytes;
        while let [first, rest @ ..] = s {
            if matches!(first, b' ' | b'\n' | b'\r' | b'\t' | 0xEF | 0xBB | 0xBF) {
                s = rest;
            } else {
                break;
            }
        }
        s
    };
    let scan = &bytes[..bytes.len().min(64 * 1024)];
    match trimmed.first() {
        Some(b'[') if contains_bytes(scan, b"\"spellid\"") => Some("spells.json"),
        Some(b'{') if contains_bytes(scan, b"\"timestamps\"") => Some("spells-previews.json"),
        _ => None,
    }
}

fn contains_bytes(haystack: &[u8], needle: &[u8]) -> bool {
    if needle.is_empty() || haystack.len() < needle.len() {
        return false;
    }
    haystack.windows(needle.len()).any(|w| w == needle)
}

/// Largest sane size for any single recovered resource.
const MAX_OUT: usize = 64 * 1024 * 1024;

/// Recover embedded resources by scanning for both zlib streams (compressed
/// resources) and raw signature-delimited blobs (uncompressed resources).
///
/// Lossy on names: the compiled-in bundle's name table can't be reliably tied
/// back to each payload on a stripped, multi-bundle binary (the name tables are
/// tiny, interleaved with data, and have no locatable struct array — proximity
/// matching mislabels files). So we group recovered files into
/// `recovered/<type>/` with stable sequential names: the bytes are always
/// extractable and editable even when the original paths aren't recoverable.
fn scan_resources(data: &[u8]) -> (Vec<RccEntry>, HashMap<usize, ExeSlot>) {
    let mut rec = Recovered::new();
    scan_zlib_into(data, &mut rec);
    scan_raw_png_into(data, &mut rec);
    (rec.entries, rec.slots)
}

/// Inflate every embedded zlib stream and add the result, recording the slot so
/// it can be written back in place.
fn scan_zlib_into(data: &[u8], rec: &mut Recovered) {
    let mut i = 0usize;
    while i + 2 < data.len() {
        let a = data[i];
        let b = data[i + 1];
        // zlib header: CMF=0x78 and (CMF<<8|FLG) % 31 == 0.
        let is_hdr = a == 0x78 && matches!(b, 0x01 | 0x9c | 0xda | 0x5e) && (((a as u16) << 8 | b as u16) % 31 == 0);
        if is_hdr {
            if let Some((out, consumed)) = inflate_measured(&data[i..]) {
                if (8..=MAX_OUT).contains(&out.len()) {
                    let ext = sniff_extension(&out);
                    // Qt frames each compressed resource as
                    // `[u32 uncompressed_size][zlib stream]`; the size field is
                    // the 4 bytes immediately preceding the stream. Only trust it
                    // when it actually equals the decompressed length.
                    let slot = if i >= 4 && be32(data, i - 4) == u32::try_from(out.len()).ok() {
                        Some(ExeSlot::Zlib {
                            stream_offset: i,
                            compressed_budget: consumed,
                            uncompressed_size_field: i - 4,
                        })
                    } else {
                        None
                    };
                    rec.add(out, ext, true, slot);
                }
            }
        }
        i += 1;
    }
}

/// Inflate a zlib stream, returning the decompressed bytes and the exact number
/// of compressed input bytes consumed.
fn inflate_measured(data: &[u8]) -> Option<(Vec<u8>, usize)> {
    use flate2::read::ZlibDecoder;
    use std::io::Read;
    let mut dec = ZlibDecoder::new(data);
    let mut out = Vec::new();
    if dec.read_to_end(&mut out).is_err() {
        return None;
    }
    let consumed = dec.total_in() as usize;
    if consumed == 0 {
        return None;
    }
    Some((out, consumed))
}

/// Recover raw (uncompressed) PNG resources by their byte signature.
///
/// PNG is self-delimiting (`\x89PNG…` header, `IEND` + CRC trailer), so we can
/// carve complete files out of the binary with no false positives — covering the
/// uncompressed images the zlib scan can't see. Other raw types aren't carved
/// because they lack a reliable end marker.
fn scan_raw_png_into(data: &[u8], rec: &mut Recovered) {
    const SIG: &[u8; 8] = b"\x89PNG\r\n\x1a\n";
    const IEND: &[u8; 8] = b"\x00\x00\x00\x00IEND"; // length(0) + "IEND"
    let mut i = 0usize;
    while i + SIG.len() < data.len() {
        if &data[i..i + SIG.len()] == SIG {
            // Find the IEND chunk; the full file ends 4 bytes after it (CRC).
            if let Some(rel) = find_subslice(&data[i..], IEND) {
                let end = i + rel + IEND.len() + 4; // + CRC32
                if end <= data.len() && end - i <= MAX_OUT {
                    let slot = ExeSlot::Raw {
                        offset: i,
                        region: end - i,
                    };
                    rec.add(data[i..end].to_vec(), "png", false, Some(slot));
                    i = end;
                    continue;
                }
            }
        }
        i += 1;
    }
}

/// First index of `needle` in `haystack`, or None.
fn find_subslice(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() || haystack.len() < needle.len() {
        return None;
    }
    haystack.windows(needle.len()).position(|w| w == needle)
}

/// Parse a compiled-in Qt resource bundle from a binary's bytes.
///
/// Tries full tree reconstruction first; on failure falls back to scanning for
/// embedded resources (zlib streams + raw PNGs) so callers can still extract
/// the embedded files.
pub fn parse_pe_resources(data: &[u8]) -> Result<RccFile, String> {
    parse_pe_resources_with_slots(data).map(|(rcc, _)| rcc)
}

/// Like [`parse_pe_resources`], but also returns a map from each file entry's
/// index to its physical [`ExeSlot`] in the binary (for in-place writeback).
///
/// The scan recovers every embedded payload (zlib streams + raw PNGs), including
/// the ones we can write back in place (the spell JSONs, via slots). Tree
/// reconstruction additionally recovers the largest bundle's REAL file names
/// (e.g. the `.qml` UI files). We run both and merge: real names where the tree
/// succeeds, plus the scan's coverage and writeback slots for everything else.
///
/// Tree-only entries carry no slot (no in-place writeback); the scan entries
/// keep theirs, remapped to their merged index.
pub fn parse_pe_resources_with_slots(data: &[u8]) -> Result<(RccFile, HashMap<usize, ExeSlot>), String> {
    let (scan_entries, scan_slots) = scan_resources(data);
    // entries[0]=root dir, [1]=recovered dir, rest are dirs/files.
    let scanned = scan_entries.len() > 2;

    match parse_tree(data) {
        // Trust the tree only when it recovered a substantial bundle; a tiny
        // spurious match shouldn't shadow the scan's coverage.
        Ok(tree) if tree.files.len() >= MIN_NAMES_RUN => {
            if scanned {
                let (entries, slots) = merge_tree_and_scan(tree.entries, &scan_entries, scan_slots);
                Ok((finalize(entries, 22, 0, 0, 0)?, slots))
            } else {
                Ok((tree, HashMap::new()))
            }
        }
        _ => {
            if !scanned {
                return Err("No Qt resources, zlib streams or raw assets found in binary".into());
            }
            Ok((finalize(scan_entries, 14, 0, 0, 0)?, scan_slots))
        }
    }
}

/// Graft the scan's recovered subtree onto the tree-reconstructed entries.
///
/// The tree (real names) becomes the spine; the scan's `recovered` directory —
/// minus its `qml` bucket, which the tree already provides with real names — is
/// copied in and attached under the shared root. Scan slot indices are remapped
/// to the merged entry indices so in-place writeback still works.
fn merge_tree_and_scan(tree_entries: Vec<RccEntry>, scan_entries: &[RccEntry], scan_slots: HashMap<usize, ExeSlot>) -> (Vec<RccEntry>, HashMap<usize, ExeSlot>) {
    let mut combined = tree_entries;
    let mut remap: HashMap<usize, usize> = HashMap::new();

    // DFS-copy a scan subtree into `combined`, recording old->new indices and
    // skipping the recovered `qml` bucket (already covered by the tree).
    fn copy_subtree(src: &[RccEntry], idx: usize, combined: &mut Vec<RccEntry>, remap: &mut HashMap<usize, usize>) -> usize {
        let new_idx = combined.len();
        remap.insert(idx, new_idx);
        let e = &src[idx];
        combined.push(RccEntry {
            name: e.name.clone(),
            path: String::new(),
            is_directory: e.is_directory,
            data: e.data.clone(),
            children: Vec::new(),
            compressed: e.compressed,
            country: e.country,
            language: e.language,
        });
        let mut kids = Vec::new();
        for &c in &e.children {
            if c >= src.len() {
                continue;
            }
            // The tree already supplies the qml files with their real names.
            if src[c].is_directory && src[c].name == "qml" {
                continue;
            }
            kids.push(copy_subtree(src, c, combined, remap));
        }
        combined[new_idx].children = kids;
        new_idx
    }

    // scan_entries[1] is the "recovered" directory holding all scanned payloads.
    if scan_entries.len() > 1 && !combined.is_empty() {
        let recovered_new = copy_subtree(scan_entries, 1, &mut combined, &mut remap);
        combined[0].children.push(recovered_new);
    }

    let mut slots: HashMap<usize, ExeSlot> = HashMap::new();
    for (old_idx, slot) in scan_slots {
        if let Some(&new_idx) = remap.get(&old_idx) {
            slots.insert(new_idx, slot);
        }
    }
    (combined, slots)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Skip leading ASCII whitespace (test helper).
    fn trim_start_ws(b: &[u8]) -> &[u8] {
        let mut i = 0;
        while i < b.len() && matches!(b[i], b' ' | b'\n' | b'\r' | b'\t') {
            i += 1;
        }
        &b[i..]
    }

    #[test]
    fn empty_input_errors() {
        assert!(parse_pe_resources(&[]).is_err());
    }

    #[test]
    fn garbage_input_errors() {
        let data = vec![0xABu8; 1024];
        assert!(parse_pe_resources(&data).is_err());
    }

    #[test]
    fn sniff_json_and_png() {
        assert_eq!(sniff_extension(b"  { \"a\": 1 }"), "json");
        assert_eq!(sniff_extension(b"[1,2,3]"), "json");
        assert_eq!(sniff_extension(b"\x89PNG\r\n\x1a\nxxxx"), "png");
        assert_eq!(sniff_extension(b"import QtQuick 2.0\n"), "qml");
        assert_eq!(sniff_extension(b"hello world\n"), "txt");
        assert_eq!(sniff_extension(&[0u8, 1, 2, 3, 200, 201]), "bin");
    }

    #[test]
    fn carves_raw_png_from_noise() {
        // A minimal but structurally complete PNG (header + IHDR + IEND + CRC),
        // surrounded by junk, must be carved out exactly.
        let png: Vec<u8> = [
            b"\x89PNG\r\n\x1a\n".as_slice(),
            b"\x00\x00\x00\x0dIHDR".as_slice(),
            &[0u8; 13],                // IHDR body
            &[0x12, 0x34, 0x56, 0x78], // IHDR CRC (arbitrary)
            b"\x00\x00\x00\x00IEND".as_slice(),
            &[0xae, 0x42, 0x60, 0x82], // IEND CRC
        ]
        .concat();
        let mut blob = vec![0xCCu8; 64];
        blob.extend_from_slice(&png);
        blob.extend_from_slice(&[0xDDu8; 64]);

        let mut rec = Recovered::new();
        scan_raw_png_into(&blob, &mut rec);
        let files: Vec<_> = rec.entries.iter().filter(|e| !e.is_directory).collect();
        assert_eq!(files.len(), 1, "expected exactly one carved PNG");
        assert_eq!(files[0].data, png, "carved PNG bytes must match exactly");
        assert!(files[0].name.ends_with(".png"));
    }

    /// Opt-in integration test against a real client binary. Set CANARY_TEST_EXE
    /// to its path to run it. Verifies extraction by CONTENT, not by name: the
    /// compiled-in `spells.json` (a known ~344 KB JSON array) must come back
    /// byte-for-byte, even though its recovered path is synthetic.
    #[test]
    fn real_exe_when_env_set() {
        let Ok(path) = std::env::var("CANARY_TEST_EXE") else {
            return;
        };
        let bytes = std::fs::read(&path).expect("read CANARY_TEST_EXE");
        let rcc = parse_pe_resources(&bytes).expect("parse pe resources");
        assert!(rcc.files.len() >= 100, "too few files recovered: {}", rcc.files.len());

        // At least a couple of JSON resources must be recovered.
        let json_count = rcc.files.iter().filter(|f| f.path.ends_with(".json")).count();
        assert!(json_count >= 2, "expected >=2 json resources, got {}", json_count);

        // The spells.json payload is a large JSON array containing "spellid".
        // (After a re-embed it's minified with sorted keys, so "spellid" may not
        // be in the first bytes — scan a generous window, like production does.)
        let has_spells_payload = rcc.entries.iter().any(|e| {
            !e.is_directory && e.data.len() > 100_000 && {
                let stripped = trim_start_ws(&e.data);
                stripped.first() == Some(&b'[') && contains_bytes(&e.data[..e.data.len().min(64 * 1024)], b"\"spellid\"")
            }
        });
        assert!(has_spells_payload, "spells.json payload not recovered among {} files", rcc.files.len());

        // The spell JSONs must be surfaced with their REAL names (so the UI can
        // recognise them and the "apply to client.exe" path is offered).
        let has_named_spells = rcc.files.iter().any(|f| f.name == "spells.json");
        let has_named_previews = rcc.files.iter().any(|f| f.name == "spells-previews.json");
        assert!(has_named_spells, "spells.json not surfaced by canonical name");
        assert!(has_named_previews, "spells-previews.json not surfaced by canonical name");

        // Tree reconstruction must recover the QML bundle with REAL file names
        // (the user-facing regression: previously every .qml came back as a
        // synthetic `recovered/qml/qml_NNNN.qml`).
        let qml: Vec<&str> = rcc.files.iter().filter(|f| f.name.ends_with(".qml")).map(|f| f.name.as_str()).collect();
        let real_qml = qml.iter().filter(|n| !n.starts_with("qml_")).count();
        let synthetic_qml = qml.iter().filter(|n| n.starts_with("qml_")).count();
        println!("QML files: {} total, {} real-named, {} synthetic", qml.len(), real_qml, synthetic_qml);
        println!("sample real qml: {:?}", qml.iter().filter(|n| !n.starts_with("qml_")).take(8).collect::<Vec<_>>());
        assert!(real_qml >= 100, "expected >=100 real-named .qml files, got {} (synthetic {})", real_qml, synthetic_qml);
        // No synthetic qml should remain — the tree supersedes the scan's qml bucket.
        assert_eq!(synthetic_qml, 0, "found {} synthetic qml_* names that should have been superseded", synthetic_qml);
        // A couple of known real names from this client must be present.
        assert!(rcc.files.iter().any(|f| f.name == "container.qml"), "container.qml missing");

        // QML PAYLOADS must be present and correctly decoded. Regression guard:
        // a mis-calibrated data base gave empty content for most files and a
        // giant garbage blob for the rest (which froze the UI on open).
        let qml_entries: Vec<&RccEntry> = rcc.entries.iter().filter(|e| !e.is_directory && e.name.ends_with(".qml")).collect();
        let nonempty = qml_entries.iter().filter(|e| !e.data.is_empty()).count();
        let max_qml = qml_entries.iter().map(|e| e.data.len()).max().unwrap_or(0);
        println!("QML payloads: {}/{} non-empty, largest {} bytes", nonempty, qml_entries.len(), max_qml);
        assert_eq!(nonempty, qml_entries.len(), "every .qml payload must be non-empty");
        assert!(max_qml < 5 * 1024 * 1024, "a .qml payload is implausibly large ({max_qml} bytes) — likely a garbage blob from a wrong data base");
        let any_import = qml_entries.iter().any(|e| String::from_utf8_lossy(&e.data[..e.data.len().min(64)]).contains("import "));
        assert!(any_import, "no .qml payload looks like QML source (data base likely wrong)");
    }

    #[test]
    fn recognises_spell_jsons_by_content() {
        assert_eq!(recognise_named_resource(br#"[{"spellid":1,"name":"x"}]"#), Some("spells.json"));
        assert_eq!(recognise_named_resource(b"  \n[{\"a\":1,\"spellid\":2}]"), Some("spells.json"));
        assert_eq!(recognise_named_resource(br#"{"1":{"timestamps":[]}}"#), Some("spells-previews.json"));
        assert_eq!(recognise_named_resource(br#"{"other":true}"#), None);
        assert_eq!(recognise_named_resource(br#"[1,2,3]"#), None);
    }
}
