import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: path.resolve(__dirname, "../../"),
  build: {
    target: "node18",
    lib: {
      entry: "server.ts",
      formats: ["es"],
      fileName: "server",
    },
    outDir: "dist",
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "http",
        "https",
        "url",
        "util",
        "crypto",
        "events",
        "stream",
        "os",
        "buffer",
        "querystring",
        "zlib",
        "net",
        "tls",
        "dns",
        "cluster",
        "child_process",
        // Dependencies that should be external
        "express",
        "socket.io",
        "mongoose",
        "cors",
        "dotenv",
        "bcrypt",
        "helmet",
        "jsonwebtoken",
        "morgan",
        "winston",
      ],
    },
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@types": path.resolve(__dirname, "../../types"),
    },
  },
});