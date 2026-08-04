import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { resolveAdminEffectivePermissions } from './admin-effective-access';

const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);
const MAX_JSON_BYTES = 20_000;

type ActorContext = {
  id: string;
  protected: boolean;
  hasWildcard: boolean;
  permissions: Set<string>;
};

type TeamRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parentTeamId: string | null;
  managerAdminId: string | null;
  managerUsername: string | null;
  createdAt: Date;
  updatedAt: Date;
  memberCount: bigint | number;
};

type TeamMemberRow = {
  teamId: string;
  adminUserId: string;
  username: string;
  email: string;
  isLead: boolean;
  createdAt: Date;
};

type ReportingLineRow = {
  managerAdminId: string;
  subordinateAdminId: string;
  managerUsername: string;
  subordinateUsername: string;
  createdAt: Date;
};

type OverrideRow = {
  id: string;
  adminUserId: string;
  permissionCode: string;
  effect: 'ALLOW' | 'DENY';
  reason: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAdminTeamInput = {
  code: string;
  name: string;
  description?: string | null;
  parentTeamId?: string | null;
  managerAdminId?: string | null;
};

export type UpdateAdminTeamInput = Partial<CreateAdminTeamInput>;

@Injectable()
export class AdminAccessGovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [teams, members, reportingLines] = await Promise.all([
      this.prisma.$queryRaw<TeamRow[]>(Prisma.sql`
        SELECT
          team.id,
          team.code,
          team.name,
          team.description,
          team.parent_team_id AS "parentTeamId",
          team.manager_admin_id AS "managerAdminId",
          manager.username AS "managerUsername",
          team.created_at AS "createdAt",
          team.updated_at AS "updatedAt",
          COUNT(member.admin_user_id) AS "memberCount"
        FROM admin_teams team
        LEFT JOIN admin_users manager ON manager.id = team.manager_admin_id
        LEFT JOIN admin_team_members member ON member.team_id = team.id
        GROUP BY team.id, manager.username
        ORDER BY team.name ASC, team.code ASC
      `),
      this.prisma.$queryRaw<TeamMemberRow[]>(Prisma.sql`
        SELECT
          member.team_id AS "teamId",
          member.admin_user_id AS "adminUserId",
          admin.username,
          admin.email,
          member.is_lead AS "isLead",
          member.created_at AS "createdAt"
        FROM admin_team_members member
        JOIN admin_users admin ON admin.id = member.admin_user_id
        ORDER BY admin.username ASC
      `),
      this.prisma.$queryRaw<ReportingLineRow[]>(Prisma.sql`
        SELECT
          line.manager_admin_id AS "managerAdminId",
          line.subordinate_admin_id AS "subordinateAdminId",
          manager.username AS "managerUsername",
          subordinate.username AS "subordinateUsername",
          line.created_at AS "createdAt"
        FROM admin_reporting_lines line
        JOIN admin_users manager ON manager.id = line.manager_admin_id
        JOIN admin_users subordinate ON subordinate.id = line.subordinate_admin_id
        ORDER BY manager.username ASC, subordinate.username ASC
      `),
    ]);

    const membersByTeam = new Map<string, TeamMemberRow[]>();
    for (const member of members) {
      const current = membersByTeam.get(member.teamId) ?? [];
      current.push(member);
      membersByTeam.set(member.teamId, current);
    }

    return {
      teams: teams.map((team) => ({
        ...team,
        memberCount: Number(team.memberCount),
        members: membersByTeam.get(team.id) ?? [],
      })),
      reportingLines,
    };
  }

  async effectiveAccess(adminUserId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        position: true,
        department: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                level: true,
                permissions: {
                  select: {
                    permission: { select: { code: true, module: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!admin) throw new NotFoundException('Admin user not found');

    const [overrides, profiles, memberships, reporting] = await Promise.all([
      this.prisma.$queryRaw<OverrideRow[]>(Prisma.sql`
        SELECT
          id,
          admin_user_id AS "adminUserId",
          permission_code AS "permissionCode",
          effect,
          reason,
          expires_at AS "expiresAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM admin_permission_overrides
        WHERE admin_user_id = ${adminUserId}::uuid
        ORDER BY permission_code ASC
      `),
      this.prisma.$queryRaw<Array<{
        scope: Prisma.JsonObject;
        approvalLimits: Prisma.JsonObject;
        updatedAt: Date;
      }>>(Prisma.sql`
        SELECT
          scope,
          approval_limits AS "approvalLimits",
          updated_at AS "updatedAt"
        FROM admin_access_profiles
        WHERE admin_user_id = ${adminUserId}::uuid
        LIMIT 1
      `),
      this.prisma.$queryRaw<Array<{
        teamId: string;
        teamCode: string;
        teamName: string;
        isLead: boolean;
      }>>(Prisma.sql`
        SELECT
          team.id AS "teamId",
          team.code AS "teamCode",
          team.name AS "teamName",
          member.is_lead AS "isLead"
        FROM admin_team_members member
        JOIN admin_teams team ON team.id = member.team_id
        WHERE member.admin_user_id = ${adminUserId}::uuid
        ORDER BY team.name ASC
      `),
      this.prisma.$queryRaw<Array<{
        managerAdminId: string | null;
        subordinateAdminIds: string[] | null;
      }>>(Prisma.sql`
        SELECT
          (
            SELECT manager_admin_id
            FROM admin_reporting_lines
            WHERE subordinate_admin_id = ${adminUserId}::uuid
            LIMIT 1
          ) AS "managerAdminId",
          (
            SELECT ARRAY_AGG(subordinate_admin_id ORDER BY subordinate_admin_id)
            FROM admin_reporting_lines
            WHERE manager_admin_id = ${adminUserId}::uuid
          ) AS "subordinateAdminIds"
      `),
    ]);

    const rolePermissionCodes = admin.roles.flatMap((item) =>
      item.role.permissions.map((permission) => permission.permission.code),
    );
    const resolved = resolveAdminEffectivePermissions({
      rolePermissionCodes,
      roleCodes: admin.roles.map((item) => item.role.code),
      overrides,
    });

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        status: admin.status,
        position: admin.position,
        department: admin.department,
      },
      roles: admin.roles.map((item) => ({
        id: item.role.id,
        code: item.role.code,
        name: item.role.name,
        level: item.role.level,
      })),
      rolePermissionCodes: Array.from(new Set(rolePermissionCodes)).sort(),
      ...resolved,
      overrides,
      profile: profiles[0] ?? {
        scope: {},
        approvalLimits: {},
        updatedAt: null,
      },
      teams: memberships,
      managerAdminId: reporting[0]?.managerAdminId ?? null,
      subordinateAdminIds: reporting[0]?.subordinateAdminIds ?? [],
    };
  }

  async createTeam(actorAdminId: string, input: CreateAdminTeamInput) {
    const actor = await this.actorContext(actorAdminId);
    const code = this.normalizeCode(input.code);
    const name = this.requiredText(input.name, 'Team name', 120);
    const description = this.optionalText(input.description, 1000);
    const parentTeamId = this.optionalId(input.parentTeamId);
    const managerAdminId = this.optionalId(input.managerAdminId) ?? actorAdminId;

    await this.assertAdminExists(managerAdminId);
    if (!actor.hasWildcard && managerAdminId !== actor.id) {
      throw new ForbiddenException('A manager can only create a team managed by themselves');
    }
    if (parentTeamId) await this.assertTeamManagedBy(actor, parentTeamId);

    const id = randomUUID();
    try {
      await this.prisma.$executeRaw(Prisma.sql`
        INSERT INTO admin_teams (
          id,
          code,
          name,
          description,
          parent_team_id,
          manager_admin_id,
          created_by_admin_id
        ) VALUES (
          ${id}::uuid,
          ${code},
          ${name},
          ${description},
          ${parentTeamId}::uuid,
          ${managerAdminId}::uuid,
          ${actorAdminId}::uuid
        )
      `);
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('Team code already exists');
      throw error;
    }

    await this.audit(actorAdminId, 'CREATE_ADMIN_TEAM', id, null, {
      code,
      name,
      description,
      parentTeamId,
      managerAdminId,
    });
    return { success: true, id, code, name, description, parentTeamId, managerAdminId };
  }

  async updateTeam(actorAdminId: string, teamId: string, input: UpdateAdminTeamInput) {
    const actor = await this.actorContext(actorAdminId);
    const current = await this.findTeam(teamId);
    await this.assertTeamManagedBy(actor, teamId, current);

    const code = input.code === undefined ? current.code : this.normalizeCode(input.code);
    const name = input.name === undefined
      ? current.name
      : this.requiredText(input.name, 'Team name', 120);
    const description = input.description === undefined
      ? current.description
      : this.optionalText(input.description, 1000);
    const parentTeamId = input.parentTeamId === undefined
      ? current.parentTeamId
      : this.optionalId(input.parentTeamId);
    const managerAdminId = input.managerAdminId === undefined
      ? current.managerAdminId
      : this.optionalId(input.managerAdminId);

    if (parentTeamId === teamId) throw new BadRequestException('A team cannot be its own parent');
    if (parentTeamId) {
      await this.assertTeamExists(parentTeamId);
      const cycle = await this.prisma.$queryRaw<Array<{ wouldCycle: boolean }>>(Prisma.sql`
        WITH RECURSIVE descendants AS (
          SELECT id FROM admin_teams WHERE parent_team_id = ${teamId}::uuid
          UNION ALL
          SELECT child.id
          FROM admin_teams child
          JOIN descendants parent ON child.parent_team_id = parent.id
        )
        SELECT EXISTS(
          SELECT 1 FROM descendants WHERE id = ${parentTeamId}::uuid
        ) AS "wouldCycle"
      `);
      if (cycle[0]?.wouldCycle) throw new BadRequestException('Team hierarchy cycle is not allowed');
    }

    if (managerAdminId) {
      await this.assertAdminExists(managerAdminId);
      if (!actor.hasWildcard && managerAdminId !== actor.id) {
        throw new ForbiddenException('A manager cannot assign another manager to their team');
      }
    }

    try {
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE admin_teams
        SET
          code = ${code},
          name = ${name},
          description = ${description},
          parent_team_id = ${parentTeamId}::uuid,
          manager_admin_id = ${managerAdminId}::uuid,
          updated_at = NOW()
        WHERE id = ${teamId}::uuid
      `);
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('Team code already exists');
      throw error;
    }

    await this.audit(actorAdminId, 'UPDATE_ADMIN_TEAM', teamId, current, {
      code,
      name,
      description,
      parentTeamId,
      managerAdminId,
    });
    return { success: true, id: teamId, code, name, description, parentTeamId, managerAdminId };
  }

  async setTeamMember(
    actorAdminId: string,
    teamId: string,
    adminUserId: string,
    isLead = false,
  ) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertTeamManagedBy(actor, teamId);
    await this.assertCanManageTarget(actor, adminUserId);

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO admin_team_members (
        team_id,
        admin_user_id,
        is_lead,
        created_by_admin_id
      ) VALUES (
        ${teamId}::uuid,
        ${adminUserId}::uuid,
        ${Boolean(isLead)},
        ${actorAdminId}::uuid
      )
      ON CONFLICT (team_id, admin_user_id)
      DO UPDATE SET is_lead = EXCLUDED.is_lead
    `);
    await this.audit(actorAdminId, 'UPSERT_ADMIN_TEAM_MEMBER', adminUserId, null, {
      teamId,
      adminUserId,
      isLead: Boolean(isLead),
    });
    return { success: true, teamId, adminUserId, isLead: Boolean(isLead) };
  }

  async removeTeamMember(actorAdminId: string, teamId: string, adminUserId: string) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertTeamManagedBy(actor, teamId);
    await this.assertCanManageTarget(actor, adminUserId);
    const changed = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM admin_team_members
      WHERE team_id = ${teamId}::uuid
        AND admin_user_id = ${adminUserId}::uuid
    `);
    await this.audit(actorAdminId, 'REMOVE_ADMIN_TEAM_MEMBER', adminUserId, null, {
      teamId,
      adminUserId,
      changed: Number(changed) > 0,
    });
    return { success: true, changed: Number(changed) > 0 };
  }

  async setReportingLine(
    actorAdminId: string,
    subordinateAdminId: string,
    managerAdminId?: string | null,
  ) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertAdminExists(subordinateAdminId);
    const managerId = this.optionalId(managerAdminId);
    if (managerId === subordinateAdminId) {
      throw new BadRequestException('An admin cannot report to themselves');
    }

    const current = await this.prisma.$queryRaw<Array<{ managerAdminId: string }>>(Prisma.sql`
      SELECT manager_admin_id AS "managerAdminId"
      FROM admin_reporting_lines
      WHERE subordinate_admin_id = ${subordinateAdminId}::uuid
      LIMIT 1
    `);
    if (!actor.hasWildcard) {
      const currentManagerId = current[0]?.managerAdminId ?? null;
      if (managerId !== actor.id && currentManagerId !== actor.id) {
        throw new ForbiddenException(
          'A manager can only create or change their own direct reporting lines',
        );
      }
    }

    if (managerId) {
      await this.assertAdminExists(managerId);
      const manager = await this.actorContext(managerId);
      if (!manager.hasWildcard && !manager.permissions.has('admin.subordinates.manage')) {
        throw new ForbiddenException(
          'Selected manager does not have subordinate management permission',
        );
      }
      await this.prisma.$executeRaw(Prisma.sql`
        INSERT INTO admin_reporting_lines (
          manager_admin_id,
          subordinate_admin_id,
          created_by_admin_id
        ) VALUES (
          ${managerId}::uuid,
          ${subordinateAdminId}::uuid,
          ${actorAdminId}::uuid
        )
        ON CONFLICT (subordinate_admin_id)
        DO UPDATE SET
          manager_admin_id = EXCLUDED.manager_admin_id,
          created_by_admin_id = EXCLUDED.created_by_admin_id,
          created_at = NOW()
      `);
    } else {
      await this.prisma.$executeRaw(Prisma.sql`
        DELETE FROM admin_reporting_lines
        WHERE subordinate_admin_id = ${subordinateAdminId}::uuid
      `);
    }

    await this.audit(actorAdminId, 'SET_ADMIN_REPORTING_LINE', subordinateAdminId, current[0] ?? null, {
      managerAdminId: managerId,
    });
    return { success: true, subordinateAdminId, managerAdminId: managerId };
  }

  async upsertPermissionOverride(
    actorAdminId: string,
    adminUserId: string,
    permissionCodeInput: string,
    effect: 'ALLOW' | 'DENY',
    reasonInput: string,
    expiresAtInput?: string | null,
  ) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertCanManageTarget(actor, adminUserId);
    const permissionCode = this.requiredText(permissionCodeInput, 'Permission code', 120);
    const reason = this.requiredText(reasonInput, 'Reason', 500, 5);
    if (!['ALLOW', 'DENY'].includes(effect)) {
      throw new BadRequestException('Permission override effect must be ALLOW or DENY');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
      select: { code: true },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    if (effect === 'ALLOW' && !actor.hasWildcard && !actor.permissions.has(permissionCode)) {
      throw new ForbiddenException('A manager cannot allow a permission they do not have');
    }

    const expiresAt = expiresAtInput ? new Date(expiresAtInput) : null;
    if (expiresAtInput && !Number.isFinite(expiresAt?.getTime())) {
      throw new BadRequestException('Invalid permission override expiry');
    }
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('Permission override expiry must be in the future');
    }

    const existing = await this.prisma.$queryRaw<OverrideRow[]>(Prisma.sql`
      SELECT
        id,
        admin_user_id AS "adminUserId",
        permission_code AS "permissionCode",
        effect,
        reason,
        expires_at AS "expiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM admin_permission_overrides
      WHERE admin_user_id = ${adminUserId}::uuid
        AND permission_code = ${permissionCode}
      LIMIT 1
    `);
    const id = existing[0]?.id ?? randomUUID();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO admin_permission_overrides (
        id,
        admin_user_id,
        permission_code,
        effect,
        reason,
        expires_at,
        created_by_admin_id
      ) VALUES (
        ${id}::uuid,
        ${adminUserId}::uuid,
        ${permissionCode},
        ${effect},
        ${reason},
        ${expiresAt},
        ${actorAdminId}::uuid
      )
      ON CONFLICT (admin_user_id, permission_code)
      DO UPDATE SET
        effect = EXCLUDED.effect,
        reason = EXCLUDED.reason,
        expires_at = EXCLUDED.expires_at,
        created_by_admin_id = EXCLUDED.created_by_admin_id,
        updated_at = NOW()
    `);
    await this.audit(actorAdminId, 'SET_ADMIN_PERMISSION_OVERRIDE', adminUserId, existing[0] ?? null, {
      permissionCode,
      effect,
      reason,
      expiresAt: expiresAt?.toISOString() ?? null,
    });
    return { success: true, id, adminUserId, permissionCode, effect, reason, expiresAt };
  }

  async deletePermissionOverride(
    actorAdminId: string,
    adminUserId: string,
    permissionCodeInput: string,
  ) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertCanManageTarget(actor, adminUserId);
    const permissionCode = this.requiredText(permissionCodeInput, 'Permission code', 120);
    const existing = await this.prisma.$queryRaw<OverrideRow[]>(Prisma.sql`
      SELECT
        id,
        admin_user_id AS "adminUserId",
        permission_code AS "permissionCode",
        effect,
        reason,
        expires_at AS "expiresAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM admin_permission_overrides
      WHERE admin_user_id = ${adminUserId}::uuid
        AND permission_code = ${permissionCode}
      LIMIT 1
    `);
    const changed = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM admin_permission_overrides
      WHERE admin_user_id = ${adminUserId}::uuid
        AND permission_code = ${permissionCode}
    `);
    await this.audit(actorAdminId, 'DELETE_ADMIN_PERMISSION_OVERRIDE', adminUserId, existing[0] ?? null, {
      permissionCode,
      changed: Number(changed) > 0,
    });
    return { success: true, changed: Number(changed) > 0 };
  }

  async updateAccessProfile(
    actorAdminId: string,
    adminUserId: string,
    scopeInput: Record<string, unknown>,
    approvalLimitsInput: Record<string, unknown>,
    reasonInput: string,
  ) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertCanManageTarget(actor, adminUserId);
    const reason = this.requiredText(reasonInput, 'Reason', 500, 5);
    const scope = this.jsonObject(scopeInput, 'Scope');
    const approvalLimits = this.jsonObject(approvalLimitsInput, 'Approval limits');

    const existing = await this.prisma.$queryRaw<Array<{
      scope: Prisma.JsonObject;
      approvalLimits: Prisma.JsonObject;
    }>>(Prisma.sql`
      SELECT scope, approval_limits AS "approvalLimits"
      FROM admin_access_profiles
      WHERE admin_user_id = ${adminUserId}::uuid
      LIMIT 1
    `);

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO admin_access_profiles (
        admin_user_id,
        scope,
        approval_limits,
        updated_by_admin_id
      ) VALUES (
        ${adminUserId}::uuid,
        ${JSON.stringify(scope)}::jsonb,
        ${JSON.stringify(approvalLimits)}::jsonb,
        ${actorAdminId}::uuid
      )
      ON CONFLICT (admin_user_id)
      DO UPDATE SET
        scope = EXCLUDED.scope,
        approval_limits = EXCLUDED.approval_limits,
        updated_by_admin_id = EXCLUDED.updated_by_admin_id,
        updated_at = NOW()
    `);
    await this.audit(actorAdminId, 'UPDATE_ADMIN_ACCESS_PROFILE', adminUserId, existing[0] ?? null, {
      scope,
      approvalLimits,
      reason,
    });
    return { success: true, adminUserId, scope, approvalLimits };
  }

  private async actorContext(adminUserId: string): Promise<ActorContext> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        roles: {
          select: {
            role: {
              select: {
                code: true,
                permissions: { select: { permission: { select: { code: true } } } },
              },
            },
          },
        },
      },
    });
    if (!admin) throw new ForbiddenException('Acting admin account not found');
    const roleCodes = admin.roles.map((item) => item.role.code);
    const permissions = new Set(
      admin.roles.flatMap((item) =>
        item.role.permissions.map((permission) => permission.permission.code),
      ),
    );
    const protectedRole = roleCodes.some((code) => PROTECTED_ROLE_CODES.has(code));
    return {
      id: admin.id,
      protected: protectedRole,
      hasWildcard: protectedRole || permissions.has('*'),
      permissions,
    };
  }

  private async assertCanManageTarget(actor: ActorContext, targetAdminId: string) {
    await this.assertAdminExists(targetAdminId);
    if (actor.hasWildcard || actor.id === targetAdminId) return;
    const reporting = await this.prisma.$queryRaw<Array<{ allowed: boolean }>>(Prisma.sql`
      SELECT EXISTS(
        SELECT 1
        FROM admin_reporting_lines
        WHERE manager_admin_id = ${actor.id}::uuid
          AND subordinate_admin_id = ${targetAdminId}::uuid
      ) AS allowed
    `);
    if (!reporting[0]?.allowed) {
      throw new ForbiddenException('A manager can only manage their direct subordinates');
    }
  }

  private async assertTeamManagedBy(
    actor: ActorContext,
    teamId: string,
    known?: {
      id: string;
      managerAdminId: string | null;
    },
  ) {
    const team = known ?? (await this.findTeam(teamId));
    if (!actor.hasWildcard && team.managerAdminId !== actor.id) {
      throw new ForbiddenException('A manager can only manage their own teams');
    }
  }

  private async findTeam(teamId: string) {
    const rows = await this.prisma.$queryRaw<Array<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      parentTeamId: string | null;
      managerAdminId: string | null;
    }>>(Prisma.sql`
      SELECT
        id,
        code,
        name,
        description,
        parent_team_id AS "parentTeamId",
        manager_admin_id AS "managerAdminId"
      FROM admin_teams
      WHERE id = ${teamId}::uuid
      LIMIT 1
    `);
    if (!rows[0]) throw new NotFoundException('Admin team not found');
    return rows[0];
  }

  private async assertTeamExists(teamId: string) {
    await this.findTeam(teamId);
  }

  private async assertAdminExists(adminUserId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: { id: true },
    });
    if (!admin) throw new NotFoundException('Admin user not found');
  }

  private normalizeCode(value: string) {
    const code = String(value ?? '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(code)) {
      throw new BadRequestException('Invalid team code');
    }
    return code;
  }

  private requiredText(value: unknown, label: string, max: number, min = 1) {
    const text = String(value ?? '').trim();
    if (text.length < min) throw new BadRequestException(`${label} is required`);
    if (text.length > max) throw new BadRequestException(`${label} is too long`);
    return text;
  }

  private optionalText(value: unknown, max: number) {
    if (value === null || value === undefined || value === '') return null;
    const text = String(value).trim();
    if (text.length > max) throw new BadRequestException('Text is too long');
    return text || null;
  }

  private optionalId(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim() || null;
  }

  private jsonObject(value: Record<string, unknown>, label: string) {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      throw new BadRequestException(`${label} must be an object`);
    }
    const serialized = JSON.stringify(value);
    if (Buffer.byteLength(serialized, 'utf8') > MAX_JSON_BYTES) {
      throw new BadRequestException(`${label} is too large`);
    }
    return JSON.parse(serialized) as Prisma.JsonObject;
  }

  private async audit(
    actorAdminId: string,
    action: string,
    targetId: string,
    oldData: unknown,
    newData: unknown,
  ) {
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: actorAdminId,
        action,
        module: 'admin-access',
        targetId,
        oldData: (oldData ?? undefined) as Prisma.InputJsonValue | undefined,
        newData: (newData ?? undefined) as Prisma.InputJsonValue | undefined,
      }),
    });
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      String((error as { code?: unknown }).code) === '23505'
    );
  }
}
