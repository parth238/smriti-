/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "manifest.json",
        "icons/icon.svg",
        "assets/games/*.png",
        "content-packs/assamese/cultural-media.json",
        "content-packs/english/cultural-media.json",
        "content-packs/manipuri/cultural-media.json",
      ],
      manifest: {
        name: "Smriti",
        short_name: "Smriti",
        start_url: "/",
        display: "standalone",
        background_color: "#FBF9F4",
        theme_color: "#A8342A",
        lang: "en",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/uploads/") || url.pathname.startsWith("/media/"),
            handler: "CacheFirst",
            options: {
              cacheName: "smriti-family-photos",
              expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "smriti-pages",
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "worker",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "smriti-assets",
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
  },
});
