import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@marlbro/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@marlbro/shared/cn': path.resolve(__dirname, '../../packages/shared/src/cn.ts'),
      '@marlbro/shared/tokens': path.resolve(__dirname, '../../packages/shared/src/tokens.ts'),
      '@marlbro/shared/sampleData': path.resolve(__dirname, '../../packages/shared/src/sampleData.ts'),
      '@marlbro/shared/session': path.resolve(__dirname, '../../packages/shared/src/session.ts'),
      '@marlbro/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
