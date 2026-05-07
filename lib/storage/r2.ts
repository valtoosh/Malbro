// PLACEHOLDER — implement when R2 keys are provided.
import type { Storage, PutResult } from './types';

export class R2Storage implements Storage {
  // TODO: instantiate AWS S3 client pointed at R2 endpoint when env keys present:
  //   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.
  // For now, throw — the factory only returns this when those env vars exist,
  // so this constructor never runs in the unstubbed dev path.
  async put(_key: string, _body: Buffer): Promise<PutResult> {
    throw new Error('R2Storage not implemented — fill in R2_* env vars and wire up @aws-sdk/client-s3.');
  }
  url(key: string): string {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
}
