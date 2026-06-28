// Minimap feature: parse the marker file (`minimap.proto`) and list the on-disk
// minimap tiles (`minimap-<scale>-<x>-<y>-<floor>-<hash>.bmp.lzma`).
pub mod commands;
pub mod parsers;

pub use crate::core::protobuf::minimap::{MinimapMarker, MinimapMarkerFileContent};
