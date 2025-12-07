import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        { src: "manifest.json", dest: "." }, 
        { src: "all_cargo_combined.json", dest: "./assets" }
      ]
    })
  ],
  publicDir: "public",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },

  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: "popup.html",
        options: "options.html"
      },
      output: {
        entryFileNames: (chunk) => {
          return "assets/[name].js";
        },
        assetFileNames: "assets/[name][extname]",
      },
    }
  }
});
