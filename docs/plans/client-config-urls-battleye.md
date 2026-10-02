# Plan: client config editor — URLs, payload docs, BattleEye toggle

## Goal

New "Client Config" feature to edit things that live outside the asset files of
the Tibia 15.30 client the user owns (private-server / OT work):

1. **URLs** — edit every entry of `conf/config.ini` `[URLS]` (24 keys, incl.
   `loginWebService`/`clientWebService` that point the client at the server).
2. **Payload reference** — document the URLs that get runtime params appended
   (store redirect, wheel-of-destiny planner `&code=`, limesurvey `/sid/`).
3. **BattleEye toggle** — detect/flip the client-side BE gate in `client.exe`
   via a signature scan (JNZ↔JMP), version-tolerant, only acting on a unique
   match.

4. **RSA login key** — read/replace the RSA modulus in `client.exe`. Located
   after the user supplied the key values: it is stored as a **256-char
   uppercase-hex ASCII string** (not decimal/DER/raw-bytes — which is why the
   earlier scans missed it), unique at file offset `0x1caac30`, currently the
   OT default. Replace is an in-place same-length overwrite, unique-match-only.

### Verified facts (measured against the real client, not assumed)

- `conf/config.ini` is plaintext INI, `[URLS]` section, 24 `key=value` lines,
  already OT-edited (`loginWebService=http://127.0.0.1:8081/login`).
- BattleEye site in `client.exe` (build sha256 `205cab…`): the instruction
  `cmp byte ptr [rsi+0x0A75], 0` (`80 BE 75 0A 00 00 00`) + a `0F`-displacement
  jump + a `call` (`E8 …`). The user's known patch is `75 0F → EB 0F` (JNZ→JMP,
  skip the BE init call).
- **This exe is already BE-disabled**: the "enabled" pattern
  `75 0F E8 AF 69 ED FF` = 0 hits; the "disabled" `EB 0F E8 AF 69 ED FF` = 1 hit
  at file offset `0x1d132a`. The runtime (`BEClient*.dll`) isn't even installed.
- The exact call bytes are build-specific (the user's `a30dad` build differs).
  A **version-tolerant** signature was verified UNIQUE in this build:
  `80 BE ?? ?? ?? ?? 00 [75|EB] 0F E8` (1 hit at `0x1d1323`; jump byte at +7 =
  `0x1d132a`). The naked `[75|EB] 0F E8` gives 3 hits — too generic, rejected.

## Scope — affected files (exhaustive)

### Repetitive-decision criteria

- Every new Tauri command: `Result<T, String>`, registered in `lib.rs`
  `generate_handler!`, named in `src/commands.ts`, called via `invoke.ts`.
- Every user-facing string: i18n key with all 5 languages
  (default/en, pt-BR, es, ru) — pt-BR is the app default.
- Any write over the user's file: `core::fs_util::write_atomic`.
- BattleEye patch NEVER writes on a non-unique signature match (0 or ≥2 → error).

### Backend — new module `src-tauri/src/features/client_config/`

- `mod.rs` — `pub mod parsers; pub mod commands;`
- `parsers/mod.rs`
- `parsers/config_ini.rs` — parse `[URLS]` preserving the whole file; return the
  keys in file order; rewrite only changed values. Unit-tested round-trip.
- `parsers/battleye.rs` — masked signature scan (bytes+mask, jump-byte index),
  a table of known signatures, `detect(bytes) -> BeStatus{found,enabled,offset}`
  and `set_enabled(bytes, enabled) -> patched Vec<u8>`. Unit-tested against a
  synthetic buffer for both states + the non-unique-refusal case.
- `commands/mod.rs`
- `commands/urls.rs` — `get_client_urls(tibia_path)` /
  `save_client_urls(tibia_path, entries)`.
- `commands/battleye.rs` — `get_battleye_status(tibia_path)` (resolves the client
  exe by scanning `<root>/bin/*.exe` for a unique signature) /
  `set_battleye_enabled(exe_path, enabled)`.
- `src-tauri/src/features/mod.rs` — add `pub mod client_config;`
- `src-tauri/src/lib.rs` — register the 4 commands.

### Frontend

- `src/commands.ts` — 4 command constants.
- `src/types.ts` — `ClientUrlEntry`, `BattleEyeStatus`.
- `src/stores/assetsState.svelte.ts` — add `'client-config'` to the `viewMode`
  union + `selectClientConfigMode()`.
- `src/lib/components/ClientConfigBrowser.svelte` — new page: URLs editor,
  payload reference panel, BattleEye status + toggle.
- `src/lib/pages/AssetEditorLayout.svelte` — route the new viewMode.
- `src/lib/components/CategoryNav.svelte` — entry button (⚙️).
- `src/i18n.ts` — labels (× 5 languages).

## Checklist

- [x] Phase 1 — backend module skeleton (`mod.rs`, `features/mod.rs`)
- [x] Phase 2 — `parsers/config_ini.rs` + tests
- [x] Phase 3 — `parsers/battleye.rs` (masked sig-scan) + tests
- [x] Phase 4 — `commands/urls.rs`
- [x] Phase 5 — `commands/battleye.rs`
- [x] Phase 6 — `lib.rs` registration
- [x] Phase 7 — frontend `commands.ts` + `types.ts` + store
- [x] Phase 8 — `ClientConfigBrowser.svelte` (URLs + payloads + BE)
- [x] Phase 9 — layout route + CategoryNav entry
- [x] Phase 10 — i18n (× 5 languages)
- [x] Validate: `cargo check` + `cargo test --lib` + `npx tsc --noEmit`
      + `npm run build` + `cargo fmt`
- [x] No stub / TODO left; checklist zeroed

## Notes & decisions

- **BE safety model**: signature table is ordered; use the first signature that
  yields EXACTLY ONE match. 0 or ≥2 matches → return a clear error, never write.
  State comes from the jump byte (`0x75` enabled / `0xEB` disabled); toggle flips
  only that one byte. The current exe reports "already disabled".
- **Version tolerance**: primary signature masks the `cmp` disp32 and the call
  rel32, keeping the opcodes (`80 BE … 00`, jump `0F`, `E8`). Adding the exact
  `a30dad` pattern later is just another table row.
- **config.ini**: preserve the whole file; only replace values of existing
  `[URLS]` keys. Trailing padding spaces in values are dropped on write (INI
  semantics ignore them). No add/remove of keys in v1.
- **RSA**: deferred until a disassembler is connected; not built here.
