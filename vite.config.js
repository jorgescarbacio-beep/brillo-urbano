import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      devOptions: {
        enabled: false // 🔥 MUY IMPORTANTE (evita bugs en dev)
      },

      manifest: {
        name: 'Brillo Urbano App',
        short_name: 'Brillo Urbano',
        description: 'Gestión de servicios gastronómicos',
        theme_color: '#00c27a',
        background_color: '#0f1115',
        display: 'standalone',
        start_url: '/',
        scope: '/',

        icons: [
          {
            src: '/logo-brillo-urbano.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-brillo-urbano.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache'
            }
          }
        ]
      }
    })
  ]
})