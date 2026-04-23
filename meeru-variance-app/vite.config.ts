import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

// Relative base so paths work when the page is opened from file://
// viteSingleFile inlines all JS + CSS into dist/index.html so the resulting
// artifact is one self-contained HTML file — shareable, emailable, double-
// clickable, no server required.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 5173, open: true },
  build: {
    // Recommended settings for singlefile — keeps everything in one chunk
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
