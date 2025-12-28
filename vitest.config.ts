import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local for tests
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@prisma/client': resolve(process.cwd(), 'node_modules/@prisma/client'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
