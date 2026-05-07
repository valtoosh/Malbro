import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@marlbro/shared': path.resolve(__dirname, '../shared/src'),
      '@marlbro/shared/sampleData': path.resolve(__dirname, '../shared/src/sampleData.ts'),
    },
  },
});
