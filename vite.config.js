import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // Base path for GitHub Pages - replace 'door' with your repository name
  base: process.env.NODE_ENV === "production" ? "/threejs-escaperoom/" : "/",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Generate source maps for debugging
    sourcemap: true,
  },

  server: {
    // Enable CORS for development
    cors: true,
  },

  // Ensure public assets are properly served
  publicDir: "public",
});
