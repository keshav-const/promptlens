import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';
import path from 'path';

function movePopupHtml(): Plugin {
  return {
    name: 'move-popup-html',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const srcHtml = resolve(distDir, 'src/popup/index.html');
      const destHtml = resolve(distDir, 'popup.html');
      
      if (fs.existsSync(srcHtml)) {
        fs.renameSync(srcHtml, destHtml);
        
        const srcPopupDir = resolve(distDir, 'src/popup');
        const srcDir = resolve(distDir, 'src');
        
        try {
          if (fs.existsSync(srcPopupDir)) fs.rmdirSync(srcPopupDir);
          if (fs.existsSync(srcDir)) fs.rmdirSync(srcDir);
        } catch (err) {
          console.log('Note: Could not remove empty src directory');
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.'
        },
        {
          src: 'public/icons',
          dest: '.'
        }
      ]
    }),
    movePopupHtml()
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
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        contentScript: resolve(__dirname, 'src/content/contentScriptNew.tsx')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;
          if (facadeModuleId?.includes('background')) {
            return 'background.js';
          }
          if (facadeModuleId?.includes('contentScript')) {
            return 'contentScript.js';
          }
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    sourcemap: process.env.NODE_ENV === 'development'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
});
