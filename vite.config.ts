import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    open: false,
    watch: { ignored: ['**/data/raw/**', '**/dist/**'] },
  },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1600 },
});
