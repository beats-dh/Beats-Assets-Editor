import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  // Build configuration
  build: {
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Source maps for debugging (disabled for smaller bundle)
    sourcemap: false,
    // Minify for production
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-opener'],
  },
  // Enable esbuild optimizations
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
  },
});
