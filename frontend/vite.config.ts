import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Bosun's backend runs at http://127.0.0.1:4000 (PORT default in backend/src/config/env.ts).
// Both REST and Socket.io traffic are proxied so the SPA can stay on its own port
// while still talking to the API and WS server with same-origin cookies.
// NOTE: target uses 127.0.0.1 (not `localhost`) because the backend binds 0.0.0.0
// (IPv4 only) — `localhost` resolves to IPv6 [::1] first on Windows and the
// proxy connect would fail.
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
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:4000',
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
