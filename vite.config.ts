import { defineConfig } from "vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({

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
  // ✅ OPTIMIZED: Code splitting configuration
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-tauri': ['@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-opener'],
          
          // Feature chunks (lazy loaded)
          'monster-editor': ['./src/monsterEditor.ts'],
          'sound-editor': ['./src/sounds.ts'],
          'npc-editor': ['./src/npcEditor.ts'],
          
          // Animation workers
          'workers': [
            './src/workers/animationWorker.ts',
            './src/workers/imageBitmapWorker.ts',
            './src/workers/outfitComposeWorker.ts'
          ],
        },
        // ✅ OPTIMIZED: Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify for production
    minify: 'esbuild',
    // Source maps for debugging (disabled for smaller bundle)
    sourcemap: false,
    // ✅ OPTIMIZED: Target modern browsers for smaller bundle
    target: 'es2020',
    // ✅ OPTIMIZED: Enable tree shaking
    modulePreload: {
      polyfill: false,
    },
  },
  // ✅ OPTIMIZED: Optimize dependencies
  optimizeDeps: {
    include: ['@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-opener'],
  },
  // ✅ OPTIMIZED: Enable esbuild optimizations
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
  },
});
