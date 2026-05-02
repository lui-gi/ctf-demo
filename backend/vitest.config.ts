import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
    // vitest+vite handles `.js` → `.ts` rewrites for our NodeNext source layout.
  },
  resolve: {
    // Some downstream tooling needs this for ESM `.js` import specifiers in TS files.
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
});

