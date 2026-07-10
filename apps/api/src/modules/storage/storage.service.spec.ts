import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const originalDriver = process.env.STORAGE_DRIVER;
  const originalDirectory = process.env.PRIVATE_MEDIA_DIR;
  let directory = '';

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'platform-storage-'));
    process.env.STORAGE_DRIVER = 'local';
    process.env.PRIVATE_MEDIA_DIR = directory;
  });

  afterEach(async () => {
    if (originalDriver === undefined) delete process.env.STORAGE_DRIVER;
    else process.env.STORAGE_DRIVER = originalDriver;
    if (originalDirectory === undefined) delete process.env.PRIVATE_MEDIA_DIR;
    else process.env.PRIVATE_MEDIA_DIR = originalDirectory;
    await rm(directory, { recursive: true, force: true });
  });

  it('removes an uploaded object without failing when delete is retried', async () => {
    const storage = new StorageService();
    const key = 'proofs/example.txt';

    await storage.put(key, Buffer.from('proof'), 'text/plain');
    await expect(storage.get(key, 'text/plain')).resolves.toMatchObject({ contentType: 'text/plain' });

    await expect(storage.delete(key)).resolves.toEqual({ key, deleted: true });
    await expect(storage.delete(key)).resolves.toEqual({ key, deleted: true });
    await expect(storage.get(key, 'text/plain')).rejects.toThrow('Stored file not found');
  });
});
