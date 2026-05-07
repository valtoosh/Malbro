import type { Storage } from './types';
import { LocalStorage } from './local';
import { R2Storage } from './r2';

export function getStorage(): Storage {
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET) {
    return new R2Storage();
  }
  return new LocalStorage();
}
