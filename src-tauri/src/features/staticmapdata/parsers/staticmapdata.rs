use crate::core::protobuf::staticmapdata::StaticMapData;
use anyhow::{Context, Result};
use prost::Message;
use std::fs;
use std::path::Path;

pub fn load_staticmapdata<P: AsRef<Path>>(path: P) -> Result<StaticMapData> {
    let path = path.as_ref();
    log::info!("Loading staticmapdata file: {:?}", path);

    let data = fs::read(path).context(format!("Failed to read staticmapdata file: {:?}", path))?;

    match StaticMapData::decode(&data[..]) {
        Ok(staticmapdata) => {
            log::info!("Staticmapdata decoded directly without decompression");
            return Ok(staticmapdata);
        }
        Err(e) => {
            log::warn!("Direct protobuf decode failed: {}. Trying LZMA/XZ decompress fallback...", e);
        }
    }

    let decompressed = crate::core::lzma::decompress(&data).context("Failed to decompress staticmapdata data (LZMA/XZ)")?;
    let staticmapdata = StaticMapData::decode(&decompressed[..]).context("Failed to decode staticmapdata protobuf data after decompression")?;

    log::info!(
        "Successfully parsed staticmapdata: {} houses details",
        staticmapdata.houses.len()
    );

    Ok(staticmapdata)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StaticMapDataStats {
    pub total_houses_details: usize,
}

pub fn get_statistics(staticmapdata: &StaticMapData) -> StaticMapDataStats {
    StaticMapDataStats {
        total_houses_details: staticmapdata.houses.len(),
    }
}
