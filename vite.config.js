import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/hydro-remind/',

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'HydroRemind',
        short_name: 'HydroRemind',
        description: 'Your personal water reminder and hydration tracker.',
        theme_color: '#0ea5e9',
        background_color: '#071a2b',
        display: 'standalone',
        start_url: '/hydro-remind/',
        scope: '/hydro-remind/',

        icons: [
          {
            src: '/hydro-remind/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/hydro-remind/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})