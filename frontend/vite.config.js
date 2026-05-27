import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/players": "http://localhost:5000",
      "/games": "http://localhost:5000"
    }
  }
});
