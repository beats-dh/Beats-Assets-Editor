use anyhow::{Context, Result};
use std::io::{self, BufRead, BufReader, Cursor, Read, Write};
use xz2::read::XzDecoder;
use xz2::write::XzEncoder;

/// Magic bytes that identify an XZ container.
pub const XZ_MAGIC: [u8; 6] = [0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00];

/// Returns true if `data` is an XZ stream.
#[inline]
pub fn is_xz(data: &[u8]) -> bool {
    data.starts_with(&XZ_MAGIC)
}

/// Lazily patches Tibia's incorrect LZMA header without cloning the payload.
struct HeaderPatcher<'a> {
    data: &'a [u8],
    pos: usize,
}

impl<'a> HeaderPatcher<'a> {
    #[inline]
    fn new(data: &'a [u8]) -> Self {
        Self {
            data,
            pos: 0,
        }
    }
}

impl<'a> Read for HeaderPatcher<'a> {
    #[inline]
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        if self.pos >= self.data.len() || buf.is_empty() {
            return Ok(0);
        }

        let remaining = &self.data[self.pos..];
        let len = remaining.len().min(buf.len());
        buf[..len].copy_from_slice(&remaining[..len]);

        if self.data.len() >= 13 && self.pos < 13 && self.pos + len > 5 {
            let start = self.pos.max(5);
            let end = (self.pos + len).min(13);
            for idx in start..end {
                buf[idx - self.pos] = 0xFF;
            }
        }

        self.pos += len;
        Ok(len)
    }
}

#[inline]
fn try_lzma<R: BufRead>(reader: R, output: &mut Vec<u8>) -> std::result::Result<(), lzma_rs::error::Error> {
    let mut reader = reader;
    output.clear();
    match lzma_rs::lzma_decompress(&mut reader, output) {
        Ok(()) => Ok(()),
        Err(err) => {
            output.clear();
            Err(err)
        }
    }
}

/// Decompress LZMA data (Tibia uses a custom LZMA format)
pub fn decompress(data: &[u8]) -> Result<Vec<u8>> {
    // According to Reddit research, Tibia uses LZMA format but with incorrect uncompressed size field
    // We need to fix the header before decompression

    anyhow::ensure!(data.len() >= 13, "LZMA data too short");

    let mut decompressed = Vec::new();
    let mut errors = Vec::with_capacity(3);

    match try_lzma(BufReader::new(HeaderPatcher::new(data)), &mut decompressed) {
        Ok(()) => return Ok(decompressed),
        Err(err) => errors.push(format!("lzma-rs with corrected header: {}", err)),
    }

    match try_lzma(Cursor::new(data), &mut decompressed) {
        Ok(()) => return Ok(decompressed),
        Err(err) => errors.push(format!("lzma-rs with original header: {}", err)),
    }

    decompressed.clear();
    match XzDecoder::new(Cursor::new(data)).read_to_end(&mut decompressed) {
        Ok(_) => Ok(decompressed),
        Err(err) => {
            errors.push(format!("xz2 fallback: {}", err));
            Err(anyhow::anyhow!("Failed to decompress LZMA data ({})", errors.join("; ")))
        }
    }
}

/// Compress data to LZMA format
pub fn compress(data: &[u8]) -> Result<Vec<u8>> {
    let mut compressed = Vec::new();

    let mut reader: &[u8] = data;
    lzma_rs::lzma_compress(&mut reader, &mut compressed).context("Failed to compress data to LZMA")?;

    Ok(compressed)
}

/// Compress data to a standard XZ container.
pub fn compress_xz(data: &[u8]) -> Result<Vec<u8>> {
    let mut encoder = XzEncoder::new(Vec::new(), 6);
    encoder.write_all(data).context("Failed to feed data to XZ encoder")?;
    encoder.finish().context("Failed to finalize XZ stream")
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

    #[test]
    fn test_compress_xz_roundtrip() {
        let original = b"Canary staticdata round-trip payload \x00\x01\x02";
        let compressed = compress_xz(original).unwrap();
        assert!(is_xz(&compressed), "compress_xz must produce an XZ container");
        let decompressed = decompress(&compressed).unwrap();
        assert_eq!(original.to_vec(), decompressed);
    }
}
