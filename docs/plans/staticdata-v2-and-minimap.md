# StaticData (new schema) dual-version + Minimap markers

Newer client (`D:\Tibia\packages\TibiaExternal`) ships a **different, wire-incompatible**
`staticdata.dat` schema and a new `minimap.proto`. Goal: read the new schema
correctly **and** keep reading the old one (don't break older clients), plus
parse minimap markers and surface both in the frontend.

## Key facts (verified by wire-decode of the real staticdata.dat)

The real `staticdata-ff2a9cf….dat` (identical in both client folders) is the
**new** schema. The repo's current schema mislabels it (achievements shown as
houses, houses as bosses, bosses as quests, quests dropped). Field-number map:

| field | OLD (repo) | NEW (client) |
|---|---|---|
| 1 | creatures (CreatureType) | monsters (Monster) — same shape |
| 2 | titles (Title) | monster_classes (MonsterClass) — NEW |
| 3 | houses (HouseData) | achievements (Achievement) |
| 4 | bosses (BossData) | houses (House) — beds/size swapped vs HouseData |
| 5 | quests (QuestData) | bosses (BossMonster) |
| 6 | — | quests (Quest) |

Other protos: `appearances` (only bytes→string — keep `bytes`), `sounds`
(oneof grouping — wire-compatible), `staticmapdata` (renames only — wire-compatible),
`map`/`shared`/`sounds-common` (identical). → **no changes needed for those.**
`protocol.proto` (network) is out of scope.

## Phases / files (exhaustive)

### Phase 1 — backend schema + version detection  ✅ DONE (validated vs real file)
- [x] `src-tauri/protobuf/staticdata_new.proto` (package `tibia.protobuf.staticdata_new`)
- [x] `src-tauri/build.rs` — add to compile list
- [x] `src-tauri/src/core/protobuf/mod.rs` — add `staticdata_new` module
- [x] `src-tauri/src/features/staticdata/parsers/staticdata.rs` — `StaticDataDoc` enum + round-trip detection; `doc_statistics`; `save_staticdata_doc`
- [x] env-gated test: real file → NEW schema (833 monsters, 21 monster_classes, 362 achievements, 995 houses, 447 bosses, 101 quests)

### Phase 2 — backend state + commands  ✅ DONE (cargo check + tsc clean)
- [x] `src-tauri/src/state.rs` — added `staticdata_doc` (kept legacy `staticdata` for DAT-merge)
- [x] `src-tauri/src/features/staticdata/commands/io.rs` — version-aware load/getters/updaters/save/remove; JSON getters; `get_staticdata_monster_classes` + `update_staticdata_monster_class`
- [x] `src-tauri/src/lib.rs` — registered new commands
- [x] `src/commands.ts` — new command names
- [~] `dat_merge` left on the legacy schema (unchanged — no regression; new-schema merge is a follow-up)

### Phase 3 — staticdata frontend  ✅ DONE (tsc clean)
- [x] `src/types.ts` — `StaticDataStats` += `version`, `total_monster_classes`; add `StaticMonsterClass`
- [x] `src/stores/assetsState.svelte.ts` — `monsterClasses` + union `'monster_classes'`
- [x] `src/lib/components/CategoryNav.svelte` — monster_classes card (shown when count > 0)
- [x] `src/i18n.ts` — `category.monsterClassesCount` (4 langs)
- [x] `src/lib/components/StaticDataBrowser.svelte` + `StaticDataModal` — monster_classes category (list/create/edit/delete)
- [~] Titles→Achievements relabel deferred (data is correct; legacy label only — avoids 4-lang i18n churn)
- [ ] `src/lib/components/StaticDataBrowser.svelte` (+ modals) — render new categories; behave for both versions
- [ ] verify `npx tsc --noEmit`

### Phase 4 — minimap  ✅ DONE (cargo test + tsc clean)
- [x] `src-tauri/protobuf/minimap.proto` (package `tibia.protobuf.minimap`) + build.rs + mod.rs
- [x] `src-tauri/src/features/minimap/` — markers parser (raw + LZMA fallback) + tile list/decode commands; roundtrip test
- [x] `src-tauri/src/lib.rs` + `src/commands.ts` — 5 commands registered
- [x] frontend: `MinimapBrowser.svelte` (Markers tab: table/reload/open-file; Map tab: floor selector + canvas render of tiles) + CategoryNav entry + viewMode + i18n
- [~] No real `minimapmarkers.bin` in client → synthetic test file generated in scratchpad; map stitching geometry needs a visual check in-app

### Phase 4b — OTClient `.otmm` minimap  ✅ DONE (rendered vs real file)
The user's real explored minimap is OTClient's `.otmm` (`%APPDATA%/IglaOTS/minimap/minimap.otmm`), not the Tibia-client tiles. Format reversed:
`"OTMM"` + u16 data_start(=22) + u16 ver + u32 flags + (u16 len + desc) + blocks
`[u16 x][u16 y][u8 z][u16 clen][zlib]` → 64×64 tiles × 3 bytes `[flags][color][speed]`;
`color` = 8-bit 6×6×6 cube (255 = unseen); 1 map tile = 1 px; 16 floors.
- [x] `src-tauri/src/features/minimap/parsers/otmm.rs` — index parse + `color_from_8bit` + `render_floor` (server-side PNG, downscaled to fit); env-gated test renders the real file (11931 blocks, 16 floors)
- [x] commands `minimap_otmm_info`, `minimap_render_otmm` (PNG→base64, on blocking pool) + lib.rs + commands.ts. Render bounds use the floor's MAIN cluster (gap-based) so stray outlier blocks don't shrink the map to dots.
- [x] `MinimapBrowser` Map tab: source toggle (OTClient .otmm ⟷ client tiles), manual "Open .otmm" (no hardcoded OTC path), floor buttons, PNG view


## Done = checklist zeroed, `cargo check` + `cargo test --lib` + `npx tsc --noEmit` clean.
