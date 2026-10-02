# Tauri 2 — Backend Templates

## Entry point (Tauri 2: `run()` in `lib.rs`, thin `main.rs`)

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    app_lib::run(); // crate lib name; here the lib is the package lib
}
```

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(state::AppState::new())
        .invoke_handler(tauri::generate_handler![
            features::settings::get_settings,
            features::settings::update_settings,
            features::processing::process_batch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Shared state (this repo: `parking_lot` + `DashMap`, sync locks)

```rust
// src-tauri/src/state.rs
use parking_lot::RwLock;
use dashmap::DashMap;

pub struct AppState {
    pub settings: RwLock<Settings>,
    pub cache: DashMap<String, String>,
}

impl AppState {
    pub fn new() -> Self {
        Self { settings: RwLock::new(Settings::default()), cache: DashMap::new() }
    }
}
```

`parking_lot` locks are **synchronous** — so a command that only touches state
can be a plain `fn` (no `async`):

```rust
#[tauri::command]
pub fn get_settings(state: tauri::State<'_, AppState>) -> Result<Settings, String> {
    Ok(state.settings.read().clone()) // read()/write() are sync, no .await
}

#[tauri::command]
pub fn update_settings(new: Settings, state: tauri::State<'_, AppState>) -> Result<(), String> {
    *state.settings.write() = new;
    Ok(())
}
```

## Heavy I/O / CPU command (don't block the UI thread)

```rust
#[tauri::command]
pub async fn process_large_file(path: String) -> Result<ProcessResult, String> {
    tokio::task::spawn_blocking(move || {
        // heavy parsing / image work here
        Ok(ProcessResult { /* ... */ })
    })
    .await
    .map_err(|e| format!("task join error: {e}"))?
}
```

CPU-bound batches: use `rayon` (`par_iter`). Use `map` (not `filter_map`) when a
per-item failure must keep its slot, so indices stay aligned.

## Events (Rust → frontend) — Tauri 2 uses the `Emitter` trait

```rust
use tauri::{AppHandle, Emitter};
use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct ProgressPayload { pub current: usize, pub total: usize, pub message: String }

#[tauri::command]
pub async fn process_batch(items: Vec<String>, app: AppHandle) -> Result<(), String> {
    let total = items.len();
    for (i, item) in items.iter().enumerate() {
        // ... do work ...
        app.emit("batch-progress", ProgressPayload { current: i + 1, total, message: item.clone() })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

`emit` broadcasts; `emit_to(label, ...)` targets one window. (Tauri 1's
`emit_all` no longer exists.)

## Error handling

Repo default: commands return `Result<T, String>` and map errors:

```rust
let data = std::fs::read(&path).map_err(|e| format!("read {path}: {e}"))?;
```

For richer errors, a `thiserror` enum that serializes to a string is fine:

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("not found: {0}")] NotFound(String),
    #[error("invalid input: {0}")] Invalid(String),
}
impl serde::Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}
// #[tauri::command] -> Result<T, AppError>
```

## Atomic file writes (overwriting a user's file)

Never `fs::write` straight onto the destination — a mid-write crash truncates it.

```rust
crate::core::fs_util::write_atomic(std::path::Path::new(&path), bytes)
    .map_err(|e| format!("failed to write {path}: {e}"))?;
```

## Untrusted/external paths

Sanitize archive/catalog entry paths before joining (zip-slip): accept only
`std::path::Component::Normal`, reject absolute / `..` / prefix.

## Unit tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn settings_roundtrip() {
        let st = AppState::new();
        *st.settings.write() = Settings { theme: "light".into(), ..Default::default() };
        assert_eq!(st.settings.read().theme, "light");
    }
}
```

Run: `cargo test --manifest-path src-tauri/Cargo.toml --lib`.
