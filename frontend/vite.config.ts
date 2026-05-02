import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Bosun's backend runs at http://localhost:3000.
// Both REST and Socket.io traffic are proxied so the SPA can stay on its own port
// while still talking to the API and WS server with same-origin cookies.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        // Hard-split admin into its own bundle. The lazy import in App.tsx
        // produces an admin chunk too — this manualChunks rule guarantees
        // the split survives even if other code accidentally references admin.
        manualChunks(id) {
          if (id.includes('/src/admin/')) {
            return 'admin';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
  },
});
