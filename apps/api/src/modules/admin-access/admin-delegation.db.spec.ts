import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminAccessService } from './admin-access.service';

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) throw new Error('Delegation DB tests require an isolated test database');
}

describeWithDatabase('admin delegated access lifecycle with PostgreSQL', () => {
  let prisma: PrismaClient;
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const grantorId = randomUUID();
  const delegateId = randomUUID();
  const outsiderId = randomUUID();
  const ownerId = randomUUID();
  const sessionId = randomUUID();
  const grantorRoleId = randomUUID();
  const delegateRoleId = randomUUID();
  const outsiderRoleId = randomUUID();
  const ownerRoleId = randomUUID();
  const delegatePermissionId = randomUUID();
  const directPermissionId = randomUUID();
  const wildcardPermissionId = randomUUID();
  const delegatedPermissionCode = `support.case.view.${suffix}`;
  const directPermissionCode = `admin.dashboard.view.${suffix}`;

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();

    await prisma.permission.createMany({
      data: [
        { id: delegatePermissionId, code: delegatedPermissionCode, name: 'Delegated support view', module: 'support' },
        { id: directPermissionId, code: directPermissionCode, name: 'Direct dashboard view', module: 'admin' },
        { id: wildcardPermissionId, code: `delegation-owner-wildcard-${suffix}`, name: 'Owner test wildcard placeholder', module: 'admin-access' },
      ],
    });
    await prisma.permission.update({ where: { id: wildcardPermissionId }, data: { code: '*' } }).catch(async () => {
      const existing = await prisma.permission.findUniqueOrThrow({ where: { code: '*' } });
      await prisma.permission.delete({ where: { id: wildcardPermissionId } });
      Object.assign(testIds, { wildcardPermissionId: existing.id, wildcardOwned: false });
    });

    await prisma.role.createMany({
      data: [
        { id: grantorRoleId, code: `delegation_grantor_${suffix}`, name: 'Delegation Grantor', level: 40 },
        { id: delegateRoleId, code: `delegation_delegate_${suffix}`, name: 'Delegation Delegate', level: 80 },
        { id: outsiderRoleId, code: `delegation_outsider_${suffix}`, name: 'Delegation Outsider', level: 80 },
      ],
    });
    const existingOwner = await prisma.role.findUnique({ where: { code: 'owner' } });
    if (existingOwner) {
      Object.assign(testIds, { ownerRoleId: existingOwner.id, ownerRoleOwned: false });
    } else {
      await prisma.role.create({ data: { id: ownerRoleId, code: 'owner', name: 'Owner', level: 1 } });
    }

    const delegationManagePermission = await prisma.permission.upsert({
      where: { code: 'admin.access.delegate' },
      update: {},
      create: { code: 'admin.access.delegate', name: 'Delegate limited admin access', module: 'admin-access' },
    });
    Object.assign(testIds, {
      delegationManagePermissionId: delegationManagePermission.id,
      delegationManagePermissionOwned: delegationManagePermission.id !== undefined
        && delegationManagePermission.createdAt.getTime() >= suiteStartedAt,
    });

    await prisma.rolePermission.createMany({
      data: [
        { roleId: grantorRoleId, permissionId: delegationManagePermission.id },
        { roleId: grantorRoleId, permissionId: delegatePermissionId },
        { roleId: delegateRoleId, permissionId: directPermissionId },
        { roleId: testIds.ownerRoleId, permissionId: testIds.wildcardPermissionId },
      ],
      skipDuplicates: true,
    });

    await prisma.adminUser.createMany({
      data: [
        { id: grantorId, username: `delegation-grantor-${suffix}`, email: `delegation-grantor-${suffix}@example.test`, passwordHash: 'not-used' },
        { id: delegateId, username: `delegation-delegate-${suffix}`, email: `delegation-delegate-${suffix}@example.test`, passwordHash: 'not-used' },
        { id: outsiderId, username: `delegation-outsider-${suffix}`, email: `delegation-outsider-${suffix}@example.test`, passwordHash: 'not-used' },
        { id: ownerId, username: `delegation-owner-${suffix}`, email: `delegation-owner-${suffix}@example.test`, passwordHash: 'not-used' },
      ],
    });
    await prisma.adminUserRole.createMany({
      data: [
        { adminUserId: grantorId, roleId: grantorRoleId },
        { adminUserId: delegateId, roleId: delegateRoleId },
        { adminUserId: outsiderId, roleId: outsiderRoleId },
        { adminUserId: ownerId, roleId: testIds.ownerRoleId },
      ],
    });
    await prisma.authSession.create({
      data: {
        id: sessionId,
        type: 'ADMIN',
        adminUserId: delegateId,
        refreshTokenHash: `delegation-refresh-${suffix}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: [grantorId, delegateId, outsiderId, ownerId] } } });
    await prisma.adminDelegation.deleteMany({ where: { OR: [{ grantorAdminId: { in: [grantorId, ownerId] } }, { delegateAdminId: { in: [delegateId, outsiderId] } }] } });
    await prisma.authSession.deleteMany({ where: { id: sessionId } });
    await prisma.adminUserRole.deleteMany({ where: { adminUserId: { in: [grantorId, delegateId, outsiderId, ownerId] } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: [grantorId, delegateId, outsiderId, ownerId] } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [grantorRoleId, delegateRoleId, outsiderRoleId, testIds.ownerRoleId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [grantorRoleId, delegateRoleId, outsiderRoleId, ...(testIds.ownerRoleOwned ? [testIds.ownerRoleId] : [])] } } });
    await prisma.permission.deleteMany({ where: { id: { in: [delegatePermissionId, directPermissionId, ...(testIds.wildcardOwned ? [testIds.wildcardPermissionId] : [])] } } });
    if (testIds.delegationManagePermissionOwned && testIds.delegationManagePermissionId) {
      await prisma.permission.deleteMany({ where: { id: testIds.delegationManagePermissionId, roles: { none: {} } } });
    }
    await prisma.$disconnect();
  }, 30_000);

  it('adds active delegated permissions to the authenticated admin context', async () => {
    const service = new AdminAccessService(prisma as any, {} as any);
    const created = await service.createDelegation(
      grantorId,
      delegateId,
      [delegatedPermissionCode],
      1,
      'Temporary support coverage',
    );

    expect(created.success).toBe(true);
    expect(created.delegation.status).toBe('ACTIVE');
    expect(created.delegation.permissionCodes).toEqual([delegatedPermissionCode]);

    const request = await authenticateDelegate();
    expect(request.user.permissions).toEqual(expect.arrayContaining([directPermissionCode, delegatedPermissionCode]));
    expect(request.user.delegated).toBe(true);
    expect(request.user.delegationIds).toEqual([created.delegation.id]);

    await expect(service.createDelegation(
      delegateId,
      outsiderId,
      [directPermissionCode],
      1,
      'Attempted chained delegation',
    )).rejects.toThrow('Delegated admins cannot create further delegations');
  }, 30_000);

  it('removes delegated permissions after expiry and records EXPIRED state', async () => {
    const active = await prisma.adminDelegation.findFirstOrThrow({
      where: { grantorAdminId: grantorId, delegateAdminId: delegateId, status: 'ACTIVE' },
    });
    await prisma.adminDelegation.update({
      where: { id: active.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    const listed = await new AdminAccessService(prisma as any, {} as any).listDelegations(grantorId);
    const expired = listed.find((item) => item.id === active.id);
    expect(expired?.status).toBe('EXPIRED');

    const request = await authenticateDelegate();
    expect(request.user.permissions).toContain(directPermissionCode);
    expect(request.user.permissions).not.toContain(delegatedPermissionCode);
    expect(request.user.delegated).toBe(false);
    expect(request.user.delegationIds).toEqual([]);
  }, 30_000);

  it('enforces grantor/owner revoke boundary and removes access after owner revocation', async () => {
    const service = new AdminAccessService(prisma as any, {} as any);
    const created = await service.createDelegation(
      grantorId,
      delegateId,
      [delegatedPermissionCode],
      1,
      'Temporary incident coverage',
    );

    await expect(service.revokeDelegation(
      outsiderId,
      created.delegation.id,
      'Outsider revoke attempt',
    )).rejects.toThrow('Only the grantor or an owner-level admin can revoke this delegation');

    const revoked = await service.revokeDelegation(ownerId, created.delegation.id, 'Owner ended temporary access');
    expect(revoked).toEqual(expect.objectContaining({ success: true, changed: true }));
    expect(revoked.delegation.status).toBe('REVOKED');
    expect(revoked.delegation.revokedByAdminId).toBe(ownerId);

    const request = await authenticateDelegate();
    expect(request.user.permissions).not.toContain(delegatedPermissionCode);
    expect(request.user.delegated).toBe(false);

    const audits = await prisma.adminAuditLog.findMany({
      where: { action: { in: ['CREATE_ADMIN_DELEGATION', 'REVOKE_ADMIN_DELEGATION'] }, targetId: delegateId },
      select: { action: true, adminUserId: true },
    });
    expect(audits).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'CREATE_ADMIN_DELEGATION', adminUserId: grantorId }),
      expect.objectContaining({ action: 'REVOKE_ADMIN_DELEGATION', adminUserId: ownerId }),
    ]));
  }, 30_000);

  async function authenticateDelegate() {
    const request: Record<string, any> = {
      headers: { authorization: 'Bearer delegated-access-test-token' },
      url: '/admin/support',
    };
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ type: 'ADMIN', sub: delegateId, sessionId }) };
    const config = {
      get: jest.fn((key: string) => key === 'JWT_ACCESS_KEY' ? 'delegation-test-access-key' : 'false'),
    };
    const guard = new AdminAuthGuard(jwt as any, config as any, prisma as any);
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };
    await expect(guard.canActivate(context as any)).resolves.toBe(true);
    return request;
  }
});

const suiteStartedAt = Date.now();
const testIds: {
  ownerRoleId: string;
  ownerRoleOwned: boolean;
  wildcardPermissionId: string;
  wildcardOwned: boolean;
  delegationManagePermissionId?: string;
  delegationManagePermissionOwned: boolean;
} = {
  ownerRoleId: '',
  ownerRoleOwned: true,
  wildcardPermissionId: '',
  wildcardOwned: true,
  delegationManagePermissionOwned: false,
};
