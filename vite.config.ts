import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build:
    mode === "web"
      ? { target: "es2020", outDir: "web/dist", emptyOutDir: true, chunkSizeWarningLimit: 4000 }
      : {
          target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
          minify: !process.env.TAURI_ENV_DEBUG,
          sourcemap: !!process.env.TAURI_ENV_DEBUG,
          chunkSizeWarningLimit: 4000,
        },
}));
