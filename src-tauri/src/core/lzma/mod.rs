use anyhow::{Context, Result};
use std::io::{Cursor, Read};
use xz2::read::XzDecoder;

/// Decompress LZMA data (Tibia uses a custom LZMA format)
pub fn decompress(data: &[u8]) -> Result<Vec<u8>> {
    // According to Reddit research, Tibia uses LZMA format but with incorrect uncompressed size field
    // We need to fix the header before decompression
    
    if data.len() < 13 {
        return Err(anyhow::anyhow!("LZMA data too short"));
    }
    
    // Create a corrected LZMA header
    let mut corrected_data = data.to_vec();
    
    // The uncompressed size field (bytes 5-12) is incorrect in Tibia's format
    // Set it to 0xFFFFFFFFFFFFFFFF to indicate unknown size (LZMA standard)
    for i in 5..13 {
        corrected_data[i] = 0xFF;
    }
    
    let mut decompressed = Vec::new();

    // Try with corrected header using lzma-rs
    match lzma_rs::lzma_decompress(
        &mut Cursor::new(&corrected_data),
        &mut decompressed,
    ) {
        Ok(_) => {
            return Ok(decompressed);
        }
        Err(e) => {
            println!("lzma-rs with corrected header failed: {}, trying original data...", e);
            decompressed.clear();
        }
    }

    // Fallback: try with original data
    match lzma_rs::lzma_decompress(
        &mut Cursor::new(data),
        &mut decompressed,
    ) {
        Ok(_) => {
            return Ok(decompressed);
        }
        Err(e) => {
            println!("lzma-rs original failed: {}, trying xz2...", e);
            decompressed.clear();
        }
    }

    // If lzma-rs fails, try xz2 (which handles XZ format that includes LZMA)
    match XzDecoder::new(Cursor::new(data)).read_to_end(&mut decompressed) {
        Ok(_) => {
            Ok(decompressed)
        }
        Err(e) => {
            println!("xz2 also failed: {}", e);
            Err(anyhow::anyhow!("Failed to decompress LZMA data with all methods: corrected header, original data, and xz2 all failed"))
        }
    }
}

/// Compress data to LZMA format
pub fn compress(data: &[u8]) -> Result<Vec<u8>> {
    let mut compressed = Vec::new();

    lzma_rs::lzma_compress(
        &mut Cursor::new(data),
        &mut compressed,
    )
    .context("Failed to compress data to LZMA")?;

    Ok(compressed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compress_decompress() {
        let original = b"Hello, Tibia World!";
        let compressed = compress(original).unwrap();
        let decompressed = decompress(&compressed).unwrap();

        assert_eq!(original.to_vec(), decompressed);
    }
}
