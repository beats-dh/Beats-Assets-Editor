# Plan: parity-gap-datEditor

> Fecha o gap de paridade do **DatEditor moderno (Tibia 15.x)** entre o
> Beats-Assets-Editor (Rust/Tauri/Svelte) e o Assets Editor C#/WPF original.
> Escopo de produto decidido: **apenas Tibia 15.x / Canary** — formatos legados
> (OTB/OBD/.dat legado, Fase 4 do gap report) ficam **fora**.
> Origem: gap analysis 2026-06-21 (workflow `gap-analysis-assets-editor`) +
> scoping `scope-fase0-quickwins`. Segue `docs/claude/execution-protocol.md`.

## Goal

Implementar os quick wins de paridade do editor de aparências 15.x (Fase 0) e,
nas fases seguintes, a busca por flags (Fase 1), o pipeline de escrita de sprites
(Fase 2), a exportação de imagens (Fase 3) e a infra/UX residual (Fase 5).

## Repetitive-decision criteria

- **i18n:** toda string nova entra em `src/i18n.ts` nas 5 entradas
  (`default`, `pt-BR`, `en`, `es`, `ru`). i18n.ts é excluído da detecção de
  duplicação (`.sonarcloud.properties`) — manter assim.
- **Comando novo:** const em `src/commands.ts` → handler em `src-tauri/src/lib.rs`
  `generate_handler![]` → `pub use` no `commands/mod.rs` da feature →
  chamada via `src/utils/invoke.ts` (`invoke<T>(COMMANDS.X, args)`).
- **Rust:** `Result<T, String>`, `u32::try_from` (não `as`), `spawn_blocking`
  p/ I/O pesado, `core::fs_util::write_atomic` p/ salvar arquivo do usuário.
- **Svelte:** runes (`$state/$derived/$props`), `onclick`, stores `*.svelte.ts`.
- Backend antes do frontend quando o contrato IPC muda; registro (`mod.rs`/
  `lib.rs`) por último.

---

## Fase 0 — Quick wins do DatEditor (paridade 15.x)

### 0a — frontend-only / 1 comando simples (sem novas dependências) — ✅ FEITO

- [x] **palette-color-picker** — `AssetEditForm.svelte`: criado helper 8-bit
  correto (`utils/tibia8bit.ts`) + `Color8BitField.svelte` (light/automap NÃO são
  paleta de outfit — são cubo 6×6×6 8-bit). Substituídos os inputs crus.
- [x] **apply-all-frames** — `texture/TextureSettings.svelte` + `i18n.ts`: botão
  "Apply to all frames" que copia `duration_min/max` da fase 1 para todas.
- [x] **lens-help-types** — `AssetEditForm.svelte` + `i18n.ts`: `<select>` híbrido
  com 13 tipos (Ladders…Books) → `id = índice + 1100`, mantendo input+🔍.
- [x] **jump-to-id** — `services/assetService.ts` (`jumpToAppearanceId`) +
  `CategoryView.svelte` + `i18n.ts`: botão "Ir para ID" usando
  `find_appearance_position`, calcula página, navega + scroll/highlight.
- [x] **preview-zoom** — `texture/{TextureEditor,TexturePreview,TextureControls}.svelte`
  + `i18n.ts` + `styles/texture.css`: slider 0.5×–4× multiplicando a escala.
- [x] **randomize-outfit** — `monster-editor/cards/OutfitCard.svelte` +
  `npc-editor/cards/OutfitCard.svelte` + **`texture/TextureControls.svelte`**
  (preview de assets — o análogo real do DatEditor) + `i18n.ts`: botão 🎲.
- [x] **about-window** — `AboutDialog.svelte` (props, sem store) + `Header.svelte`
  (botão ℹ️) + `i18n.ts`. Nome/versão via `@tauri-apps/api/app` (`core:default`
  já cobre a permissão).
- [x] **other-tab** — comando `get_appearance_raw_dump` (Debug pretty do protobuf)
  em `query.rs` (+ `lib.rs` + `commands.ts`); `OtherTabView.svelte`; aba "Other"
  em `AssetDetailsModal.svelte` (não-Sounds) + tipo `activeTab` no store.

### 0b — comandos novos / dependências

- [x] **export-png** — comando `export_sprites_to_png(spriteIds, destinationDir)`
  em `sprites/commands/sprites.rs` (+ `lib.rs` + `commands.ts`);
  `importExportService.handleExportSprites` (open-directory dialog) + botão ⬇ em
  `texture/TextureSpriteList.svelte` + `onExport` em `texture/TextureEditor.svelte`.
  Reusa `resolve_sprite_bytes`/`to_png_bytes`.
- [x] **batch-duplicate** — `conversion.rs` (`remap_internal_references` — só
  remapeia object-ids reais: market trade_as/show_as + changedtoexpire) +
  `import_export.rs` (`duplicate_appearances_batch`, retorna pares (old,new)) +
  `lib.rs` + `commands.ts` + `importExportService.handleDuplicateBatch` +
  `CategoryView` (botão duplicar agora aceita multi-seleção).
- [x] **export-list** — `stores/exportQueueState.svelte.ts` +
  `ExportQueueModal.svelte` (frontend-only: reusa os comandos de export por item,
  loop na pasta escolhida — sem novo backend) +
  `importExportService.exportQueueToFolder` + badge 📤 em `Header.svelte` +
  botão "Adicionar à lista de export" em `AssetDetailsModal.svelte`.
- [x] **clipboard-copy** — instalado `tauri-plugin-clipboard-manager` (Cargo) +
  `@tauri-apps/plugin-clipboard-manager` (npm) + plugin em `lib.rs` + permissão
  `clipboard-manager:allow-write-text` em `capabilities/default.json`;
  `services/clipboardService.ts` (gera `<look type.../>`/`<item id.../>` + copia);
  botões 📋/`</>` em `AssetBasicInfo.svelte`.
- [x] **asset-version** — estendido `AppearanceStats` com `content_hash`
  (FNV-1a determinístico sobre counts+ids — protobuf 15.x não tem assinatura) em
  `parsers/appearances.rs`; `types.ts`; exibido como "Catalog v<hash8>" em
  `Header.svelte`. (Sem mexer em AppState — hash calculado no `get_statistics`.)

---

## Fases seguintes (do gap report — escopo 15.x/Canary)

- [x] **Fase 1 — Busca por flags (SearchWindow):** comando
  `search_appearances_by_flags` em `query.rs` (`get_bool_flag` espelha
  `set_bool_flag`; filtro AND + `animated_only`) + `FlagSearchPanel.svelte` +
  `flagFilter` no `assetsState` + roteamento em `assetService.loadAssetsData` +
  botão toggle no `CategoryView`. ✅
- [x] **Fase 3 — Exportação de imagens:** **PNG** do preview composto
  (`save_image_bytes` + `imageExportService.exportCanvasAsPng` + botão ⬇ PNG) e
  **GIF animado** (`gifenc` + `exportGif` no `TexturePreview` itera as fases,
  renderiza cada uma no canvas e codifica; `saveBytesToFile`). ✅
- [x] **Fase 5 — Infra/UX:** **Logger** (`stores/loggerState.svelte.ts` +
  `LoggerPanel.svelte` global + `showStatus` alimenta o log + 📜 no Header) e
  **Presets** (estende `settings/mod.rs` com `Preset`/`presets` + comandos
  get/save/delete/apply + `PresetsManager.svelte` no SettingsMenu; testes de
  round-trip/migração do settings.json). ✅
- [x] **Fase 2 — Pipeline de ESCRITA de sprites:** módulo
  `features/sprites/commands/image_import.rs`:
  (a) `import_image_as_tiles` (chroma-key magenta → `imported_sprites`) + botão
  🖼 no `TextureSpriteList` (importa e anexa ao frame group);
  (b) `compile_imported_sprites` (RGBA→BMP→LZMA→`.cwm` com header CIP + append no
  `catalog-content.json` + backup `.bak` + remap de refs).
  **Teste `sprite_sheet_roundtrip_through_loader` PASSA** (escreve sheet → lê de
  volta pelo `SpriteLoader` real → pixels+orientação idênticos), provando o
  formato. **RISCO RESIDUAL:** `compile_imported_sprites` sobrescreve o catálogo
  do jogo e ainda **não tem UI nem foi verificado com o cliente Tibia real** —
  validar no app antes de usar em assets de produção.

> **Fora de escopo (decisão de produto — só 15.x/Canary):** módulo Lua scripting+
> grafos (MoonSharp), Tibia <12 (`.dat`/`.spr` legado), OTB editor, OBD, OTML.
> Campos removidos do schema 15.x (transparency_level, hook_south/east,
> ShowCharges) não são deficit — são incompatibilidade de versão.

## Validate

- [ ] `cargo check --manifest-path src-tauri/Cargo.toml`
- [ ] `cargo test --manifest-path src-tauri/Cargo.toml --lib`
- [ ] `npx tsc --noEmit`
- [ ] `cargo fmt --manifest-path src-tauri/Cargo.toml`
- [ ] Sem stub/TODO; checklist do lote em curso zerado

## Notes & decisions

- Decisão do usuário (2026-06-21): foco **Tibia 15.x/Canary**; Fase 4 (legado)
  descartada.
- `randomize-outfit`: aplicar nos OutfitCard de monster **e** npc (mesma lógica).
- `other-tab`: dump em JSON `to_string_pretty` (mais portável que `{:#?}`).
- `asset-version`: hash de **conteúdo** (AHasher sobre os arrays), não assinatura
  de arquivo binário (protobuf não tem magic/version como o `.dat` legado).
