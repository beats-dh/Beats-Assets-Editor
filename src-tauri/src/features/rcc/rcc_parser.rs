// Native Qt RCC (qres) binary format parser
// Supports format versions 1, 2, and 3

use byteorder::{BigEndian, ReadBytesExt};
use std::collections::HashMap;
use std::io::{Cursor, Read};

/// Header of a Qt RCC file: magic "qres" + metadata offsets
#[derive(Debug, Clone)]
pub struct RccHeader {
    pub version: u32,
    pub tree_offset: u32,
    pub data_offset: u32,
    pub names_offset: u32,
    /// Only present in version >= 3
    pub overallflags: u32,
}

/// A single resource entry extracted from the RCC file
#[derive(Debug, Clone)]
pub struct RccEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub data: Vec<u8>,
    pub children: Vec<usize>,
    /// Original compressed flag
    pub compressed: bool,
    /// Country/language code
    pub country: u16,
    pub language: u16,
}

/// Parsed RCC file containing header + all entries
#[derive(Debug, Clone)]
pub struct RccFile {
    pub header: RccHeader,
    pub entries: Vec<RccEntry>,
    /// Flat list of file entries (non-directory) with full paths
    pub files: Vec<RccFileInfo>,
}

/// Simplified file info for frontend consumption
#[derive(Debug, Clone, serde::Serialize)]
pub struct RccFileInfo {
    pub index: usize,
    pub name: String,
    pub path: String,
    pub size: usize,
    pub compressed: bool,
}

const RCC_MAGIC: &[u8; 4] = b"qres";

/// Flags in tree nodes
const FLAG_DIRECTORY: u16 = 0x02;
const FLAG_COMPRESSED: u16 = 0x01;

impl RccFile {
    /// Parse an RCC file from raw bytes
    pub fn parse(data: &[u8]) -> Result<Self, String> {
        if data.len() < 20 {
            return Err("File too small to be a valid RCC".into());
        }

        // Validate magic
        if &data[0..4] != RCC_MAGIC {
            return Err(format!("Invalid RCC magic: expected 'qres', got '{}'", String::from_utf8_lossy(&data[0..4])));
        }

        let mut cursor = Cursor::new(data);
        cursor.set_position(4);

        let version = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;
        if version < 1 || version > 3 {
            return Err(format!("Unsupported RCC version: {}", version));
        }

        let tree_offset = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;
        let data_offset = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;
        let names_offset = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;

        let overallflags = if version >= 3 {
            cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?
        } else {
            0
        };

        let header = RccHeader {
            version,
            tree_offset,
            data_offset,
            names_offset,
            overallflags,
        };

        // Parse the tree to build entries
        let mut entries = Vec::new();
        Self::parse_tree(data, &header, &mut entries)?;

        // Build full paths and collect file list
        let mut files = Vec::new();
        let mut path_map: HashMap<usize, String> = HashMap::new();
        Self::build_paths(&entries, 0, "", &mut path_map);

        // Update entry paths and collect files
        let mut updated_entries = entries;
        for (i, entry) in updated_entries.iter_mut().enumerate() {
            if let Some(p) = path_map.get(&i) {
                entry.path = p.clone();
            }
            if !entry.is_directory {
                files.push(RccFileInfo {
                    index: i,
                    name: entry.name.clone(),
                    path: entry.path.clone(),
                    size: entry.data.len(),
                    compressed: entry.compressed,
                });
            }
        }

        // Sort files by path for consistent ordering
        files.sort_by(|a, b| a.path.cmp(&b.path));

        Ok(RccFile {
            header,
            entries: updated_entries,
            files,
        })
    }

    /// Parse tree section, recursively building entries
    fn parse_tree(data: &[u8], header: &RccHeader, entries: &mut Vec<RccEntry>) -> Result<(), String> {
        let tree_start = header.tree_offset as usize;
        let tree_data = &data[tree_start..];
        let mut cursor = Cursor::new(tree_data);

        // First pass: read all raw tree nodes
        let mut raw_nodes: Vec<RawTreeNode> = Vec::new();

        // We need to figure out how many nodes there are.
        // Read nodes until we hit the end or names section.
        let tree_size = data.len() - tree_start;
        let node_size = if header.version >= 2 {
            22
        } else {
            14
        };

        let node_count = tree_size / node_size;

        for _ in 0..node_count {
            let name_offset = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;
            let flags = cursor.read_u16::<BigEndian>().map_err(|e| e.to_string())?;

            let is_dir = (flags & FLAG_DIRECTORY) != 0;

            if is_dir {
                let child_count = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;
                let first_child = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;

                raw_nodes.push(RawTreeNode {
                    name_offset,
                    flags,
                    is_dir: true,
                    child_count: Some(child_count),
                    first_child: Some(first_child),
                    data_offset: None,
                    country: 0,
                    language: 0,
                    last_modified: 0,
                });
            } else {
                let country = cursor.read_u16::<BigEndian>().map_err(|e| e.to_string())?;
                let language = cursor.read_u16::<BigEndian>().map_err(|e| e.to_string())?;
                let data_off = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;

                let last_modified = if header.version >= 2 {
                    cursor.read_u64::<BigEndian>().map_err(|e| e.to_string())?
                } else {
                    0
                };

                raw_nodes.push(RawTreeNode {
                    name_offset,
                    flags,
                    is_dir: false,
                    child_count: None,
                    first_child: None,
                    data_offset: Some(data_off),
                    country,
                    language,
                    last_modified,
                });
            }

            // Safety: stop if we've gone past the file
            if cursor.position() as usize >= tree_size {
                break;
            }
        }

        // Second pass: resolve names and data for each node
        for node in &raw_nodes {
            let name = Self::read_name(data, header.names_offset as usize, node.name_offset)?;

            let (entry_data, compressed) = if !node.is_dir {
                if let Some(d_off) = node.data_offset {
                    Self::read_data(data, header.data_offset as usize, d_off, node.flags)?
                } else {
                    (Vec::new(), false)
                }
            } else {
                (Vec::new(), false)
            };

            let children = if node.is_dir {
                let first = node.first_child.unwrap_or(0) as usize;
                let count = node.child_count.unwrap_or(0) as usize;
                (first..first + count).collect()
            } else {
                Vec::new()
            };

            entries.push(RccEntry {
                name,
                path: String::new(),
                is_directory: node.is_dir,
                data: entry_data,
                children,
                compressed,
                country: node.country,
                language: node.language,
            });
        }

        Ok(())
    }

    /// Read a name from the names section
    fn read_name(data: &[u8], names_base: usize, name_offset: u32) -> Result<String, String> {
        let pos = names_base + name_offset as usize;
        if pos + 4 > data.len() {
            return Err(format!("Name offset {} out of bounds", name_offset));
        }

        let mut cursor = Cursor::new(&data[pos..]);
        let str_len = cursor.read_u16::<BigEndian>().map_err(|e| e.to_string())?;
        let _hash = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;

        // Names are UTF-16BE encoded
        let mut chars = Vec::with_capacity(str_len as usize);
        for _ in 0..str_len {
            let ch = cursor.read_u16::<BigEndian>().map_err(|e| e.to_string())?;
            chars.push(ch);
        }

        String::from_utf16(&chars).map_err(|e| format!("Invalid UTF-16 name: {}", e))
    }

    /// Read and decompress data from the data section
    fn read_data(data: &[u8], data_base: usize, data_offset: u32, flags: u16) -> Result<(Vec<u8>, bool), String> {
        let pos = data_base + data_offset as usize;
        if pos + 4 > data.len() {
            return Err(format!("Data offset {} out of bounds", data_offset));
        }

        let mut cursor = Cursor::new(&data[pos..]);
        let size = cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())? as usize;

        if size == 0 {
            return Ok((Vec::new(), false));
        }

        let remaining = &data[pos + 4..];
        let is_compressed = (flags & FLAG_COMPRESSED) != 0;

        if is_compressed {
            // First 4 bytes after size = uncompressed size
            if remaining.len() < 4 {
                return Err("Compressed data too short".into());
            }
            let mut sz_cursor = Cursor::new(&remaining[0..4]);
            let _uncompressed_size = sz_cursor.read_u32::<BigEndian>().map_err(|e| e.to_string())?;

            let compressed_data = &remaining[4..size];
            Self::decompress_zlib(compressed_data).map(|d| (d, true)).map_err(|e| format!("Zlib decompress failed: {}", e))
        } else {
            let end = std::cmp::min(size, remaining.len());
            Ok((remaining[..end].to_vec(), false))
        }
    }

    /// Decompress zlib data
    fn decompress_zlib(data: &[u8]) -> Result<Vec<u8>, String> {
        use flate2::read::ZlibDecoder;
        let mut decoder = ZlibDecoder::new(data);
        let mut decompressed = Vec::new();
        decoder.read_to_end(&mut decompressed).map_err(|e| format!("Zlib decompression error: {}", e))?;
        Ok(decompressed)
    }

    /// Recursively build full paths for all entries
    fn build_paths(entries: &[RccEntry], index: usize, prefix: &str, path_map: &mut HashMap<usize, String>) {
        if index >= entries.len() {
            return;
        }

        let entry = &entries[index];
        let full_path = if prefix.is_empty() {
            entry.name.clone()
        } else if entry.name.is_empty() {
            prefix.to_string()
        } else {
            format!("{}/{}", prefix, entry.name)
        };

        path_map.insert(index, full_path.clone());

        if entry.is_directory {
            for &child_idx in &entry.children {
                Self::build_paths(entries, child_idx, &full_path, path_map);
            }
        }
    }
}

/// Internal raw tree node before name/data resolution
#[derive(Debug)]
struct RawTreeNode {
    name_offset: u32,
    flags: u16,
    is_dir: bool,
    child_count: Option<u32>,
    first_child: Option<u32>,
    data_offset: Option<u32>,
    country: u16,
    language: u16,
    #[allow(dead_code)]
    last_modified: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invalid_magic() {
        let data = b"NOPE0000000000000000";
        let result = RccFile::parse(data);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid RCC magic"));
    }

    #[test]
    fn test_too_small() {
        let data = b"qres";
        let result = RccFile::parse(data);
        assert!(result.is_err());
    }
}
