import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project from /fretboard-visualizer/, so built asset
// URLs need that prefix. Dev keeps serving from the root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/fretboard-visualizer/' : '/',
  server: { port: 5180 },
}));
