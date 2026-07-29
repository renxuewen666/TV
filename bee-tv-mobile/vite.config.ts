import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/m/',
  server: {
    host: '0.0.0.0',
    port: 5180,
    allowedHosts: ['.monkeycode-ai.online'],
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2015',
    cssTarget: 'chrome61',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler/')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          if (id.includes('node_modules/axios')) {
            return 'axios';
          }
          if (id.includes('node_modules/zustand')) {
            return 'zustand';
          }
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 300,
    assetsInlineLimit: 4096,
  },
});
