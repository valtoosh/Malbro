export interface PutResult {
  key: string;
}

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<PutResult>;
  url(key: string): string;
}
