import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CmsAssetsService } from './cms-assets.service';

function pngDataUrl() {
  const bytes = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('cms-test'),
  ]);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

describe('CmsAssetsService', () => {
  const storage = {
    put: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
  };
  const prisma = {
    adminAuditLog: { create: jest.fn() },
  };
  const actor = { id: 'admin-1', permissions: ['settings.features.update'] } as any;
  const meta = { ipAddress: '127.0.0.1', userAgent: 'jest' };
  let service: CmsAssetsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CmsAssetsService(storage as any, prisma as any);
  });

  it('stores a valid image with generated cms key and audit metadata', async () => {
    storage.put.mockResolvedValue({ key: 'ok' });
    prisma.adminAuditLog.create.mockResolvedValue({ id: 'audit-1' });

    const result = await service.upload({ name: 'Hero', dataUrl: pngDataUrl(), type: 'image', tag: 'banner' }, actor, meta);

    expect(result.storageKey).toMatch(/^cms\/[0-9a-f-]+\.png$/);
    expect(result.url).toMatch(/^\/public\/cms-assets\/[0-9a-f-]+\.png$/);
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(storage.put).toHaveBeenCalledWith(result.storageKey, expect.any(Buffer), 'image/png');
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'cms.asset.upload',
        adminUser: { connect: { id: actor.id } },
      }),
    }));
  });

  it('rejects mismatched declared type', async () => {
    await expect(service.upload({ name: 'Wrong', dataUrl: pngDataUrl(), type: 'video' }, actor, meta)).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects spoofed MIME signatures', async () => {
    const fake = `data:image/png;base64,${Buffer.from('not-a-png').toString('base64')}`;
    await expect(service.upload({ name: 'Spoofed', dataUrl: fake, type: 'image' }, actor, meta)).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('only deletes keys inside the cms namespace', async () => {
    await expect(service.remove('kyc/private.pdf', actor, meta)).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('deletes a valid CMS asset and audits the action', async () => {
    const key = 'cms/11111111-1111-4111-8111-111111111111.webp';
    storage.remove.mockResolvedValue({ key, deleted: true });
    prisma.adminAuditLog.create.mockResolvedValue({ id: 'audit-2' });

    await expect(service.remove(key, actor, meta)).resolves.toEqual({ success: true, storageKey: key });
    expect(storage.remove).toHaveBeenCalledWith(key);
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'cms.asset.delete' }),
    }));
  });

  it('serves public assets with content type derived from the safe filename', async () => {
    const fileName = '11111111-1111-4111-8111-111111111111.jpg';
    storage.get.mockResolvedValue({ data: Buffer.from('jpg'), contentType: 'image/jpeg' });

    await expect(service.readPublic(fileName)).resolves.toEqual({ data: expect.any(Buffer), contentType: 'image/jpeg' });
    expect(storage.get).toHaveBeenCalledWith(`cms/${fileName}`, 'image/jpeg');
  });

  it('rejects malformed public filenames', async () => {
    await expect(service.readPublic('../secret.txt')).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.get).not.toHaveBeenCalled();
  });
});