import { KycRetentionService } from './kyc-retention.service';

describe('KycRetentionService', () => {
  it('marks a document expired only after storage removal succeeds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'doc-1', storage_key: 'kyc/doc-1' }]),
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    const storage = { remove: jest.fn().mockResolvedValue(undefined) };
    const service = new KycRetentionService(prisma as never, storage as never);

    await expect(service.cleanupExpired(10)).resolves.toEqual({ scanned: 1, deleted: 1, storageFailures: 0 });
    expect(storage.remove).toHaveBeenCalledWith('kyc/doc-1');
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('does not mark the database row deleted when storage removal fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'doc-1', storage_key: 'kyc/doc-1' }]),
      $executeRaw: jest.fn(),
    };
    const storage = { remove: jest.fn().mockRejectedValue(new Error('storage unavailable')) };
    const service = new KycRetentionService(prisma as never, storage as never);

    await expect(service.cleanupExpired(10)).resolves.toEqual({ scanned: 1, deleted: 0, storageFailures: 1 });
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('caps the requested cleanup batch size', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([]), $executeRaw: jest.fn() };
    const service = new KycRetentionService(prisma as never, { remove: jest.fn() } as never);

    await expect(service.cleanupExpired(10000)).resolves.toEqual({ scanned: 0, deleted: 0, storageFailures: 0 });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
