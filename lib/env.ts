// lib/env.ts
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url().optional(),
  MAGIC_LINK_SECRET: z.string().min(32, 'MAGIC_LINK_SECRET must be at least 32 chars'),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof schema> & {
  isEmailConfigured: boolean;
};

export function loadEnv(): Env {
  const parsed = schema.parse(process.env);
  return {
    ...parsed,
    isEmailConfigured: parsed.RESEND_API_KEY !== undefined,
  };
}
