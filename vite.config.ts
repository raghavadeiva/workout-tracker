import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache every asset needed for a fully-offline first paint,
      // including the self-hosted fonts (public/fonts/) — without these the
      // Material Symbols icon font fails offline and icons render as raw
      // ligature text.
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'fonts/inter.css',
        'fonts/material-symbols.css',
        'fonts/*.woff2',
      ],
      manifest: {
        name: 'Hypertrophy',
        short_name: 'Hypertrophy',
        theme_color: '#F5F5F7',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})