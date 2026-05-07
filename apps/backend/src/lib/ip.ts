// lib/ip.ts
import { createHash } from 'crypto';

export function hashIp(ip: string): string {
  const salt = process.env.MAGIC_LINK_SECRET ?? '';
  return createHash('sha256').update(salt + ':' + ip).digest('hex');
}
