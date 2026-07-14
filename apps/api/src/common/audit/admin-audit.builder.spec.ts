import { buildAdminAuditData, toAuditJson } from './admin-audit.builder';

describe('admin audit builder', () => {
  it('normalizes undefined payloads to JSON null', () => {
    expect(toAuditJson(undefined)).toBeNull();
  });

  it('builds a consistent audit payload with request metadata', () => {
    expect(
      buildAdminAuditData({
        adminUserId: 'admin-1',
        module: 'members',
        action: 'UPDATE_MEMBER_STATUS',
        targetId: 'member-1',
        oldData: { status: 'ACTIVE' },
        newData: { status: 'LOCKED' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
    ).toEqual({
      adminUser: { connect: { id: 'admin-1' } },
      module: 'members',
      action: 'UPDATE_MEMBER_STATUS',
      targetId: 'member-1',
      oldData: { status: 'ACTIVE' },
      newData: { status: 'LOCKED' },
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
  });
});
