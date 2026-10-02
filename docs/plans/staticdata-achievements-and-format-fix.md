# Plan: staticdata — achievements rename, format-detection fix, versioned DAT-merge

## Goal

Three fixes to the staticdata feature, all rooted in the same mistake: the app
assumed the legacy schema is the only schema.

1. **Fix `detect_format`** — it decides "is this file raw protobuf?" by trying a
   **legacy** decode. A 15.30 file fails that decode, so saving rewrites a raw
   file as LZMA and the client can no longer read it. **This corrupts files.**
2. **Rename `titles` → `achievements`** across the whole chain. Field 3 of the
   15.30 staticdata is `Achievement`; the app has been showing it under a
   "Titles" label. Real character Titles are **not in any client asset** (they
   arrive over the wire as `tibia.protobuf.protocol.CharacterTitle`), so no
   Titles category is added.
3. **Migrate the DAT-merge to the versioned doc** — it only speaks the legacy
   schema, so with a 15.30 file `state.staticdata` is `None` and the merge
   aborts with "No staticdata loaded in app".

### Evidence (verified against the real client, not assumed)

- Type names embedded in `Tibia1530/bin/client.exe`, package
  `tibia.protobuf.staticdata`: `Monster`, `MonsterClass`, `Achievement`,
  `House`, `BossMonster`, `Quest`, `HouseMapArea`, `StaticMapData`. **No
  `Title`.**
- Storage-class asymmetry in the exe: achievements have
  `TStaticAchievementStorage` (static = from the asset); titles only have
  `TCharacterTitlesInfoStorage` + `tibia.protobuf.protocol.CharacterTitle`.
- Wire-format scan of the real `staticdata-b1989…dat` (183 881 B, raw protobuf):
  field 1 = 935 monsters, 2 = 21 monster_classes, 3 = **363 achievements**
  ("Chorister", "The Milkman", + description + grade 1–3), 4 = 995 houses,
  5 = 478 bosses, 6 = 101 quests. Matches `staticdata_new.proto` field for field.
- Legacy `StaticData::decode` on that file **fails**: legacy field 4 is
  `BossData`, whose field 3 is a message, but 15.30's House field 3 is the
  `description` string. 3 of 995 houses have a non-empty description (first:
  "Only Sorcerers can enter.") and each makes prost error out.

## Scope — affected files (exhaustive)

### Repetitive-decision criteria (apply mechanically, no exceptions)

Rename every **staticdata-domain** `title` identifier to `achievement`:

| Before | After |
|---|---|
| `titles` (field/vec/var) | `achievements` |
| `Title` (proto message / Rust type) | `Achievement` |
| `total_titles` | `total_achievements` |
| `get_staticdata_titles` | `get_staticdata_achievements` |
| `update_staticdata_title` | `update_staticdata_achievement` |
| `titles_to_add` / `titles_added` | `achievements_to_add` / `achievements_added` |
| `StaticTitle` (TS) | `StaticAchievement` |
| `GET_STATICDATA_TITLES` / `UPDATE_STATICDATA_TITLE` | `GET_STATICDATA_ACHIEVEMENTS` / `UPDATE_STATICDATA_ACHIEVEMENT` |
| category string `"titles"` | `"achievements"` |
| i18n `*.titles*` keys | `*.achievements*` |

**Do NOT touch** (verified false positives): `SyncShopModal.svelte`
(`fetchFandomCategoryTitles` — Fandom wiki categories), `sounds.rs`
(`MusicTypeMusicTitle`), and HTML `title=` attributes.

i18n text, all 5 entries per key: `default`/`en` = "Achievements",
`pt-BR` = "Conquistas", `es` = "Logros", `ru` = "Достижения".

### Backend (topological order — types first, registration last)

- `src-tauri/protobuf/staticdata.proto` — `Title` → `Achievement`,
  `titles = 2` → `achievements = 2` (field **number** unchanged → wire-compatible).
- `src-tauri/protobuf/staticdata_new.proto` — header comment mentions "titles";
  reword to reflect that legacy field 2 was already achievements.
- `src-tauri/src/features/staticdata/parsers/staticdata.rs` —
  **`detect_format` fix** (raw detection must accept *either* schema);
  `total_titles` → `total_achievements`; `doc_statistics`; `is_trivially_empty`;
  log line; doc comments; the opt-in real-file test.
- `src-tauri/src/features/staticdata/commands/io.rs` — `getter!` rename, both
  `"titles"` category arms, `update_staticdata_title`, header comment.
- `src-tauri/src/state.rs` — `staged_staticdata` becomes
  `(PathBuf, StaticDataDoc)`; drop the now-orphaned legacy `staticdata` field.
- `src-tauri/src/features/dat_merge/staticdata_merge.rs` — migrate to
  `StaticDataDoc`; same-schema guard with a clear error; add `monster_classes`
  as a merged category (new schema only); rename titles→achievements.
- `src-tauri/src/features/dat_merge/mod.rs` — staged save uses
  `save_staticdata_doc`.
- `src-tauri/src/lib.rs` — the two renamed command registrations.
- Remove `load_staticdata` / `save_staticdata` (legacy-only helpers) once the
  merge no longer calls them — confirmed orphaned by grep.

### Frontend

- `src/commands.ts` — 2 command constants.
- `src/types.ts` — `StaticTitle` → `StaticAchievement`, `total_titles`.
- `src/stores/assetsState.svelte.ts` — `titles` array + both union types + switch arm.
- `src/lib/components/StaticDataBrowser.svelte` — derived array, `loadData`
  branch, `filteredTitles`, 4 switch arms, icon 🏅, hardcoded "Titles" label
  (replace with the i18n key).
- `src/lib/components/StaticDataFormModal.svelte` — payload branch, title
  switch arm, form field block.
- `src/lib/components/StaticDataModal.svelte` — switch arm + detail block.
- `src/lib/components/CategoryNav.svelte` — `selectTitles` handler + counter.
- `src/lib/pages/DatMergePage.svelte` — preview/result types, thresholds,
  category list, summary sums, **plus** the new `monsterClasses` category.
- `src/i18n.ts` — 3 keys × 5 languages.

## Checklist

- [x] Phase 1 — protos: `staticdata.proto` rename + `staticdata_new.proto` comment
- [x] Phase 2 — `parsers/staticdata.rs`: `detect_format` fix + stats rename + test
- [x] Phase 3 — `commands/io.rs`: getters/updaters/categories
- [x] Phase 4 — `state.rs`: staged doc type, drop legacy field
- [x] Phase 5 — `dat_merge/staticdata_merge.rs`: versioned merge + monster_classes
- [x] Phase 6 — `dat_merge/mod.rs`: staged save via doc
- [x] Phase 7 — `lib.rs`: command registration
- [x] Phase 8 — remove orphaned `load_staticdata` / `save_staticdata`
- [x] Phase 9 — frontend: `commands.ts`, `types.ts`, `assetsState.svelte.ts`
- [x] Phase 10 — frontend components: Browser, FormModal, Modal, CategoryNav
- [x] Phase 11 — `DatMergePage.svelte` incl. monster_classes
- [x] Phase 12 — `i18n.ts` (3 keys × 5 languages)
- [x] Validate: `cargo check` + `cargo test --lib` + `npx tsc --noEmit` + `cargo fmt`
- [x] No stub / TODO left; checklist zeroed

## Notes & decisions

- **Legacy field 2 is renamed, not remapped.** The legacy `Title` message has
  the exact same shape as the new `Achievement` (`id`/`name`/`description`/
  `grade`), so it was almost certainly always achievements. Only the *name*
  changes; field number 2 stays, so old files still decode byte-identically.
- **No Titles category is added** (user decision, backed by the exe evidence):
  character titles come from the server over the protocol and exist in no
  editable asset. Adding a UI for them would promise an edit the client ignores.
- **`detect_format` must not depend on one schema.** Fix is to reuse the
  loader's own dual-schema decode, so "we could read it raw" ⇒ "we write it
  raw". Detecting by magic bytes is not an option: Tibia's custom LZMA has no
  reliable magic (see `core/lzma`), so raw-vs-LZMA has to be decided by decode.
- **Merge requires matching schemas.** Merging a legacy custom file into an
  official 15.30 file (or vice-versa) is not a rename — the categories differ.
  Mismatch returns an explicit error instead of silently producing garbage.
