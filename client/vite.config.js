import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { releaseAssets } from './scripts/release-config.mjs'

const projectDirectory = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  appType: 'mpa',
  base: './',
  preview: { headers: { 'Cache-Control': 'no-store' } },
  build: {
    assetsDir: releaseAssets,
    rollupOptions: {
      input: {
        index: resolve(projectDirectory, 'index.html'),
        lobby: resolve(projectDirectory, 'lobby.html'),
        games: resolve(projectDirectory, 'games.html'),
        tournaments: resolve(projectDirectory, 'tournaments.html'),
        events: resolve(projectDirectory, 'events.html'),
        store: resolve(projectDirectory, 'store.html'),
        profile: resolve(projectDirectory, 'profile.html'),
      },
    },
  },
})
