import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getOutDir } from "./viteEnv";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: "public",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    outDir: getOutDir(),
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, "src/background/index.ts"),
      output: {
        format: "es",
        entryFileNames: "background.js"
      },
    },
  },
});