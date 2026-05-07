import fs from 'fs/promises';
import path from 'path';
import type { Storage, PutResult } from './types';

function getRoot(): string {
  return process.env.LOCAL_UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');
}

export class LocalStorage implements Storage {
  async put(key: string, body: Buffer): Promise<PutResult> {
    const filePath = path.join(getRoot(), key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
    return { key };
  }
  url(key: string): string {
    // In dev, served via /api/uploads/[...path]
    return `/api/uploads/${encodeURI(key)}`;
  }
}

