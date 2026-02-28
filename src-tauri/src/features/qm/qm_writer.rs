// Qt QM binary translation file writer
//
// Reconstructs a valid QM file from QmFile entries.
// Write order: Magic → Messages section → Hashes section → extra sections (preserved)

use super::qm_parser::{
    QmFile, CHUNK_COMMENT, CHUNK_END, CHUNK_SOURCE_TEXT, CHUNK_TRANSLATION, MAGIC,
    SECTION_HASHES, SECTION_MESSAGES,
};

fn encode_utf16be(s: &str) -> Vec<u8> {
    let mut out = Vec::with_capacity(s.len() * 2);
    for unit in s.encode_utf16() {
        out.push((unit >> 8) as u8);
        out.push((unit & 0xFF) as u8);
    }
    out
}

fn push_u32be(buf: &mut Vec<u8>, v: u32) {
    buf.extend_from_slice(&v.to_be_bytes());
}

fn write_string_chunk(buf: &mut Vec<u8>, tag: u8, s: &str) {
    if s.is_empty() {
        return;
    }
    let bytes = s.as_bytes();
    buf.push(tag);
    push_u32be(buf, bytes.len() as u32);
    buf.extend_from_slice(bytes);
}

fn write_section(buf: &mut Vec<u8>, tag: u8, data: &[u8]) {
    buf.push(tag);
    push_u32be(buf, data.len() as u32);
    buf.extend_from_slice(data);
}

pub fn write_qm(file: &QmFile) -> Vec<u8> {
    let mut messages_buf: Vec<u8> = Vec::new();
    // (hash, offset_in_messages_buf)
    let mut hash_pairs: Vec<(u32, u32)> = Vec::with_capacity(file.entries.len());

    for entry in &file.entries {
        let msg_offset = messages_buf.len() as u32;
        hash_pairs.push((entry.hash, msg_offset));

        // Write translation (tag 0x03, UTF-16BE, 4-byte byte-length or 0xFFFFFFFF for null)
        messages_buf.push(CHUNK_TRANSLATION);
        if let Some(ref text) = entry.translation {
            let encoded = encode_utf16be(text);
            push_u32be(&mut messages_buf, encoded.len() as u32);
            messages_buf.extend_from_slice(&encoded);
        } else {
            push_u32be(&mut messages_buf, 0xFFFF_FFFF);
        }

        // Write source text (tag 0x06, UTF-8) — omit if empty
        write_string_chunk(&mut messages_buf, CHUNK_SOURCE_TEXT, &entry.source_text);

        // Write comment (tag 0x07, UTF-8) — omit if empty
        write_string_chunk(&mut messages_buf, CHUNK_COMMENT, &entry.comment);

        // End of message
        messages_buf.push(CHUNK_END);
    }

    // Sort hash pairs by hash value for binary-search lookup
    hash_pairs.sort_by_key(|(h, _)| *h);

    let mut hashes_buf: Vec<u8> = Vec::with_capacity(hash_pairs.len() * 8);
    for (hash, offset) in &hash_pairs {
        push_u32be(&mut hashes_buf, *hash);
        push_u32be(&mut hashes_buf, *offset);
    }

    // Assemble final file
    let mut out: Vec<u8> = Vec::new();
    out.extend_from_slice(&MAGIC);
    write_section(&mut out, SECTION_MESSAGES, &messages_buf);
    write_section(&mut out, SECTION_HASHES, &hashes_buf);

    // Preserve other sections (e.g., Dependencies, Contexts)
    for (tag, data) in &file.extra_sections {
        write_section(&mut out, *tag, data);
    }

    out
}
