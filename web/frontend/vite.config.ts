import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Requests to /api go to the Python server (web/server.py).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
});
