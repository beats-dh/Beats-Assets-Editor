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

pub fn save_staticdata<P: AsRef<Path>>(path: P, staticdata: &StaticData) -> Result<()> {
    let path = path.as_ref();
    log::info!("Saving staticdata file to: {:?}", path);

    let mut buf = Vec::new();
    staticdata.encode(&mut buf).context("Failed to encode StaticData to protobuf buffer")?;

    fs::write(path, buf).context(format!("Failed to write staticdata file: {:?}", path))?;

    log::info!("StaticData successfully saved. Size: {} bytes", staticdata.encoded_len());
    Ok(())
}
