import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

export default defineConfig({
  server: {
    port: 8080,
    host: "0.0.0.0", // Expose to LAN so other devices can connect
    https: fs.existsSync(".cert/key.pem")
      ? {
          key: fs.readFileSync(".cert/key.pem"),
          cert: fs.readFileSync(".cert/cert.pem"),
        }
      : undefined,
    watch: {
      usePolling: true, // This stops the Node 23 / Apple Silicon freezing bug
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});