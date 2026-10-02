//! Client-side BattleEye gate detection / toggle for `client.exe`, by signature
//! scan. The client guards the BattleEye init `call` with a conditional jump:
//! the byte is `0x75` (JNZ → BE active) or `0xEB` (JMP → BE skipped/disabled).
//! Flipping that one byte enables/disables the gate.
//!
//! The exact call target is build-specific (it's a relative `call`), so a fixed
//! byte string only works for one build. Signatures here mask the volatile
//! bytes (the `cmp` displacement and the call target) and keep the opcodes, so
//! the same signature matches across 15.30 builds. A patch is applied ONLY when
//! a signature yields exactly one valid match — never on 0 or ≥2, so we can't
//! corrupt an unexpected binary.

/// JNZ opcode — the conditional jump present when BattleEye is active.
pub const JNZ: u8 = 0x75;
/// JMP opcode — the unconditional jump that skips the BattleEye init call.
pub const JMP: u8 = 0xEB;

/// A masked byte signature. `mask[i] == true` means `pattern[i]` must match
/// exactly; `false` is a wildcard. `jump_index` is the offset (within the
/// pattern) of the JNZ/JMP byte to read and flip — its mask entry must be
/// `false`, and a match additionally requires that byte to be `JNZ` or `JMP`.
struct Signature {
    name: &'static str,
    pattern: &'static [u8],
    mask: &'static [bool],
    jump_index: usize,
}

// Verified UNIQUE in build 205cab… (Tibia 15.30):
//   80 BE dd dd dd dd 00   cmp byte ptr [rsi+disp32], 0   (disp32 masked)
//   (75|EB) 0F             jcc/jmp +0x0F                  (the toggle byte)
//   E8                     call rel32                     (target masked)
// The naked `(75|EB) 0F E8` is NOT unique (3 hits) — the `cmp` anchor is needed.
const SIGNATURES: &[Signature] = &[Signature {
    name: "cmp[reg+disp32],0;jcc0F;call",
    //         80    BE    d     d     d     d     00    JMP   0F    E8
    pattern: &[0x80, 0xBE, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0F, 0xE8],
    mask: &[true, true, false, false, false, false, true, false, true, true],
    jump_index: 7,
}];

/// Current state of the BattleEye gate in a binary.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct BeStatus {
    /// A signature matched uniquely.
    pub found: bool,
    /// `Some(true)` = BE active (JNZ), `Some(false)` = disabled (JMP), `None` if not found.
    pub enabled: Option<bool>,
    /// File offset of the jump byte (the one that gets flipped), if found.
    pub offset: Option<usize>,
    /// Which signature matched, for diagnostics.
    pub signature: Option<String>,
}

impl BeStatus {
    fn not_found() -> Self {
        BeStatus {
            found: false,
            enabled: None,
            offset: None,
            signature: None,
        }
    }
}

/// Offsets where `sig` matches AND the jump byte is a valid JNZ/JMP.
fn valid_matches(bytes: &[u8], sig: &Signature) -> Vec<usize> {
    let plen = sig.pattern.len();
    let mut out = Vec::new();
    if bytes.len() < plen {
        return out;
    }
    'outer: for start in 0..=bytes.len() - plen {
        for i in 0..plen {
            if sig.mask[i] && bytes[start + i] != sig.pattern[i] {
                continue 'outer;
            }
        }
        let jb = bytes[start + sig.jump_index];
        if jb == JNZ || jb == JMP {
            out.push(start + sig.jump_index);
        }
    }
    out
}

/// Detect the BattleEye gate. Uses the first signature with EXACTLY one valid
/// match. A signature with ≥2 matches is ambiguous → hard error (never guess).
pub fn detect(bytes: &[u8]) -> Result<BeStatus, String> {
    let mut ambiguous: Option<&'static str> = None;
    for sig in SIGNATURES {
        let matches = valid_matches(bytes, sig);
        match matches.len() {
            1 => {
                let off = matches[0];
                return Ok(BeStatus {
                    found: true,
                    enabled: Some(bytes[off] == JNZ),
                    offset: Some(off),
                    signature: Some(sig.name.to_string()),
                });
            }
            0 => {}
            _ => ambiguous = ambiguous.or(Some(sig.name)),
        }
    }
    if let Some(name) = ambiguous {
        return Err(format!("BattleEye signature '{}' matched more than once — refusing to guess which site to patch.", name));
    }
    Ok(BeStatus::not_found())
}

/// Flip the gate to `enabled` in-place. Errors if no signature uniquely matches.
/// No-op (still returns the status) when the byte is already in the wanted state.
pub fn set_enabled(bytes: &mut [u8], enabled: bool) -> Result<BeStatus, String> {
    let status = detect(bytes)?;
    let off = status.offset.ok_or("BattleEye gate not found in this binary — unknown or already-modified build.")?;
    bytes[off] = if enabled {
        JNZ
    } else {
        JMP
    };
    Ok(BeStatus {
        found: true,
        enabled: Some(enabled),
        offset: Some(off),
        signature: status.signature,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a buffer containing the signature once, with the given jump byte,
    /// padded so nothing else accidentally matches.
    fn buf_with(jump: u8) -> Vec<u8> {
        let mut v = vec![0x11u8; 64];
        // 80 BE <disp32=0A75....> 00  <jump> 0F  E8 <call target>
        let sig: &[u8] = &[0x80, 0xBE, 0x75, 0x0A, 0x00, 0x00, 0x00, jump, 0x0F, 0xE8, 0xAF, 0x69, 0xED, 0xFF];
        v.splice(20..20, sig.iter().copied());
        v
    }

    #[test]
    fn detects_enabled() {
        let s = detect(&buf_with(JNZ)).unwrap();
        assert!(s.found);
        assert_eq!(s.enabled, Some(true));
        assert_eq!(s.offset, Some(20 + 7));
    }

    #[test]
    fn detects_disabled() {
        let s = detect(&buf_with(JMP)).unwrap();
        assert!(s.found);
        assert_eq!(s.enabled, Some(false));
    }

    #[test]
    fn toggle_flips_the_single_byte() {
        let mut b = buf_with(JNZ);
        let s = set_enabled(&mut b, false).unwrap();
        assert_eq!(s.enabled, Some(false));
        assert_eq!(b[20 + 7], JMP);
        // and back
        set_enabled(&mut b, true).unwrap();
        assert_eq!(b[20 + 7], JNZ);
    }

    #[test]
    fn refuses_ambiguous_double_match() {
        // Two copies of the signature → detect must error, set_enabled must not write.
        let mut b = buf_with(JNZ);
        let tail = buf_with(JMP);
        b.extend_from_slice(&tail);
        assert!(detect(&b).is_err());
        assert!(set_enabled(&mut b, false).is_err());
    }

    #[test]
    fn not_found_is_clean() {
        let s = detect(&[0u8; 128]).unwrap();
        assert!(!s.found);
        assert_eq!(s.offset, None);
    }
}
