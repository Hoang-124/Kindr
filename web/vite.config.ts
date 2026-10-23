import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-pitch-page',
      closeBundle() {
        try {
          const srcDir = path.resolve(__dirname, '../pitch-page');
          const destDir = path.resolve(__dirname, 'dist/pitch-page');
          if (fs.existsSync(srcDir)) {
            fs.cpSync(srcDir, destDir, { recursive: true });
          }
        } catch {
          // Ignore if pitch-page is absent in isolated build
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-net': ['axios', 'socket.io-client'],
        },
      },
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
