import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
const buildNumber = process.env.GITHUB_RUN_NUMBER ?? '';
const commitSha = (process.env.GITHUB_SHA ?? '').slice(0, 7);

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(buildNumber),
    __APP_COMMIT__: JSON.stringify(commitSha),
    __APP_BUILT_AT__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 5173,
    open: false,
    watch: { ignored: ['**/data/raw/**', '**/dist/**'] },
  },
  build: {
    outDir: 'dist',
    // Never publish source maps: the shipped bundle must not expose source files.
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['echarts', 'echarts-for-react'],
          'vendor-map': ['leaflet', 'leaflet.markercluster'],
          'vendor-ui': ['lucide-react', 'clsx', 'zustand'],
        },
      },
    },
  },
});
