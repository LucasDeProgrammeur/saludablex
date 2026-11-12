import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces so code-server's port proxy can reach the dev server
    host: true,
    // Accept requests for any hostname (code-server proxy domains, LAN IPs, ...)
    allowedHosts: true,
    // Use the next free port if 5173 is taken instead of failing
    strictPort: false,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
