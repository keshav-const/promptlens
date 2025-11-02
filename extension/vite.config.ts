import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: resolve(__dirname, 'public/manifest.json'),
      assets: resolve(__dirname, 'public')
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/background': resolve(__dirname, './src/background'),
      '@/content': resolve(__dirname, './src/content'),
      '@/popup': resolve(__dirname, './src/popup'),
      '@/utils': resolve(__dirname, './src/utils')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
});
