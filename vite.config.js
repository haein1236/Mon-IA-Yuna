import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // met à jour l'app automatiquement en arrière-plan
      manifest: {
        name: 'Yuna - Ta pote IA',
        short_name: 'Yuna',
        description: 'Ton IA compagnon qui papote, envoie des images et se souvient de toi',
        theme_color: '#3E2723',      // couleur de la barre système sur mobile
        background_color: '#FFF8F5', // couleur de l'écran de démarrage (splash)
        display: 'standalone',       // plein écran, sans barre de navigateur
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Met en cache les fichiers de l'app pour qu'elle s'ouvre même
        // avec une connexion instable (mais Gemini a toujours besoin d'internet)
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'supabase'
            }

            if (id.includes('react')) {
              return 'vendor'
            }
          }
        },
      },
    },
  },
})