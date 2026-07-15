import { StorageSignedAccessService } from './storage-signed-access.service';

describe('StorageSignedAccessService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STORAGE_SIGNING_SECRET: 'signed-storage-test-secret-that-is-long-enough',
      STORAGE_SIGNED_URL_TTL_SECONDS: '300',
    };
    jest.useFakeTimers().setSystemTime(new Date('2026-07-15T00:00:00.000Z'));
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  it('issues and verifies a token bound to the storage object', () => {
    const service = new StorageSignedAccessService();
    const issued = service.issue({ key: 'support/ticket/file.pdf', contentType: 'application/pdf', fileName: 'proof.pdf' });

    expect(service.verify(issued.token)).toMatchObject({
      key: 'support/ticket/file.pdf',
      contentType: 'application/pdf',
      fileName: 'proof.pdf',
    });
    expect(issued.ttlSeconds).toBe(300);
  });

  it('rejects a tampered signature', () => {
    const service = new StorageSignedAccessService();
    const issued = service.issue({ key: 'support/ticket/file.pdf', contentType: 'application/pdf' });
    expect(() => service.verify(`${issued.token.slice(0, -1)}x`)).toThrow(/Invalid storage access token/);
  });

  it('rejects an expired token', () => {
    const service = new StorageSignedAccessService();
    const issued = service.issue({ key: 'support/ticket/file.pdf', contentType: 'application/pdf' }, 30);
    jest.advanceTimersByTime(31_000);
    expect(() => service.verify(issued.token)).toThrow(/expired/);
  });

  it('caps token lifetime at fifteen minutes', () => {
    const service = new StorageSignedAccessService();
    const issued = service.issue({ key: 'support/ticket/file.pdf', contentType: 'application/pdf' }, 86_400);
    expect(issued.ttlSeconds).toBe(900);
  });
});
