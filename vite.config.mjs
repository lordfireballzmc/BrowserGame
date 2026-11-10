import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// The same source builds for local '/' and a hosted GitHub Pages project path.
// Explicit multi-page inputs ensure the playable /tests/terrain-preview.html
// is actually compiled and published, not merely the landing page.
const base = process.env.BASTIONFALL_PUBLIC_BASE ?? "/";
if (!base.startsWith("/") || !base.endsWith("/") || base.includes("..")) {
  throw new Error("BASTIONFALL_PUBLIC_BASE must be an absolute directory path");
}
export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        terrain: fileURLToPath(new URL("./tests/terrain-preview.html", import.meta.url)),
      },
    },
  },
});
