//! RSA login-modulus detection / replacement in `client.exe`.
//!
//! The Tibia client stores the 1024-bit RSA public modulus as a fixed-length
//! **256-character uppercase-hex ASCII string** (128 bytes), null-terminated.
//! Replacing it is an in-place overwrite of those 256 bytes — same length, so
//! no relocation. The client that owns this repo is patched to the OT default
//! modulus; swapping it to your own key (whose private half your server holds)
//! is the point of this editor.
//!
//! Detection anchors on "the unique run of exactly 256 hex chars bounded by
//! non-hex bytes". Verified unique in build 205cab… (the only other long hex
//! run is a 200-char lookup table). A replace is applied ONLY on a unique
//! match — never on 0 or ≥2.

/// The OTServ/TFS/Canary default modulus (uppercase hex), for a "this is the OT
/// key" hint. Not used for matching — only for display.
pub const OT_DEFAULT_MODULUS: &str = "9B646903B45B07AC956568D87353BD7165139DD7940703B03E6DD079399661B4A837AA60561D7CCB9452FA0080594909882AB5BCA58A1A1B35F8B1059B72B1212611C6152AD3DBB3CFBEE7ADC142A75D3D75971509C321C5C24A5BD51FD460F01B4E15BEB0DE1930528A5D3F15C1E3CBF5C401D6777E10ACAAB33DBE8D5B7FF5";

/// Fixed on-disk length of the modulus string (1024-bit = 128 bytes = 256 hex chars).
pub const MODULUS_HEX_LEN: usize = 256;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RsaStatus {
    pub found: bool,
    /// The current modulus as uppercase hex, if found.
    pub modulus: Option<String>,
    /// File offset of the modulus string.
    pub offset: Option<usize>,
    /// True when the current modulus equals the known OT default.
    pub is_ot_default: bool,
}

impl RsaStatus {
    fn not_found() -> Self {
        RsaStatus {
            found: false,
            modulus: None,
            offset: None,
            is_ot_default: false,
        }
    }
}

#[inline]
fn is_hex(b: u8) -> bool {
    b.is_ascii_digit() || (b'A'..=b'F').contains(&b) || (b'a'..=b'f').contains(&b)
}

/// Offsets of every run of exactly `MODULUS_HEX_LEN` hex chars bounded by
/// non-hex bytes (so a longer run isn't clipped down to 256).
fn modulus_candidates(bytes: &[u8]) -> Vec<usize> {
    let mut out = Vec::new();
    let n = bytes.len();
    let mut i = 0;
    while i < n {
        if !is_hex(bytes[i]) {
            i += 1;
            continue;
        }
        let start = i;
        while i < n && is_hex(bytes[i]) {
            i += 1;
        }
        // [start, i) is a maximal hex run; accept only if its length is exactly 256.
        if i - start == MODULUS_HEX_LEN {
            out.push(start);
        }
    }
    out
}

/// Detect the RSA modulus. Errors if more than one candidate exists (ambiguous).
pub fn detect(bytes: &[u8]) -> Result<RsaStatus, String> {
    let cands = modulus_candidates(bytes);
    match cands.len() {
        0 => Ok(RsaStatus::not_found()),
        1 => {
            let off = cands[0];
            let hex = String::from_utf8_lossy(&bytes[off..off + MODULUS_HEX_LEN]).to_ascii_uppercase();
            Ok(RsaStatus {
                found: true,
                is_ot_default: hex == OT_DEFAULT_MODULUS,
                modulus: Some(hex),
                offset: Some(off),
            })
        }
        _ => Err(format!("Found {} candidate RSA modulus strings — refusing to guess which one to patch.", cands.len())),
    }
}

/// Normalize user input to canonical 256-char uppercase hex: strip whitespace,
/// uppercase, left-pad with zeros. Errors on non-hex chars or a value wider than
/// 128 bytes (the client's slot is fixed at 1024-bit).
pub fn normalize_modulus(input: &str) -> Result<String, String> {
    let cleaned: String = input.chars().filter(|c| !c.is_whitespace()).collect();
    if cleaned.is_empty() {
        return Err("Modulus is empty.".into());
    }
    if !cleaned.bytes().all(is_hex) {
        return Err("Modulus must be hexadecimal (0-9, A-F).".into());
    }
    if cleaned.len() > MODULUS_HEX_LEN {
        return Err(format!("Modulus is {} hex chars; the client slot holds a 1024-bit key ({} hex chars max).", cleaned.len(), MODULUS_HEX_LEN));
    }
    // Left-pad omitted leading zeros so the on-disk length stays fixed.
    let padded = format!("{:0>width$}", cleaned.to_ascii_uppercase(), width = MODULUS_HEX_LEN);
    Ok(padded)
}

/// Overwrite the modulus in-place with `new_hex` (normalized). Errors (without
/// writing) unless the current modulus is uniquely located.
pub fn set_modulus(bytes: &mut [u8], new_hex: &str) -> Result<RsaStatus, String> {
    let normalized = normalize_modulus(new_hex)?;
    let status = detect(bytes)?;
    let off = status.offset.ok_or("RSA modulus not found in this binary — unknown or already-modified build.")?;

    let new_bytes = normalized.as_bytes();
    debug_assert_eq!(new_bytes.len(), MODULUS_HEX_LEN);
    bytes[off..off + MODULUS_HEX_LEN].copy_from_slice(new_bytes);

    Ok(RsaStatus {
        found: true,
        is_ot_default: normalized == OT_DEFAULT_MODULUS,
        modulus: Some(normalized),
        offset: Some(off),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A buffer with one null-bounded 256-hex modulus and unrelated filler.
    fn buf_with(modulus: &str) -> Vec<u8> {
        let mut v = b"port precomputation\x00".to_vec();
        v.extend_from_slice(modulus.as_bytes());
        v.push(0x00);
        v.extend_from_slice(b"wrong ty");
        v
    }

    #[test]
    fn detects_unique_modulus_and_flags_ot_default() {
        let v = buf_with(OT_DEFAULT_MODULUS);
        let s = detect(&v).unwrap();
        assert!(s.found);
        assert!(s.is_ot_default);
        assert_eq!(s.modulus.as_deref(), Some(OT_DEFAULT_MODULUS));
        assert_eq!(s.offset, Some(20)); // after "port precomputation\0"
    }

    #[test]
    fn replace_keeps_length_and_updates_value() {
        let mut v = buf_with(OT_DEFAULT_MODULUS);
        let len_before = v.len();
        let custom = "A".repeat(256);
        let s = set_modulus(&mut v, &custom).unwrap();
        assert_eq!(v.len(), len_before, "in-place patch must not resize");
        assert!(!s.is_ot_default);
        assert_eq!(detect(&v).unwrap().modulus.as_deref(), Some(custom.as_str()));
    }

    #[test]
    fn normalize_pads_and_uppercases() {
        let out = normalize_modulus("  9b64 6903  ").unwrap();
        assert_eq!(out.len(), MODULUS_HEX_LEN);
        assert!(out.ends_with("9B646903"));
        assert!(out.starts_with("0000"));
    }

    #[test]
    fn rejects_non_hex_and_oversize() {
        assert!(normalize_modulus("XYZ").is_err());
        assert!(normalize_modulus(&"A".repeat(257)).is_err());
    }

    #[test]
    fn refuses_ambiguous_double_modulus() {
        let mut v = buf_with(OT_DEFAULT_MODULUS);
        v.extend_from_slice(&buf_with(&"B".repeat(256)));
        assert!(detect(&v).is_err());
        assert!(set_modulus(&mut v, &"C".repeat(256)).is_err());
    }

    #[test]
    fn not_found_is_clean() {
        assert!(!detect(b"no key here").unwrap().found);
    }

    /// Opt-in against the real client.exe. Set CANARY_CLIENT_EXE to its path.
    /// Confirms the modulus is uniquely located (and, for the OT client, equals
    /// the OT default).
    #[test]
    fn real_client_exe_has_unique_modulus_when_env_set() {
        let Ok(path) = std::env::var("CANARY_CLIENT_EXE") else {
            return;
        };
        let bytes = std::fs::read(&path).expect("read client.exe");
        let s = detect(&bytes).expect("detect must not be ambiguous");
        assert!(s.found, "modulus must be found");
        let m = s.modulus.unwrap();
        assert_eq!(m.len(), MODULUS_HEX_LEN);
        println!("modulus @ {:#x} (ot_default={}): {}…", s.offset.unwrap(), s.is_ot_default, &m[..32]);
    }
}
