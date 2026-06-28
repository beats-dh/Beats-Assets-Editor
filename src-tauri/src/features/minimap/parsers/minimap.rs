use crate::core::protobuf::minimap::MinimapMarkerFileContent;
use anyhow::{Context, Result};
use prost::Message;
use std::fs;
use std::path::Path;

/// Load minimap markers from a `minimapmarkers.bin`.
///
/// Tries raw protobuf first (the common on-disk form) and falls back to an
/// LZMA/XZ decompress, mirroring how the other client data files can be stored.
pub fn load_markers<P: AsRef<Path>>(path: P) -> Result<MinimapMarkerFileContent> {
    let data = fs::read(path.as_ref()).context("Failed to read minimap markers file")?;

    // An empty file is a valid (marker-less) document.
    if data.is_empty() {
        return Ok(MinimapMarkerFileContent::default());
    }

    if let Ok(content) = MinimapMarkerFileContent::decode(&data[..]) {
        // Accept the raw decode only when it actually produced markers (a
        // compressed blob can decode spuriously as an empty message).
        if !content.markers.is_empty() {
            return Ok(content);
        }
    }

    let decompressed = crate::core::lzma::decompress(&data).context("Failed to decompress minimap markers")?;
    MinimapMarkerFileContent::decode(&decompressed[..]).context("Failed to decode minimap markers protobuf")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::protobuf::minimap::MinimapMarker;
    use crate::core::protobuf::shared::Coordinate;

    #[test]
    fn marker_file_roundtrips() {
        let content = MinimapMarkerFileContent {
            markers: vec![
                MinimapMarker {
                    position: Some(Coordinate {
                        x: Some(32100),
                        y: Some(31900),
                        z: Some(7),
                    }),
                    r#type: Some(3),
                    description: Some("Temple".into()),
                    unknown_4: None,
                },
                MinimapMarker {
                    position: Some(Coordinate {
                        x: Some(32050),
                        y: Some(31850),
                        z: Some(7),
                    }),
                    r#type: Some(11),
                    description: Some("Depot".into()),
                    unknown_4: None,
                },
            ],
        };

        let mut buf = Vec::new();
        content.encode(&mut buf).unwrap();
        let decoded = MinimapMarkerFileContent::decode(&buf[..]).unwrap();
        assert_eq!(decoded.markers.len(), 2);
        assert_eq!(decoded.markers[0].description.as_deref(), Some("Temple"));
        assert_eq!(decoded.markers[1].position.as_ref().unwrap().x, Some(32050));

        // Same bytes must load through the file path too.
        let tmp = std::env::temp_dir().join("canary_minimapmarkers_test.bin");
        std::fs::write(&tmp, &buf).unwrap();
        let loaded = load_markers(&tmp).unwrap();
        assert_eq!(loaded.markers.len(), 2);
        let _ = std::fs::remove_file(&tmp);
    }
}
