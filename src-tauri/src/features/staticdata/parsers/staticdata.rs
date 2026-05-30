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
    pub total_creatures: usize,
    pub total_titles: usize,
    pub total_houses: usize,
    pub total_bosses: usize,
    pub total_quests: usize,
}

pub fn get_statistics(staticdata: &StaticData) -> StaticDataStats {
    StaticDataStats {
        total_creatures: staticdata.creatures.len(),
        total_titles: staticdata.titles.len(),
        total_houses: staticdata.houses.len(),
        total_bosses: staticdata.bosses.len(),
        total_quests: staticdata.quests.len(),
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

pub fn save_staticdata<P: AsRef<Path>>(path: P, staticdata: &StaticData) -> Result<()> {
    let path = path.as_ref();
    log::info!("Saving staticdata file to: {:?}", path);

    let mut buf = Vec::new();
    staticdata.encode(&mut buf).context("Failed to encode StaticData to protobuf buffer")?;

    // Preserve the existing file's encoding when overwriting, so a file that was
    // loaded compressed is written back compressed. A new path defaults to raw.
    let format = fs::read(path).ok().map(|existing| detect_format(&existing)).unwrap_or(StaticDataFormat::Raw);

    let out = match format {
        StaticDataFormat::Raw => buf,
        StaticDataFormat::Xz => crate::core::lzma::compress_xz(&buf).context("Failed to XZ-compress staticdata")?,
        StaticDataFormat::Lzma => crate::core::lzma::compress(&buf).context("Failed to LZMA-compress staticdata")?,
    };

    fs::write(path, &out).context(format!("Failed to write staticdata file: {:?}", path))?;

    log::info!("StaticData successfully saved ({:?}). Protobuf size: {} bytes, on-disk: {} bytes", format, staticdata.encoded_len(), out.len());
    Ok(())
}
