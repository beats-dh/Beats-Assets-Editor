# Building

## Debug (dev)

Prereqs: Node.js 18+, Rust 1.90+, Tauri 2 prerequisites (MSVC build tools + WebView2 on Windows).

```bash
npm install

# Desktop app with hot-reload (Tauri + Vite)
npm run tauri dev
```

Frontend-only (optional):
```bash
npm run dev
```

## Production (release)

```bash
npm install

# Builds the desktop app (release bundle/installer)
npm run tauri build
```

Frontend-only build (optional):
```bash
npm run build
```
