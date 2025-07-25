import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: path.resolve(__dirname, "../../"),
  server: {
    port: 3000,
  },
  preview: {
    port: 8080,
    host: true,
    allowedHosts: ["fe-production-5276.up.railway.app", "wordle.muroveinick.com"],
  },
  build: {
    outDir: "dist",
    minify: true,
  },
  resolve: {
    alias: {
      "@types": path.resolve(__dirname, "../../types"),
    },
  },
});
