// RCC binary writer — reconstructs a valid .rcc file from modified entries
// Produces format version 1 output (most compatible)

use byteorder::{BigEndian, WriteBytesExt};
use std::io::Write;

use super::rcc_parser::RccEntry;

/// Rebuild an RCC binary from a list of entries
pub fn write_rcc(entries: &[RccEntry]) -> Result<Vec<u8>, String> {
    // Phase 1: Build data section (all file payloads concatenated)
    let mut data_section = Vec::new();
    let mut data_offsets: Vec<u32> = Vec::new();

    for entry in entries {
        if entry.is_directory {
            data_offsets.push(0);
            continue;
        }
        let offset = data_section.len() as u32;
        data_offsets.push(offset);

        // Write: 4-byte size + raw data (no compression for simplicity)
        data_section.write_u32::<BigEndian>(entry.data.len() as u32).map_err(|e| e.to_string())?;
        data_section.write_all(&entry.data).map_err(|e| e.to_string())?;
    }

    // Phase 2: Build names section (UTF-16BE with hash)
    let mut names_section = Vec::new();
    let mut name_offsets: Vec<u32> = Vec::new();

    for entry in entries {
        let offset = names_section.len() as u32;
        name_offsets.push(offset);

        let utf16: Vec<u16> = entry.name.encode_utf16().collect();

        // Length (2 bytes) + hash (4 bytes) + UTF-16BE chars
        names_section.write_u16::<BigEndian>(utf16.len() as u16).map_err(|e| e.to_string())?;

        let hash = qt_hash(&entry.name);
        names_section.write_u32::<BigEndian>(hash).map_err(|e| e.to_string())?;

        for ch in &utf16 {
            names_section.write_u16::<BigEndian>(*ch).map_err(|e| e.to_string())?;
        }
    }

    // Phase 3: Build tree section
    let mut tree_section = Vec::new();

    for (i, entry) in entries.iter().enumerate() {
        // Name offset (4 bytes)
        tree_section.write_u32::<BigEndian>(name_offsets[i]).map_err(|e| e.to_string())?;

        if entry.is_directory {
            // Flags: directory
            tree_section.write_u16::<BigEndian>(0x02).map_err(|e| e.to_string())?;
            // Child count
            tree_section.write_u32::<BigEndian>(entry.children.len() as u32).map_err(|e| e.to_string())?;
            // First child index
            let first = entry.children.first().copied().unwrap_or(0) as u32;
            tree_section.write_u32::<BigEndian>(first).map_err(|e| e.to_string())?;
        } else {
            // Flags: file (no compression)
            tree_section.write_u16::<BigEndian>(0x00).map_err(|e| e.to_string())?;
            // Country + Language
            tree_section.write_u16::<BigEndian>(entry.country).map_err(|e| e.to_string())?;
            tree_section.write_u16::<BigEndian>(entry.language).map_err(|e| e.to_string())?;
            // Data offset
            tree_section.write_u32::<BigEndian>(data_offsets[i]).map_err(|e| e.to_string())?;
        }
    }

    // Phase 4: Assemble final file
    // Header: "qres" + version(4) + tree_offset(4) + data_offset(4) + names_offset(4) = 20 bytes
    let header_size: u32 = 20;
    let data_start = header_size;
    let names_start = data_start + data_section.len() as u32;
    let tree_start = names_start + names_section.len() as u32;

    let mut output = Vec::with_capacity(header_size as usize + data_section.len() + names_section.len() + tree_section.len());

    // Magic
    output.write_all(b"qres").map_err(|e| e.to_string())?;
    // Version 1
    output.write_u32::<BigEndian>(1).map_err(|e| e.to_string())?;
    // Tree offset
    output.write_u32::<BigEndian>(tree_start).map_err(|e| e.to_string())?;
    // Data offset
    output.write_u32::<BigEndian>(data_start).map_err(|e| e.to_string())?;
    // Names offset
    output.write_u32::<BigEndian>(names_start).map_err(|e| e.to_string())?;

    // Sections
    output.write_all(&data_section).map_err(|e| e.to_string())?;
    output.write_all(&names_section).map_err(|e| e.to_string())?;
    output.write_all(&tree_section).map_err(|e| e.to_string())?;

    Ok(output)
}

/// Qt's hash function for resource names (matches qHash in Qt source)
fn qt_hash(s: &str) -> u32 {
    let mut h: u32 = 0;
    for ch in s.encode_utf16() {
        h = (h << 4).wrapping_add(ch as u32);
        h ^= (h & 0xf0000000) >> 23;
        h &= 0x0fffffff;
    }
    h
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_qt_hash_consistency() {
        // Same input should produce same hash
        let h1 = qt_hash("test.png");
        let h2 = qt_hash("test.png");
        assert_eq!(h1, h2);
    }

    #[test]
    fn test_qt_hash_different_inputs() {
        let h1 = qt_hash("a.png");
        let h2 = qt_hash("b.png");
        assert_ne!(h1, h2);
    }
}
