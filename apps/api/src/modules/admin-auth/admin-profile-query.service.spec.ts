import { AdminProfileQueryService } from './admin-profile-query.service';

function profileRow() {
  return {
    id: 'admin-1',
    username: 'operator',
    email: 'operator@example.com',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    displayName: 'Operations lead',
    firstName: 'Op',
    lastName: 'Lead',
    position: 'Shift lead',
    department: 'Operations',
    avatarUrl: 'https://example.com/avatar.png',
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    roles: [
      {
        role: {
          code: 'support',
          name: 'Support',
          description: null,
          level: 50,
          permissions: [
            {
              permission: {
                code: 'support.view',
                module: 'support',
                name: 'View support',
              },
            },
          ],
        },
      },
    ],
  };
}

describe('AdminProfileQueryService', () => {
  it('returns persisted profile fields with the guard-resolved session permissions', async () => {
    const prisma = { adminUser: { findUnique: jest.fn().mockResolvedValue(profileRow()) } };
    const service = new AdminProfileQueryService(prisma as never);

    const result = await service.getProfile('admin-1', ['session.permission']);

    expect(result).toMatchObject({
      displayName: 'Operations lead',
      firstName: 'Op',
      lastName: 'Lead',
      position: 'Shift lead',
      department: 'Operations',
      avatarUrl: 'https://example.com/avatar.png',
      permissions: ['session.permission'],
    });
    expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ displayName: true, department: true, avatarUrl: true }),
      }),
    );
  });

  it('keeps an explicitly empty effective permission set empty after wildcard DENY', async () => {
    const prisma = { adminUser: { findUnique: jest.fn().mockResolvedValue(profileRow()) } };
    const service = new AdminProfileQueryService(prisma as never);

    const result = await service.getProfile('admin-1', []);

    expect(result.permissions).toEqual([]);
    expect(result.roles).toEqual([
      expect.objectContaining({ code: 'support' }),
    ]);
  });

  it('falls back to role permissions only for legacy callers that omit session permissions', async () => {
    const prisma = { adminUser: { findUnique: jest.fn().mockResolvedValue(profileRow()) } };
    const service = new AdminProfileQueryService(prisma as never);

    const result = await service.getProfile('admin-1');

    expect(result.permissions).toEqual(['support.view']);
  });
});
