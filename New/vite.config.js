import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: './',
  assetsInclude: ['**/*.proto'],
  resolve: {
    alias: {
      // Browser builds should not bundle protobufjs' eval-based Node module probe.
      '@protobufjs/inquire': fileURLToPath(new URL('./src/proto/protobufInquireBrowser.cjs', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
});
