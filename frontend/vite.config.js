import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/data/**']
    },
    proxy: {
      '/alerts': 'http://localhost:3000',
      '/monitor': 'http://localhost:3000',
      '/health': 'http://localhost:3000'
    }
  },
  preview: {
    host: true,
    port: 5173,
    proxy: {
      '/alerts': 'http://localhost:3000',
      '/monitor': 'http://localhost:3000',
      '/health': 'http://localhost:3000'
    }
  }
});
