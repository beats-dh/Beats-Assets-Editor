---
name: rust-tauri-svelte
description: Padrões e templates ATUAIS para este app desktop — Tauri 2 + Svelte 5 (runes) + TypeScript, backend Rust. Use ao criar/editar comandos Tauri, eventos, estado (AppState), stores Svelte, ou qualquer ponte Rust↔frontend. Substitui a skill bundlada anthropic-skills:rust-tauri-svelte, que é de Tauri 1 / Svelte 4 (desatualizada).
---

# Rust + Tauri 2 + Svelte 5 (this repo)

> Versões reais: **Tauri 2**, **Svelte 5 (runes)**, **TypeScript strict**, Rust 2021.
> Regras do projeto e armadilhas específicas: ver [AGENTS.md](../../../AGENTS.md).

## Quando usar

- Criar/editar comandos Tauri, eventos, ou `AppState`.
- Stores Svelte / estado compartilhado no frontend.
- Qualquer integração Rust ↔ frontend (invoke, eventos, diálogos).

## Princípios

- **Rust**: `Result<T, E>` + `?`; sem `unsafe` sem justificativa em comentário;
  conversões checadas (`u32::try_from`) em entrada externa (nunca `as` que
  trunca/faz wrap silencioso).
- **Tauri**: comando `async` para I/O ou CPU pesado (use `spawn_blocking`);
  `State<'_, AppState>` para estado; eventos para empurrar Rust → frontend.
- **Svelte 5**: **runes** (`$state` / `$derived` / `$props` / `$effect`), stores
  em `*.svelte.ts`, tipos **TypeScript** reais (não JSDoc), `onclick` (não
  `on:click`), `$props()` (não `export let`).

## ⚠️ APIs corretas (a skill bundlada está ERRADA nestes pontos — Tauri 1)

| ❌ Antigo (Tauri 1 / Svelte 4) | ✅ Atual (este repo) |
|---|---|
| `@tauri-apps/api/tauri` (invoke) | `@tauri-apps/api/core` |
| `@tauri-apps/api/dialog` | plugin `@tauri-apps/plugin-dialog` |
| `app.emit_all(...)` | `app.emit(...)` (trait `tauri::Emitter`) |
| `app.get_window(...)` | `app.get_webview_window(...)` |
| `tauri.conf.json` → `allowlist` | **capabilities** (`src-tauri/capabilities/*.json`) |
| `generate_handler!` em `main.rs` | em `lib.rs` `run()` (mobile-ready) |
| stores `.js` + JSDoc | `*.svelte.ts` + runes + TS |

## Arquitetura deste repo (feature-based)

- **Backend**: `src-tauri/src/features/<domínio>/{parsers,commands}`; estado
  global em `state.rs` (`AppState` com `parking_lot::RwLock` + `DashMap` /
  `LRUCache`, não `tokio::RwLock`). Comandos registrados em `lib.rs`.
- **Frontend**: `src/lib/pages`, `src/lib/components`, `src/stores/*.svelte.ts`,
  `src/services`; chamadas via wrapper `src/utils/invoke.ts` com nomes de
  comando de `src/commands.ts` (`CommandName`).

## Templates (carregar sob demanda)

- [Tauri 2 — commands, state, events, errors, atomic writes](references/tauri-backend.md)
- [Svelte 5 — runes, stores, invoke wrapper, eventos, diálogos](references/svelte5-frontend.md)
- [Config — Cargo.toml, capabilities, tauri.conf.json](references/config.md)

## Checklist de validação

```
[RUST / TAURI 2]
□ Result<T, E> + ? (sem unwrap em comando)?
□ try_from (não `as`) para inteiros vindos de I/O/JSON/Lua?
□ async + spawn_blocking para trabalho pesado?
□ Estado via State<'_, AppState> (parking_lot/DashMap)?
□ Comando registrado em lib.rs generate_handler!?
□ Eventos com trait Emitter (app.emit), payload Serialize?
□ Escrita "sobre arquivo do usuário" usa core::fs_util::write_atomic?

[SVELTE 5 / TS]
□ invoke via src/utils/invoke.ts (import de @tauri-apps/api/core)?
□ Runes ($state/$derived/$props), store em *.svelte.ts?
□ $effect com cleanup (return) para listeners de evento?
□ tsc --noEmit limpo?

[ARQUITETURA]
□ Lógica no módulo de feature certo (parsers vs commands)?
□ Sem APIs de Tauri 1 (allowlist, /api/tauri, emit_all)?
```
