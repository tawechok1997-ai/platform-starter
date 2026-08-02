import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AdminAccessGovernanceService } from './admin-access-governance.service';

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL?.trim();
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
  const safeHost = ['localhost', '127.0.0.1', 'postgres'].includes(parsed.hostname);
  const safeName = databaseName.includes('test') || databaseName.includes('ci');
  if (!safeHost && !safeName) throw new Error('Admin governance DB tests require an isolated test database');
}

async function ensureGovernanceTables(prisma: PrismaClient) {
  const rows = await prisma.$queryRaw<Array<{ tableName: string | null }>>`
    SELECT to_regclass('public.admin_teams')::text AS "tableName"
  `;
  if (rows[0]?.tableName) return;

  const migrationPath = resolve(
    process.cwd(),
    '../../prisma/migrations/20260803070000_add_admin_team_access_governance/migration.sql',
  );
  const sql = readFileSync(migrationPath, 'utf8');
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
}

describeWithDatabase('admin team and effective-access governance with PostgreSQL', () => {
  let prisma: PrismaClient;
  let service: AdminAccessGovernanceService;
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const ownerId = randomUUID();
  const managerId = randomUUID();
  const subordinateId = randomUUID();
  const ownerRoleId = randomUUID();
  const managerRoleId = randomUUID();
  const subordinateRoleId = randomUUID();
  const targetPermissionId = randomUUID();
  const missingPermissionId = randomUUID();
  const targetPermissionCode = `admin.governance.target.${suffix}`;
  const missingPermissionCode = `admin.governance.missing.${suffix}`;
  const teamCode = `governance_${suffix}`;
  let wildcardPermissionId = '';
  let wildcardPermissionOwned = false;
  let subordinatePermissionId = '';
  let subordinatePermissionOwned = false;
  let teamId = '';

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    await prisma.$connect();
    await ensureGovernanceTables(prisma);

    const wildcard = await prisma.permission.findUnique({ where: { code: '*' } });
    if (wildcard) wildcardPermissionId = wildcard.id;
    else {
      wildcardPermissionId = randomUUID();
      wildcardPermissionOwned = true;
      await prisma.permission.create({
        data: { id: wildcardPermissionId, code: '*', name: 'All permissions', module: 'admin-access' },
      });
    }

    const subordinatePermission = await prisma.permission.findUnique({
      where: { code: 'admin.subordinates.manage' },
    });
    if (subordinatePermission) subordinatePermissionId = subordinatePermission.id;
    else {
      subordinatePermissionId = randomUUID();
      subordinatePermissionOwned = true;
      await prisma.permission.create({
        data: {
          id: subordinatePermissionId,
          code: 'admin.subordinates.manage',
          name: 'Manage direct subordinates',
          module: 'admin-access',
        },
      });
    }

    await prisma.permission.createMany({
      data: [
        { id: targetPermissionId, code: targetPermissionCode, name: 'Governance target', module: 'admin-access' },
        { id: missingPermissionId, code: missingPermissionCode, name: 'Governance missing', module: 'admin-access' },
      ],
    });
    await prisma.role.createMany({
      data: [
        { id: ownerRoleId, code: `governance_owner_${suffix}`, name: 'Governance Owner', level: 1 },
        { id: managerRoleId, code: `governance_manager_${suffix}`, name: 'Governance Manager', level: 20 },
        { id: subordinateRoleId, code: `governance_subordinate_${suffix}`, name: 'Governance Subordinate', level: 80 },
      ],
    });
    await prisma.rolePermission.createMany({
      data: [
        { roleId: ownerRoleId, permissionId: wildcardPermissionId },
        { roleId: managerRoleId, permissionId: subordinatePermissionId },
        { roleId: managerRoleId, permissionId: targetPermissionId },
        { roleId: subordinateRoleId, permissionId: targetPermissionId },
      ],
    });
    await prisma.adminUser.createMany({
      data: [
        { id: ownerId, username: `governance-owner-${suffix}`, email: `governance-owner-${suffix}@example.test`, passwordHash: 'not-used' },
        { id: managerId, username: `governance-manager-${suffix}`, email: `governance-manager-${suffix}@example.test`, passwordHash: 'not-used' },
        { id: subordinateId, username: `governance-subordinate-${suffix}`, email: `governance-subordinate-${suffix}@example.test`, passwordHash: 'not-used' },
      ],
    });
    await prisma.adminUserRole.createMany({
      data: [
        { adminUserId: ownerId, roleId: ownerRoleId },
        { adminUserId: managerId, roleId: managerRoleId },
        { adminUserId: subordinateId, roleId: subordinateRoleId },
      ],
    });
    service = new AdminAccessGovernanceService(prisma as never);
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$executeRawUnsafe(
      'DELETE FROM admin_permission_overrides WHERE admin_user_id = $1::uuid',
      subordinateId,
    );
    await prisma.$executeRawUnsafe(
      'DELETE FROM admin_access_profiles WHERE admin_user_id = $1::uuid',
      subordinateId,
    );
    await prisma.$executeRawUnsafe(
      'DELETE FROM admin_reporting_lines WHERE manager_admin_id = $1::uuid OR subordinate_admin_id = $2::uuid',
      managerId,
      subordinateId,
    );
    if (teamId) {
      await prisma.$executeRawUnsafe('DELETE FROM admin_team_members WHERE team_id = $1::uuid', teamId);
      await prisma.$executeRawUnsafe('DELETE FROM admin_teams WHERE id = $1::uuid', teamId);
    }
    await prisma.adminAuditLog.deleteMany({ where: { adminUserId: { in: [ownerId, managerId, subordinateId] } } });
    await prisma.adminUserRole.deleteMany({ where: { adminUserId: { in: [ownerId, managerId, subordinateId] } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: [ownerId, managerId, subordinateId] } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [ownerRoleId, managerRoleId, subordinateRoleId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [ownerRoleId, managerRoleId, subordinateRoleId] } } });
    await prisma.permission.deleteMany({ where: { id: { in: [targetPermissionId, missingPermissionId] } } });
    if (subordinatePermissionOwned) {
      await prisma.permission.deleteMany({ where: { id: subordinatePermissionId, roles: { none: {} } } });
    }
    if (wildcardPermissionOwned) {
      await prisma.permission.deleteMany({ where: { id: wildcardPermissionId, roles: { none: {} } } });
    }
    await prisma.$disconnect();
  }, 30_000);

  it('persists a managed team, membership and direct reporting line', async () => {
    const team = await service.createTeam(ownerId, {
      code: teamCode,
      name: 'Governance Test Team',
      managerAdminId: managerId,
    });
    teamId = team.id;

    await service.setReportingLine(ownerId, subordinateId, managerId);
    await service.setTeamMember(managerId, team.id, subordinateId, true);

    const overview = await service.overview();
    const storedTeam = overview.teams.find((item) => item.id === team.id);
    expect(storedTeam).toEqual(expect.objectContaining({
      code: teamCode,
      managerAdminId: managerId,
      memberCount: 1,
    }));
    expect(storedTeam?.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ adminUserId: subordinateId, isLead: true }),
    ]));
    expect(overview.reportingLines).toEqual(expect.arrayContaining([
      expect.objectContaining({ managerAdminId: managerId, subordinateAdminId: subordinateId }),
    ]));
  }, 30_000);

  it('applies deny over role access and blocks manager privilege escalation', async () => {
    await service.upsertPermissionOverride(
      managerId,
      subordinateId,
      targetPermissionCode,
      'DENY',
      'Remove sensitive access during review',
    );

    const effective = await service.effectiveAccess(subordinateId);
    expect(effective.rolePermissionCodes).toContain(targetPermissionCode);
    expect(effective.permissions).not.toContain(targetPermissionCode);
    expect(effective.deniedPermissions).toContain(targetPermissionCode);

    await expect(service.upsertPermissionOverride(
      managerId,
      subordinateId,
      missingPermissionCode,
      'ALLOW',
      'Attempt to grant unavailable permission',
    )).rejects.toThrow('A manager cannot allow a permission they do not have');
  }, 30_000);

  it('stores per-user scope and approval limits with audit evidence', async () => {
    await service.updateAccessProfile(
      ownerId,
      subordinateId,
      { brands: ['NOAH345'], regions: ['TH'] },
      { withdrawalApprove: 50000, walletAdjust: 0 },
      'Apply subordinate operating limits',
    );

    const effective = await service.effectiveAccess(subordinateId);
    expect(effective.profile.scope).toEqual({ brands: ['NOAH345'], regions: ['TH'] });
    expect(effective.profile.approvalLimits).toEqual({ withdrawalApprove: 50000, walletAdjust: 0 });

    const audit = await prisma.adminAuditLog.findFirst({
      where: {
        adminUserId: ownerId,
        action: 'UPDATE_ADMIN_ACCESS_PROFILE',
        targetId: subordinateId,
      },
    });
    expect(audit).not.toBeNull();
  }, 30_000);
});
