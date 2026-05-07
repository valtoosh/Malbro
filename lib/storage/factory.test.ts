import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getStorage } from './factory';

const TMP = path.join(os.tmpdir(), 'marlbro-test-uploads');

beforeEach(() => {
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
  process.env.LOCAL_UPLOADS_DIR = TMP;
  fs.rmSync(TMP, { recursive: true, force: true });
});

afterAll(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

describe('getStorage', () => {
  it('returns LocalStorage when R2 env vars are unset', async () => {
    const s = getStorage();
    const r = await s.put('test/abc.jpg', Buffer.from('hello'), 'image/jpeg');
    expect(r.key).toBe('test/abc.jpg');
    expect(fs.existsSync(path.join(TMP, 'test/abc.jpg'))).toBe(true);
    expect(s.url('test/abc.jpg')).toContain('/api/uploads/');
  });

  it('returns R2Storage when R2 env vars are set', () => {
    process.env.R2_ACCESS_KEY_ID = 'x';
    process.env.R2_SECRET_ACCESS_KEY = 'y';
    process.env.R2_BUCKET = 'z';
    const s = getStorage();
    expect(s.constructor.name).toBe('R2Storage');
  });
});
