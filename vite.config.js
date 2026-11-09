import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { siteMetadataPlugin, previewOrigin } from "./scripts/site-metadata.mjs";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "SITE_");
  return {
    plugins: [react(), siteMetadataPlugin({
      siteUrl: process.env.SITE_URL || env.SITE_URL || previewOrigin,
      indexable: (process.env.SITE_INDEXABLE || env.SITE_INDEXABLE) === "true",
    })],
    build: { emptyOutDir: true },
    server: { allowedHosts: ["terminal.local"] },
  };
});
