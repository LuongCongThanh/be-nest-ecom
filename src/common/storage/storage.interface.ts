export const STORAGE_ADAPTER = 'STORAGE_ADAPTER';

export interface IStorageAdapter {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
}
