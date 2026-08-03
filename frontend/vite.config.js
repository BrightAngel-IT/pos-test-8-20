import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // This allows the service worker to run in 'npm run dev' mode!
      },
      workbox: {
        runtimeCaching: [{
          urlPattern: /http:\/\/.*\/api\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 3,
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 7
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }]
      },
      manifest: {
        name: "POS System",
      short_name: "POS",
      description: "Point of Sale System",
      theme_color: "#ffffff",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    }
  })],
  server: {
    port: 5173,
    strictPort: true,
  }
})
