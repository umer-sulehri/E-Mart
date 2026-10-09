import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // The suite is pure Node unit tests over `lib/` logic. No component tests
    // exist, so no jsdom/happy-dom environment is required (and none is
    // installed — adding one would be a new dependency for no current gain).
    environment: 'node',
    include: ['lib/__tests__/**/*.test.ts'],
  },
  resolve: {
    // Mirrors the `@/*` -> `./*` path alias in tsconfig.json so tests can
    // import application modules by the same specifier the app uses.
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
