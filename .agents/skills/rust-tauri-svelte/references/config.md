# Config — Cargo.toml, Capabilities, tauri.conf.json (Tauri 2)

## Cargo.toml (dependencies)

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
tauri-plugin-opener = "2"

serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }

# performance / concurrency (this repo)
parking_lot = "0.12"   # faster sync locks than std
dashmap = "6"          # lock-free concurrent map
rayon = "1"            # data parallelism

anyhow = "1"
thiserror = "2"

[build-dependencies]
tauri-build = { version = "2", features = [] }
# this repo also: prost-build + protoc-bin-vendored (compiles .proto in build.rs)
```

## Capabilities — Tauri 2 replaces v1 `allowlist`

Tauri 2 has **no `allowlist`**. Permissions are granular ACL files under
`src-tauri/capabilities/`, referenced by window label.

```json
// src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "opener:default"
  ]
}
```

Add specific permissions as needed (e.g. `core:window:allow-close`,
`dialog:allow-open`, `dialog:allow-save`). Each plugin ships its own permission
set; enabling a plugin in `lib.rs` (`.plugin(tauri_plugin_dialog::init())`) is
necessary but not sufficient — the capability must also grant it.

## tauri.conf.json (Tauri 2 shape)

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "App Name",
  "version": "0.1.0",
  "identifier": "com.example.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      { "title": "App Name", "width": 1200, "height": 800, "resizable": true }
    ],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"]
  }
}
```

Key v1 → v2 config differences:
- top-level `app` (windows, security) instead of `tauri`.
- `allowlist` removed → capabilities.
- `build` keys renamed (`frontendDist`, `devUrl`, `beforeDevCommand`).

## Frontend deps (package.json)

```jsonc
{
  "dependencies": {
    "@sveltejs/vite-plugin-svelte": "^6",
    "svelte": "^5",
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-dialog": "^2",
    "@tauri-apps/plugin-opener": "^2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "typescript": "~5.6",
    "vite": "^6"
  }
}
```

## Release profile note

A `[profile.release]` with `lto = "fat"` + `codegen-units = 1` (this repo)
produces a smaller/faster binary but **slow** release builds — the final LTO/link
step can't be cached. Fine for infrequent release builds; for fast CI prefer
debug (`tauri build --debug`) or `--no-bundle` to skip packaging.
