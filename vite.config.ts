import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    ws: host
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
    rolldownOptions: {
      // ✅ OPTIMIZED: Enable tree shaking (was `esbuild.treeShaking`)
      treeshake: true,
      output: {
        // Rolldown dropped the object form of `manualChunks`; `codeSplitting.groups` is its replacement
        codeSplitting: {
          groups: [
            // Vendor chunks
            {
              name: 'vendor-tauri',
              test: /[\\/]node_modules[\\/]@tauri-apps[\\/](api|plugin-dialog|plugin-opener)[\\/]/,
            },

            // Animation workers
            {
              name: 'workers',
              test: /[\\/]src[\\/]workers[\\/](animationWorker|imageBitmapWorker|outfitComposeWorker)\.ts$/,
            },
          ],
        },
        // ✅ OPTIMIZED: Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // ✅ OPTIMIZED: Strip legal comments (was `esbuild.legalComments: 'none'`)
        comments: {
          legal: false,
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify for production
    minify: 'oxc',
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
});
