// Shared low-level helpers for the Qt resource format (qres).
//
// The same byte layout is used both by standalone `.rcc` files (parsed in
// `rcc_parser`) and by Qt resources compiled directly into a PE/ELF binary
// (parsed in `pe_qt_parser`). Keeping the primitives here avoids duplicating
// the name/data decoding logic across the two parsers.

use byteorder::{BigEndian, ReadBytesExt};
use std::io::{Cursor, Read};

/// Tree-node flags (Qt `QResourceRoot::Flags`).
pub const FLAG_COMPRESSED: u16 = 0x01;
pub const FLAG_DIRECTORY: u16 = 0x02;
/// zstd compression (Qt >= 5.13). We can detect it but cannot decompress it.
pub const FLAG_COMPRESSED_ZSTD: u16 = 0x04;

/// Read a single name entry from the names section.
///
/// Layout: `[u16 len][u32 hash][len * UTF-16BE code units]`. `names_base` is the
/// absolute start of the names section and `name_offset` is the relative offset
/// of this entry (the value stored in a tree node).
pub fn read_name(data: &[u8], names_base: usize, name_offset: u32) -> Result<String, String> {
    let pos = names_base.checked_add(name_offset as usize).ok_or("Name offset overflow")?;
    if pos + 6 > data.len() {
        return Err(format!("Name offset {} out of bounds", name_offset));
    }

    let mut cursor = Cursor::new(&data[pos..]);
    let str_len = cursor.read_u16::<BigEndian>().map_err(|e| e.to_string())?;
    let _hash = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;

    // Names are UTF-16BE encoded.
    let mut chars = Vec::with_capacity(str_len as usize);
    for _ in 0..str_len {
        let ch = cursor.read_u16::<BigEndian>().map_err(|e| e.to_string())?;
        chars.push(ch);
    }

    String::from_utf16(&chars).map_err(|e| format!("Invalid UTF-16 name: {}", e))
}

/// Read and (if needed) decompress a data payload from the data section.
///
/// Layout: `[u32 payload_len][payload]`. When `flags` marks the entry as zlib
/// compressed the payload itself is `[u32 uncompressed_size][zlib stream]`.
/// Returns `(bytes, was_compressed)`.
pub fn read_data(data: &[u8], data_base: usize, data_offset: u32, flags: u16) -> Result<(Vec<u8>, bool), String> {
    let pos = data_base.checked_add(data_offset as usize).ok_or("Data offset overflow")?;
    if pos + 4 > data.len() {
        return Err(format!("Data offset {} out of bounds", data_offset));
    }

    let mut cursor = Cursor::new(&data[pos..]);
    let size = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())? as usize;

    if size == 0 {
        return Ok((Vec::new(), false));
    }

    // zstd payloads use a different framing we don't support — fail loudly
    // rather than returning garbage.
    if (flags & FLAG_COMPRESSED_ZSTD) != 0 {
        return Err("Resource is zstd-compressed (unsupported)".into());
    }

    let remaining = &data[pos + 4..];
    let is_compressed = (flags & FLAG_COMPRESSED) != 0;

    if is_compressed {
        if remaining.len() < 4 {
            return Err("Compressed data too short".into());
        }
        let mut sz_cursor = Cursor::new(&remaining[0..4]);
        let _uncompressed_size = sz_cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;

        // `size` is attacker-controlled; clamp to the buffer so slicing can't panic.
        let end = std::cmp::min(size, remaining.len());
        if end <= 4 {
            return Err("Compressed data section too short".into());
        }
        let compressed_data = &remaining[4..end];
        decompress_zlib(compressed_data).map(|d| (d, true)).map_err(|e| format!("Zlib decompress failed: {}", e))
    } else {
        let end = std::cmp::min(size, remaining.len());
        Ok((remaining[..end].to_vec(), false))
    }
}

/// Decompress a raw zlib stream.
pub fn decompress_zlib(data: &[u8]) -> Result<Vec<u8>, String> {
    use flate2::read::ZlibDecoder;
    let mut decoder = ZlibDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder.read_to_end(&mut decompressed).map_err(|e| format!("Zlib decompression error: {}", e))?;
    Ok(decompressed)
}
