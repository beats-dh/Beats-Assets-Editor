use crate::core::protobuf::staticdata::StaticData;
use anyhow::{Context, Result};
use prost::Message;
use std::fs;
use std::path::Path;

pub fn load_staticdata<P: AsRef<Path>>(path: P) -> Result<StaticData> {
    let path = path.as_ref();
    log::info!("Loading staticdata file: {:?}", path);

    let data = fs::read(path).context(format!("Failed to read staticdata file: {:?}", path))?;

    match StaticData::decode(&data[..]) {
        Ok(staticdata) => {
            log::info!("Staticdata decoded directly without decompression");
            return Ok(staticdata);
        }
        Err(e) => {
            log::warn!("Direct protobuf decode failed: {}. Trying LZMA/XZ decompress fallback...", e);
        }
    }

    let decompressed = crate::core::lzma::decompress(&data).context("Failed to decompress staticdata data (LZMA/XZ)")?;
    let staticdata = StaticData::decode(&decompressed[..]).context("Failed to decode staticdata protobuf data after decompression")?;

    log::info!(
        "Successfully parsed staticdata: {} creatures, {} titles, {} houses, {} bosses, {} quests",
        staticdata.creatures.len(),
        staticdata.titles.len(),
        staticdata.houses.len(),
        staticdata.bosses.len(),
        staticdata.quests.len()
    );

    Ok(staticdata)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StaticDataStats {
    /// Which schema the loaded file matched: "old" or "new".
    pub version: String,
    pub total_creatures: usize,       // new schema: monsters
    pub total_monster_classes: usize, // new schema only (legacy files have none)
    pub total_titles: usize,          // new schema: achievements
    pub total_houses: usize,
    pub total_bosses: usize,
    pub total_quests: usize,
}

/// Statistics for a (versioned) staticdata document. Category names follow the
/// legacy labels the frontend already uses; the `version` field disambiguates,
/// and `total_monster_classes` surfaces the new-schema-only category.
pub fn doc_statistics(doc: &StaticDataDoc) -> StaticDataStats {
    match doc {
        StaticDataDoc::Old(o) => StaticDataStats {
            version: "old".into(),
            total_creatures: o.creatures.len(),
            total_monster_classes: 0,
            total_titles: o.titles.len(),
            total_houses: o.houses.len(),
            total_bosses: o.bosses.len(),
            total_quests: o.quests.len(),
        },
        StaticDataDoc::New(n) => StaticDataStats {
            version: "new".into(),
            total_creatures: n.monsters.len(),
            total_monster_classes: n.monster_classes.len(),
            total_titles: n.achievements.len(),
            total_houses: n.houses.len(),
            total_bosses: n.bosses.len(),
            total_quests: n.quests.len(),
        },
    }
}

/// On-disk encoding of a staticdata file.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum StaticDataFormat {
    Raw,
    Xz,
    Lzma,
}

/// Detect the on-disk format of an existing staticdata file so a save can
/// reproduce it instead of silently rewriting a compressed `.dat` as raw
/// protobuf (which the original consumer may no longer read).
fn detect_format(bytes: &[u8]) -> StaticDataFormat {
    if crate::core::lzma::is_xz(bytes) {
        StaticDataFormat::Xz
    } else if StaticData::decode(bytes).is_ok() {
        StaticDataFormat::Raw
    } else {
        // Not raw protobuf and not XZ: the loader treats this as the custom
        // (Tibia) LZMA format.
        StaticDataFormat::Lzma
    }
}

/// Write encoded protobuf bytes to `path`, preserving the existing file's
/// on-disk encoding (raw / XZ / LZMA) so a file loaded compressed is written
/// back compressed. A new path defaults to raw.
fn write_with_format<P: AsRef<Path>>(path: P, buf: Vec<u8>) -> Result<()> {
    let path = path.as_ref();
    let format = fs::read(path).ok().map(|existing| detect_format(&existing)).unwrap_or(StaticDataFormat::Raw);

    let out = match format {
        StaticDataFormat::Raw => buf,
        StaticDataFormat::Xz => crate::core::lzma::compress_xz(&buf).context("Failed to XZ-compress staticdata")?,
        StaticDataFormat::Lzma => crate::core::lzma::compress(&buf).context("Failed to LZMA-compress staticdata")?,
    };

    fs::write(path, &out).context(format!("Failed to write staticdata file: {:?}", path))?;
    log::info!("StaticData saved ({:?}), on-disk: {} bytes", format, out.len());
    Ok(())
}

pub fn save_staticdata<P: AsRef<Path>>(path: P, staticdata: &StaticData) -> Result<()> {
    let mut buf = Vec::new();
    staticdata.encode(&mut buf).context("Failed to encode StaticData to protobuf buffer")?;
    write_with_format(path, buf)
}

/// Save a versioned staticdata document, encoding the variant that was loaded so
/// a legacy file is written back legacy and a new file is written back new.
pub fn save_staticdata_doc<P: AsRef<Path>>(path: P, doc: &StaticDataDoc) -> Result<()> {
    let mut buf = Vec::new();
    match doc {
        StaticDataDoc::Old(o) => o.encode(&mut buf).context("Failed to encode StaticData (legacy)")?,
        StaticDataDoc::New(n) => n.encode(&mut buf).context("Failed to encode StaticData (new)")?,
    }
    write_with_format(path, buf)
}

// ---------------------------------------------------------------------------
// Versioned (legacy vs newer-client) staticdata support
// ---------------------------------------------------------------------------

use crate::core::protobuf::staticdata_new::StaticData as StaticDataNew;

/// A decoded staticdata file tagged with the schema it matched.
///
/// The newer client renumbered `StaticData`'s fields (titles/houses/bosses/quests
/// shifted, `monster_classes`/`achievements` inserted), so the two layouts are
/// wire-incompatible and a single message type cannot read both. We keep both
/// and pick per file.
#[derive(Debug, Clone)]
pub enum StaticDataDoc {
    /// Legacy schema: creatures / titles / houses / bosses / quests.
    Old(StaticData),
    /// Newer client: monsters / monster_classes / achievements / houses / bosses / quests.
    New(StaticDataNew),
}

impl StaticDataDoc {
    pub fn version(&self) -> &'static str {
        match self {
            StaticDataDoc::Old(_) => "old",
            StaticDataDoc::New(_) => "new",
        }
    }
}

/// True when a decode yielded an empty document (every collection empty) — used
/// to reject a spurious "success" from decoding still-compressed bytes.
fn is_trivially_empty(doc: &StaticDataDoc) -> bool {
    match doc {
        StaticDataDoc::Old(o) => o.creatures.is_empty() && o.titles.is_empty() && o.houses.is_empty() && o.bosses.is_empty() && o.quests.is_empty(),
        StaticDataDoc::New(n) => n.monsters.is_empty() && n.monster_classes.is_empty() && n.achievements.is_empty() && n.houses.is_empty() && n.bosses.is_empty() && n.quests.is_empty(),
    }
}

/// Decode raw protobuf bytes, choosing the schema that fits best.
///
/// Protobuf ignores unknown fields, so BOTH schemas usually decode without
/// error — we disambiguate by round-trip fidelity: the matching schema keeps
/// every field and re-encodes to ~the original length, while the wrong one
/// silently drops the fields it doesn't know and re-encodes much shorter. We
/// pick the schema whose re-encoded length is closest to the input length.
fn decode_doc(bytes: &[u8]) -> Result<StaticDataDoc> {
    let orig = bytes.len() as i64;
    let new = StaticDataNew::decode(bytes).ok();
    let old = StaticData::decode(bytes).ok();
    let diff = |len: usize| (orig - len as i64).abs();
    match (new, old) {
        // Tie or new-closer → prefer new (the current client format).
        (Some(n), Some(o)) => {
            if diff(n.encoded_len()) <= diff(o.encoded_len()) {
                Ok(StaticDataDoc::New(n))
            } else {
                Ok(StaticDataDoc::Old(o))
            }
        }
        (Some(n), None) => Ok(StaticDataDoc::New(n)),
        (None, Some(o)) => Ok(StaticDataDoc::Old(o)),
        (None, None) => anyhow::bail!("staticdata: bytes matched neither schema"),
    }
}

/// Load a staticdata file (raw / XZ / LZMA) auto-detecting the schema version.
pub fn load_staticdata_doc<P: AsRef<Path>>(path: P) -> Result<StaticDataDoc> {
    let path = path.as_ref();
    log::info!("Loading staticdata (versioned) file: {:?}", path);
    let data = fs::read(path).context(format!("Failed to read staticdata file: {:?}", path))?;

    // Raw protobuf first; accept only a non-empty decode (compressed bytes can
    // decode spuriously as an empty message).
    if let Ok(doc) = decode_doc(&data) {
        if !is_trivially_empty(&doc) {
            log::info!("staticdata decoded directly as {} schema", doc.version());
            return Ok(doc);
        }
    }

    let decompressed = crate::core::lzma::decompress(&data).context("Failed to decompress staticdata (LZMA/XZ)")?;
    let doc = decode_doc(&decompressed).context("Failed to decode staticdata after decompression")?;
    log::info!("staticdata decoded after decompression as {} schema", doc.version());
    Ok(doc)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Opt-in test against a real client staticdata.dat. Set CANARY_STATICDATA
    /// to its path. Verifies the NEW schema is detected and the categories that
    /// the legacy schema mislabels/drops come back correctly.
    #[test]
    fn real_staticdata_detects_new_schema_when_env_set() {
        let Ok(path) = std::env::var("CANARY_STATICDATA") else {
            return;
        };
        let doc = load_staticdata_doc(&path).expect("load staticdata");
        match doc {
            StaticDataDoc::New(n) => {
                println!(
                    "NEW schema: monsters={} monster_classes={} achievements={} houses={} bosses={} quests={}",
                    n.monsters.len(),
                    n.monster_classes.len(),
                    n.achievements.len(),
                    n.houses.len(),
                    n.bosses.len(),
                    n.quests.len()
                );
                assert!(n.monsters.len() > 100, "monsters");
                assert!(!n.monster_classes.is_empty(), "monster_classes (new field 2)");
                assert!(n.achievements.len() > 100, "achievements (new field 3)");
                assert!(n.houses.len() > 100, "houses (new field 4)");
                assert!(n.bosses.len() > 100, "bosses (new field 5)");
                assert!(!n.quests.is_empty(), "quests (new field 6 — dropped by the legacy schema)");
            }
            StaticDataDoc::Old(_) => panic!("expected NEW schema for the real client staticdata.dat"),
        }
    }
}
