import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
  },
  resolve: {
    alias: {
      '@marlbro/shared': path.resolve(__dirname, '../shared/src'),
      '@marlbro/shared/cn': path.resolve(__dirname, '../shared/src/cn.ts'),
      '@marlbro/shared/tokens': path.resolve(__dirname, '../shared/src/tokens.ts'),
      '@marlbro/shared/sampleData': path.resolve(__dirname, '../shared/src/sampleData.ts'),
    },
  },
});
