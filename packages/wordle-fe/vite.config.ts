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
    allowedHosts: ["wordle-fe-production.up.railway.app"],
  },
  build: {
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@types": path.resolve(__dirname, "../../types"),
    },
  },
});
