import { SupportAttachmentsService } from './support-attachments.service';

describe('SupportAttachmentsService storage lifecycle', () => {
  const member = { id: 'member-1' } as any;
  const admin = { id: 'admin-1' } as any;

  function setup() {
    const prisma = {} as any;
    const storage = {
      remove: jest.fn().mockResolvedValue(undefined),
    } as any;
    const signedAccess = {} as any;
    const support = {
      removeMemberAttachment: jest.fn().mockResolvedValue({
        ok: true,
        attachmentId: 'attachment-1',
        deletedAt: '2026-07-15T00:00:00.000Z',
        cleanup: { storageKey: 'support/ticket-1/file.png' },
      }),
      removeAdminAttachment: jest.fn().mockResolvedValue({
        ok: true,
        attachmentId: 'attachment-2',
        deletedAt: '2026-07-15T00:00:00.000Z',
        cleanup: { storageKey: 'support/ticket-1/admin.pdf' },
      }),
    } as any;
    return {
      service: new SupportAttachmentsService(prisma, storage, signedAccess, support),
      storage,
      support,
    };
  }

  it('removes the member attachment object after metadata deletion', async () => {
    const { service, storage, support } = setup();

    await expect(service.removeMember(member, 'ticket-1', 'attachment-1')).resolves.toMatchObject({
      ok: true,
      cleanup: { storageKey: 'support/ticket-1/file.png', removed: true },
    });
    expect(support.removeMemberAttachment).toHaveBeenCalledWith(member, 'ticket-1', 'attachment-1');
    expect(storage.remove).toHaveBeenCalledWith('support/ticket-1/file.png');
  });

  it('removes the admin attachment object after metadata deletion', async () => {
    const { service, storage, support } = setup();

    await expect(service.removeAdmin(admin, 'ticket-1', 'attachment-2')).resolves.toMatchObject({
      ok: true,
      cleanup: { storageKey: 'support/ticket-1/admin.pdf', removed: true },
    });
    expect(support.removeAdminAttachment).toHaveBeenCalledWith(admin, 'ticket-1', 'attachment-2');
    expect(storage.remove).toHaveBeenCalledWith('support/ticket-1/admin.pdf');
  });

  it('surfaces storage cleanup failures instead of reporting a false success', async () => {
    const { service, storage } = setup();
    storage.remove.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(service.removeMember(member, 'ticket-1', 'attachment-1')).rejects.toThrow('storage unavailable');
  });
});
