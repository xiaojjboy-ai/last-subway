import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
  },
});