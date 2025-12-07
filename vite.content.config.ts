import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { getOutDir } from "./viteEnv";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  },

  optimizeDeps: {
    include: ["webextension-polyfill"]
  },

  build: {
    outDir: getOutDir(),
    emptyOutDir: false,
    minify: false,
    sourcemap: true,

    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/index.ts")
      },
      output: {
        format: "iife",
        entryFileNames: "assets/[name].js"
      }
    }
  }
});
