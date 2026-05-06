// tests/integration/routes.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('app router structure', () => {
  const root = process.cwd();
  const routes = [
    'app/page.tsx',
    'app/bounties/page.tsx',
    'app/apply/page.tsx',
    'app/wall/page.tsx',
    'app/manifesto/page.tsx',
    'app/faq/page.tsx',
    'app/not-found.tsx',
    'app/layout.tsx',
  ];

  it.each(routes)('has %s on disk', (route) => {
    expect(existsSync(join(root, route))).toBe(true);
  });
});
