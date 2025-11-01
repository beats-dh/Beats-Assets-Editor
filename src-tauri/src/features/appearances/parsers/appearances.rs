use crate::core::protobuf::Appearances;
use anyhow::{Context, Result};
use prost::Message;
use std::fs;
use std::path::Path;

/// Load and parse an appearances.dat file
pub fn load_appearances<P: AsRef<Path>>(path: P) -> Result<Appearances> {
    let path = path.as_ref();

    log::info!("Loading appearances file: {:?}", path);

    // Read the file
    let data = fs::read(path).context(format!("Failed to read appearances file: {:?}", path))?;

    log::info!("Read {} bytes from appearances file", data.len());

    // First, try to parse the protobuf data directly
    match Appearances::decode(&data[..]) {
        Ok(appearances) => {
            log::info!("Appearances decoded directly without decompression");
            return Ok(appearances);
        }
        Err(e) => {
            log::warn!("Direct protobuf decode failed: {}. Trying LZMA/XZ decompress fallback...", e);
        }
    }

    // Fallback: attempt to decompress (Tibia assets often use custom LZMA/XZ wrapping)
    let decompressed = crate::core::lzma::decompress(&data).context("Failed to decompress appearances data (LZMA/XZ)")?;

    // Try decoding again from decompressed bytes
    let appearances = Appearances::decode(&decompressed[..]).context("Failed to decode appearances protobuf data after decompression")?;

    // Log like Assets Editor (showing last IDs)
    let object_count = appearances.object.last().and_then(|obj| obj.id).unwrap_or(0);
    let outfit_count = appearances.outfit.last().and_then(|obj| obj.id).unwrap_or(0);
    let effect_count = appearances.effect.last().and_then(|obj| obj.id).unwrap_or(0);
    let missile_count = appearances.missile.last().and_then(|obj| obj.id).unwrap_or(0);

    log::info!("Successfully parsed appearances: {} objects, {} outfits, {} effects, {} missiles", object_count, outfit_count, effect_count, missile_count);

    Ok(appearances)
}

/// Get appearance statistics (following Assets Editor logic - showing last IDs)
pub fn get_statistics(appearances: &Appearances) -> AppearanceStats {
    AppearanceStats {
        // Primary values (like Assets Editor) - last IDs
        object_count: appearances.object.last().and_then(|obj| obj.id).unwrap_or(0),
        outfit_count: appearances.outfit.last().and_then(|obj| obj.id).unwrap_or(0),
        effect_count: appearances.effect.last().and_then(|obj| obj.id).unwrap_or(0),
        missile_count: appearances.missile.last().and_then(|obj| obj.id).unwrap_or(0),
        // Additional info - actual item counts
        actual_objects: appearances.object.len(),
        actual_outfits: appearances.outfit.len(),
        actual_effects: appearances.effect.len(),
        actual_missiles: appearances.missile.len(),
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppearanceStats {
    // Primary counts (last IDs - like Assets Editor)
    pub object_count: u32,
    pub outfit_count: u32,
    pub effect_count: u32,
    pub missile_count: u32,
    // Additional info - actual item counts in file
    pub actual_objects: usize,
    pub actual_outfits: usize,
    pub actual_effects: usize,
    pub actual_missiles: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore]
    fn test_load_appearances() {
        let dat_path = r"C:\Users\danie\Documentos\Tibia15Igla\assets\appearances-feee1f9feba00a63606228c8bc46fa003c90dff144fb1b60a3759f97aad6e3c8.dat";

        match load_appearances(dat_path) {
            Ok(appearances) => {
                let stats = get_statistics(&appearances);
                println!("{:#?}", stats);

                // Show comparison with Assets Editor format
                println!("\n=== Assets Editor Format (Last IDs) ===");
                println!("Objects: {}", stats.object_count);
                println!("Outfits: {}", stats.outfit_count);
                println!("Effects: {}", stats.effect_count);
                println!("Missiles: {}", stats.missile_count);

                println!("\n=== Actual Item Counts ===");
                println!("Objects: {}", stats.actual_objects);
                println!("Outfits: {}", stats.actual_outfits);
                println!("Effects: {}", stats.actual_effects);
                println!("Missiles: {}", stats.actual_missiles);
            }
            Err(e) => panic!("Failed to load appearances: {}", e),
        }
    }
}
