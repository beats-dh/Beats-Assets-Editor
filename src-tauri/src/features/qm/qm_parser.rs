// Qt QM binary translation file parser
//
// Format:
//   Magic: 16 bytes [0x3C, 0xB8, 0x64, 0x18, 0xCA, 0xEF, 0x9C, 0x95,
//                    0xCD, 0x21, 0x1C, 0xBF, 0x60, 0xA1, 0xBD, 0xDD]
//   Sections: [tag:u8][size:u32be][data...]
//     0x2F = Contexts  (legacy, Qt ≤ 3)
//     0x42 = Hashes    (sorted [hash:u32be, offset:u32be] pairs)
//     0x46 = Dependencies
//     0x4C = Language
//     0x69 = Messages  (message chunks)
//     0x88 = NumerusRules
//
//   Message chunks (within Messages section, each message ends with 0x01):
//     0x01 = End
//     0x02 = Context      (u32be len + bytes)
//     0x03 = SourceFile   (u32be len + bytes)
//     0x04 = SourceText   (u32be len + bytes)
//     0x05 = Translation  (u32be byte_len [0xFFFFFFFF=null] + UTF-16BE)
//     0x06 = Comment      (u32be len + bytes)
//     0x08 = Numerus / KeyRecords
//
//   Hashes section: array of [hash:u32be, offset:u32be] sorted by hash
//   offset points into the Messages section data.

pub const MAGIC: [u8; 16] = [0x3C, 0xB8, 0x64, 0x18, 0xCA, 0xEF, 0x9C, 0x95, 0xCD, 0x21, 0x1C, 0xBF, 0x60, 0xA1, 0xBD, 0xDD];

// Section tags — from Qt source: qtranslator.cpp
pub const SECTION_CONTEXTS: u8 = 0x2F; // legacy Qt ≤ 3
pub const SECTION_HASHES: u8 = 0x42; // lookup table (hash → message offset)
pub const SECTION_DEPENDENCIES: u8 = 0x46; // dependency list
pub const SECTION_LANGUAGE: u8 = 0x4C; // language string
pub const SECTION_MESSAGES: u8 = 0x69; // actual message data
pub const SECTION_NUMERUS_RULES: u8 = 0x88; // plural form rules

// Message chunk tags — from Qt source qtranslator.cpp enum Tag {}
// Reference: Qt5/6 qtranslator.cpp, qmsgfmt.cpp (linguist lrelease)
pub const CHUNK_END: u8 = 0x01;
pub const CHUNK_SOURCE_TEXT16: u8 = 0x02; // Qt ≤3 compat: UTF-16BE source text
pub const CHUNK_TRANSLATION: u8 = 0x03; // UTF-16BE translation (Qt 4+)
pub const CHUNK_CONTEXT16: u8 = 0x04; // Qt ≤3 compat: UTF-16BE context
                                      // 0x05 = Tag_Obsolete1 (never written, skip)
pub const CHUNK_SOURCE_TEXT: u8 = 0x06; // UTF-8 source text (Qt 4+)
pub const CHUNK_COMMENT: u8 = 0x07; // UTF-8 comment (Qt 4+)
                                    // 0x08 = Tag_Obsolete2 (never written, skip)

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct QmEntry {
    /// Sequential index (position in hashes array)
    pub index: usize,
    /// Original hash from the Hashes section
    pub hash: u32,
    /// Offset into the Messages section
    pub offset: usize,
    /// Context string (may be empty if not stored)
    pub context: String,
    /// Source text (may be empty in stripped QM files)
    pub source_text: String,
    /// Comment for disambiguation
    pub comment: String,
    /// Translated string — None means same as source / untranslated
    pub translation: Option<String>,
    /// Plural forms (empty for non-numerus messages)
    pub numerus_forms: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct QmFile {
    pub entries: Vec<QmEntry>,
    /// True if at least one entry has a non-empty source_text
    pub has_source_text: bool,
    /// Original raw bytes of non-Messages/non-Hashes sections (preserved verbatim)
    pub extra_sections: Vec<(u8, Vec<u8>)>,
}

pub fn parse_qm(data: &[u8]) -> Result<QmFile, String> {
    if data.len() < 16 {
        return Err("File too small to be a QM file".to_string());
    }
    if &data[..16] != MAGIC {
        return Err(format!("Invalid QM magic: expected {:02X?}, got {:02X?}", MAGIC, &data[..16]));
    }

    let mut pos = 16usize;
    let mut messages_data: Option<&[u8]> = None;
    let mut hashes_data: Option<&[u8]> = None;
    let mut extra_sections: Vec<(u8, Vec<u8>)> = Vec::new();

    // Parse sections
    while pos + 5 <= data.len() {
        let tag = data[pos];
        pos += 1;

        if pos + 4 > data.len() {
            break;
        }
        let size = u32::from_be_bytes(data[pos..pos + 4].try_into().unwrap()) as usize;
        pos += 4;

        if pos + size > data.len() {
            return Err(format!("Section 0x{:02X} claims size {} but only {} bytes remain", tag, size, data.len() - pos));
        }

        let section_data = &data[pos..pos + size];
        match tag {
            SECTION_MESSAGES => messages_data = Some(section_data),
            SECTION_HASHES => hashes_data = Some(section_data),
            _ => extra_sections.push((tag, section_data.to_vec())),
        }
        pos += size;
    }

    let messages = messages_data.ok_or("No Messages section found in QM file")?;
    let hashes = hashes_data.ok_or("No Hashes section found in QM file")?;

    // Parse hashes: fixed-size entries [hash:u32be][offset:u32be]
    if hashes.len() % 8 != 0 {
        return Err(format!("Hashes section size {} is not a multiple of 8", hashes.len()));
    }

    let num_entries = hashes.len() / 8;
    let mut entries = Vec::with_capacity(num_entries);

    for i in 0..num_entries {
        let base = i * 8;
        let hash = u32::from_be_bytes(hashes[base..base + 4].try_into().unwrap());
        let offset = u32::from_be_bytes(hashes[base + 4..base + 8].try_into().unwrap()) as usize;

        if offset >= messages.len() {
            log::warn!("Hash entry {} has out-of-bounds offset {}", i, offset);
            continue;
        }

        match parse_message(messages, offset, i, hash) {
            Ok(entry) => entries.push(entry),
            Err(e) => log::warn!("Failed to parse message at offset {}: {}", offset, e),
        }
    }

    let has_source_text = entries.iter().any(|e| !e.source_text.is_empty());

    Ok(QmFile {
        entries,
        has_source_text,
        extra_sections,
    })
}

fn read_u32be(data: &[u8], pos: &mut usize) -> Option<u32> {
    if *pos + 4 > data.len() {
        return None;
    }
    let v = u32::from_be_bytes(data[*pos..*pos + 4].try_into().unwrap());
    *pos += 4;
    Some(v)
}

fn read_bytes<'a>(data: &'a [u8], pos: &mut usize, len: usize) -> Option<&'a [u8]> {
    if *pos + len > data.len() {
        return None;
    }
    let slice = &data[*pos..*pos + len];
    *pos += len;
    Some(slice)
}

fn bytes_to_string(b: &[u8]) -> String {
    // Try UTF-8 first, fall back to Latin-1
    match std::str::from_utf8(b) {
        Ok(s) => s.to_string(),
        Err(_) => b.iter().map(|&c| c as char).collect(),
    }
}

fn utf16be_to_string(b: &[u8]) -> String {
    let chars: Vec<u16> = b.chunks_exact(2).map(|ch| u16::from_be_bytes([ch[0], ch[1]])).collect();
    String::from_utf16_lossy(&chars)
}

fn parse_message(data: &[u8], start: usize, index: usize, hash: u32) -> Result<QmEntry, String> {
    let mut pos = start;
    let mut context = String::new();
    let mut source_text = String::new();
    let mut comment = String::new();
    let mut translation: Option<String> = None;
    let numerus_forms: Vec<String> = Vec::new();

    loop {
        if pos >= data.len() {
            break;
        }

        let tag = data[pos];
        pos += 1;

        match tag {
            CHUNK_END => break,

            CHUNK_TRANSLATION => {
                // UTF-16BE string, 4-byte byte-length prefix (0xFFFFFFFF = null)
                let len = match read_u32be(data, &mut pos) {
                    Some(l) => l,
                    None => break,
                };
                if len == 0xFFFF_FFFF {
                    translation = None;
                } else {
                    let bytes = match read_bytes(data, &mut pos, len as usize) {
                        Some(b) => b,
                        None => break,
                    };
                    translation = Some(utf16be_to_string(bytes));
                }
            }

            CHUNK_SOURCE_TEXT => {
                // UTF-8 source text (Qt 4+)
                let len = match read_u32be(data, &mut pos) {
                    Some(l) => l as usize,
                    None => break,
                };
                let bytes = match read_bytes(data, &mut pos, len) {
                    Some(b) => b,
                    None => break,
                };
                source_text = bytes_to_string(bytes);
            }

            CHUNK_COMMENT => {
                // UTF-8 comment (Qt 4+)
                let len = match read_u32be(data, &mut pos) {
                    Some(l) => l as usize,
                    None => break,
                };
                let bytes = match read_bytes(data, &mut pos, len) {
                    Some(b) => b,
                    None => break,
                };
                comment = bytes_to_string(bytes);
            }

            CHUNK_SOURCE_TEXT16 => {
                // Qt ≤3 compat: UTF-16BE source text; use as fallback if no UTF-8 version
                let len = match read_u32be(data, &mut pos) {
                    Some(l) => l as usize,
                    None => break,
                };
                let bytes = match read_bytes(data, &mut pos, len) {
                    Some(b) => b,
                    None => break,
                };
                if source_text.is_empty() {
                    source_text = utf16be_to_string(bytes);
                }
            }

            CHUNK_CONTEXT16 => {
                // Qt ≤3 compat: UTF-16BE context; use as fallback
                let len = match read_u32be(data, &mut pos) {
                    Some(l) => l as usize,
                    None => break,
                };
                let bytes = match read_bytes(data, &mut pos, len) {
                    Some(b) => b,
                    None => break,
                };
                if context.is_empty() {
                    context = utf16be_to_string(bytes);
                }
            }

            _ => {
                // Obsolete or unknown chunk — skip by reading 4-byte length prefix
                match read_u32be(data, &mut pos) {
                    Some(len) => {
                        if pos + len as usize <= data.len() {
                            pos += len as usize;
                        } else {
                            break;
                        }
                    }
                    None => break,
                }
            }
        }
    }

    Ok(QmEntry {
        index,
        hash,
        offset: start,
        context,
        source_text,
        comment,
        translation,
        numerus_forms,
    })
}
