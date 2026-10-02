# AGENTS.md

This file guides Codex (Codex.ai/code) when working in this repository.

**Canary Studio Editor** — desktop editor for Tibia 15.x assets/server data.
Backend: **Rust + Tauri 2**. Frontend: **Svelte 5 + TypeScript + Vite 6**.

## Mandatory Rules

- Always respond in **PT-BR**, regardless of the language of the question.
- Always use the project **`rust-tauri-svelte`** skill
  ([`.Codex/skills/rust-tauri-svelte/`](.Codex/skills/rust-tauri-svelte/SKILL.md))
  when working with Rust/Tauri/Svelte code. It targets **Tauri 2 + Svelte 5 +
  TS** (this repo's stack). Prefer it over the bundled
  `anthropic-skills:rust-tauri-svelte`, which is Tauri 1 / Svelte 4 and outdated.
- **Validate your changes, but don't launch the app or heavy builds unprompted.**
  Use `cargo check`, `cargo test --lib` and `npx tsc --noEmit` to verify edits.
  Don't run `npm run tauri dev`/`build` (full app / release bundle) without an
  explicit request — release builds are slow (`lto = "fat"`).
- **Multi-file tasks: don't stop in the middle.** Follow the full protocol in
  [`docs/Codex/execution-protocol.md`](docs/Codex/execution-protocol.md).
  Executive summary: before the first edit, gather the **exhaustive** list of
  affected files (grep) + repetitive-decision criteria + topological order, in
  `TaskCreate` **and** in a `docs/plans/<name>.md` `- [ ]` checklist. Scope size
  is never a reason to stop; forbidden escape-hatch phrases ("the rest follows
  the same pattern", "applied to the main ones"). Done = all sites changed,
  compiles, no stub/TODO, checklist zeroed.
- **NEVER use `git reset --hard` to undo commits.** It silently wipes
  uncommitted work in the working tree. To undo commits use `git revert <sha>`.
  If a destructive reset is truly needed, ask for explicit confirmation first.
- Branch from `main` (the PR base). Do feature work on a branch; don't commit
  straight to `main`.

## Build, Dev & Validation Commands

Requirements: **Node.js 18+**, **Rust 1.77+** (Tauri 2), and the Tauri OS
prerequisites (on Windows: MSVC Build Tools + WebView2). `protoc` is vendored
via `protoc-bin-vendored` — no system install needed.

```bash
npm install                 # frontend deps
npm run tauri dev           # run the full app (Tauri + Vite)  [ask before running]
npm run dev                 # frontend only (Vite, port 1420)
npm run build               # tsc + vite build (frontend)
npm run tauri build         # production bundle  [slow; ask before running]
```

Validation (run these after editing — cheap and safe):

```bash
# Rust (run from src-tauri/ or with --manifest-path)
cargo check --manifest-path src-tauri/Cargo.toml
cargo test  --manifest-path src-tauri/Cargo.toml --lib    # unit tests
cargo fmt   --manifest-path src-tauri/Cargo.toml          # rustfmt (see rustfmt.toml)

# Frontend
npx tsc --noEmit            # type-check (does not emit)
```

`build.rs` compiles the `.proto` files via prost; `cargo check` triggers it.

## Project Structure

```
src/                         # Frontend (Svelte 5 + TS)
  App.svelte                 # root, routes between pages
  main.ts                    # entry (mounts the app)
  i18n.ts                    # i18n (PT-BR/EN/ES/RU)
  commands.ts                # Tauri command names (CommandName union)
  lib/pages/                 # screens: Launcher, AssetEditorLayout,
                             #   MonsterEditorPage, NpcEditorPage,
                             #   ProficiencyEditorPage, DatMergePage
  lib/components/            # Svelte components (incl. QmTranslationEditor,
                             #   RccBrowser, StaticData*, asset-details/,
                             #   monster-editor/, npc-editor/)
  stores/*.svelte.ts         # reactive state (Svelte 5 runes)
  services/                  # backend-calling layer (assetService, ...)
  utils/                     # invoke wrapper, caches, perf, workers helpers
  workers/                   # web workers (image decode, outfit compose)
  styles/                    # modular CSS (main.css imports the rest)

src-tauri/                   # Backend (Rust)
  src/lib.rs                 # Tauri builder + generate_handler![...] (all commands)
  src/state.rs               # global AppState (LRU caches, loaders)
  src/core/                  # cache, errors, validation, lua, fs_util, lzma, protobuf
  src/features/<domain>/     # one module per domain (see below), each with
                             #   parsers/ and commands/ (Tauri commands)
  protobuf/                  # .proto schemas (compiled by build.rs)

data/utils_definitions.hpp   # vendored Canary header — READ AS TEXT to extract
                             #   enums; NOT compiled. Don't treat as project C++.
```

Backend feature modules (`src-tauri/src/features/`): `appearances`, `sprites`,
`sounds`, `monsters`, `npcs`, `qm`, `rcc`, `staticdata`, `staticmapdata`,
`dat_merge`, `proficiency`, `settings`.

## Architecture

- **IPC**: every backend command is registered in `lib.rs` `generate_handler![]`.
  The frontend calls them through the type-safe wrapper `src/utils/invoke.ts`
  (`invoke<T>(name, args)`), with command names from `src/commands.ts`.
- **State**: `AppState` (`state.rs`) holds the loaded data + `LRUCache`s
  (`core/cache.rs`, DashMap-based). Clear derived caches when swapping a catalog.
- A feature = `parsers/` (file format ↔ structs) + `commands/` (Tauri commands).

## Coding Conventions

### Rust (edition 2021)
- Format with **`cargo fmt`** — config in [`src-tauri/rustfmt.toml`](src-tauri/rustfmt.toml):
  `max_width = 200`, 4 spaces (no hard tabs), Unix newlines, **imports preserved**
  (not reordered/grouped), same-line braces.
- Tauri commands return `Result<T, String>`; map errors with `.map_err(|e| format!(...))`.
- Prefer checked conversions (`u32::try_from`) over `as` on parsed/external input.
- Use `anyhow::Result` internally; `thiserror`/`AppError` for structured errors.

### TypeScript / Svelte (strict, ES2020)
- `tsconfig.json` is `strict`; keep `npx tsc --noEmit` clean.
- Svelte 5 runes; reactive stores live in `stores/*.svelte.ts`.
- Lint-clean style (SonarCloud): prefer `globalThis` over `window`/`self`,
  `Number.parseInt`/`Number.isNaN`, `??`/`??=`, `element.dataset`, and
  `textContent`/`createElement` over `innerHTML` (XSS-safe).

## Project-Specific Gotchas (read before "fixing" these)

- **Protobuf bare imports are correct.** `.proto` files use `import "shared.proto"`
  (no path). `build.rs` sets `src-tauri/protobuf/` as the include root, so prost
  resolves them. Standalone linters (buf) report "file does not exist" — that's a
  **false positive**; do not rewrite the import paths.
- **Bestiary `race`/`bossRace` are unquoted Lua constants** (`BESTY_RACE_*`), NOT
  strings. The monster Lua generator must emit them **without quotes**; the parser
  uses `extract_identifier_or_string_from_section`. (Top-level `monster.race` IS a
  quoted string — different field.)
- **Escape free text going into Lua** with `core::lua::escape_lua_string` (names,
  descriptions, voices, messages, item names) in the monster/NPC generators.
- **staticdata save preserves on-disk compression.** `save_staticdata` detects the
  existing file's format (raw / XZ / LZMA) and writes it back the same way — never
  rewrite a compressed `.dat` as raw protobuf.
- **Monster/NPC files are written atomically** via `core::fs_util::write_atomic`
  (temp + rename). Use it for any "overwrite the user's file" save.
- **Lua section parsing**: an *absent* section defaults silently; a *present but
  structurally broken* section returns an error. Missing individual fields default
  per-field (don't discard the whole section).
- **AEC export** writes sprite bytes to a companion `<path>.aec.sprites`; the
  importer reads it back. Keep both in sync.

## Git & Commits

- **Conventional Commits**, messages/PR titles in **English**:
  `<type>(<scope>): <imperative, lowercase, ≤72 chars>`.
  Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`,
  `chore`, `style`, `revert`. Body explains the WHY (skip on trivial commits).
- **Commits without co-author** (no `Co-Authored-By` footer).
- Commit/push only when asked. Keep the working tree green (`cargo check` + `tsc`).

## CI (GitHub Actions + cloud checks)

- `build-debug.yml` — runs on **pull_request** + dispatch only (no `push`
  trigger, to avoid duplicate builds); PR builds use `--no-bundle`. apt + Rust
  caches enabled.
- `build-release.yml` — full bundle on push to `main`.
- `rustfmt.yml` — auto-formats on PR.
- All three use a per-PR `concurrency` group (cancels superseded runs) and pin
  third-party actions to a **full commit SHA** (SonarCloud flags unpinned ones).
- **SonarCloud** quality gate must pass: 0 security hotspots, ≤3% duplication on
  new code. `i18n.ts` (parallel translation tables) is excluded from duplication
  detection in [`.sonarcloud.properties`](.sonarcloud.properties) — keep it there.
- CodeRabbit / CodeQL also review PRs; address or justify their findings.

## Plans

Active plans live in [`docs/plans/`](docs/plans/): one `.md` per plan, each with
a `- [ ]` checklist of phases/files. Files named `_*.md` are templates/drafts.

- To start a plan, copy [`docs/plans/_template.md`](docs/plans/_template.md) and
  follow [`docs/Codex/execution-protocol.md`](docs/Codex/execution-protocol.md).
- A plan lists the **exhaustive** set of affected files (from grep) and the
  order, so the work can't silently stop "in the middle".
- Done only when the checklist is zeroed and validation passes (`cargo check` +
  `cargo test --lib` + `npx tsc --noEmit`).

## License

CC BY-NC-SA 4.0 (see [LICENSE](LICENSE)). Non-commercial; attribution required.
