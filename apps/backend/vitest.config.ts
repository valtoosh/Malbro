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
      '@marlbro/db': path.resolve(__dirname, '../../packages/db/src'),
      '@marlbro/db/schema': path.resolve(__dirname, '../../packages/db/src/schema.ts'),
      '@marlbro/db/client': path.resolve(__dirname, '../../packages/db/src/client.ts'),
      '@marlbro/db/seed': path.resolve(__dirname, '../../packages/db/src/seed.ts'),
      '@marlbro/db/queries/audit': path.resolve(__dirname, '../../packages/db/src/queries/audit.ts'),
      '@marlbro/db/queries/bounties': path.resolve(__dirname, '../../packages/db/src/queries/bounties.ts'),
      '@marlbro/db/queries/submissions': path.resolve(__dirname, '../../packages/db/src/queries/submissions.ts'),
      '@marlbro/db/queries/approvedGrants': path.resolve(__dirname, '../../packages/db/src/queries/approvedGrants.ts'),
      '@marlbro/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
