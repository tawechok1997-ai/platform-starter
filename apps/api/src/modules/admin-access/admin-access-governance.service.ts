import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { resolveAdminEffectivePermissions } from './admin-effective-access';

const SUPER_PERMISSION = '*';
const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);
const MAX_JSON_BYTES = 20_000;

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

type PermissionOverrideRow = {
  id: string;
  adminUserId: string;
  permissionCode: string;
  effect: 'ALLOW' | 'DENY';
  reason: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AccessProfileRow = {
  adminUserId: string;
  scope: Prisma.JsonValue;
  approvalLimits: Prisma.JsonValue;
  updatedAt: Date;
};

type ActorContext = {
  id: string;
  protected: boolean;
  hasWildcard: boolean;
  permissions: Set<string>;
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
          t.id,
          t.code,
          t.name,
          t.description,
          t.parent_team_id AS "parentTeamId",
          t.manager_admin_id AS "managerAdminId",
          manager.username AS "managerUsername",
          t.created_at AS "createdAt",
          t.updated_at AS "updatedAt",
          COUNT(member.admin_user_id) AS "memberCount"
        FROM admin_teams t
        LEFT JOIN admin_users manager ON manager.id = t.manager_admin_id
        LEFT JOIN admin_team_members member ON member.team_id = t.id
        GROUP BY t.id, manager.username
        ORDER BY t.name ASC, t.code ASC
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
      const list = membersByTeam.get(member.teamId) ?? [];
      list.push(member);
      membersByTeam.set(member.teamId, list);
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
                  select: { permission: { select: { code: true, module: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!admin) throw new NotFoundException('Admin user not found');

    const [overrides, profiles, teamMemberships, reportingLines] = await Promise.all([
      this.prisma.$queryRaw<PermissionOverrideRow[]>(Prisma.sql`
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
      this.prisma.$queryRaw<AccessProfileRow[]>(Prisma.sql`
        SELECT
          admin_user_id AS "adminUserId",
          scope,
          approval_limits AS "approvalLimits",
          updated_at AS "updatedAt"
        FROM admin_access_profiles
        WHERE admin_user_id = ${adminUserId}::uuid
        LIMIT 1
      `),
      this.prisma.$queryRaw<Array<{ teamId: string; teamCode: string; teamName: string; isLead: boolean }>>(Prisma.sql`
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
      this.prisma.$queryRaw<Array<{ managerAdminId: string | null; subordinateAdminIds: string[] | null }>>(Prisma.sql`
        SELECT
          (SELECT manager_admin_id FROM admin_reporting_lines WHERE subordinate_admin_id = ${adminUserId}::uuid LIMIT 1) AS "managerAdminId",
          (SELECT ARRAY_AGG(subordinate_admin_id ORDER BY subordinate_admin_id) FROM admin_reporting_lines WHERE manager_admin_id = ${adminUserId}::uuid) AS "subordinateAdminIds"
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
        adminUserId,
        scope: {},
        approvalLimits: {},
        updatedAt: null,
      },
      teams: teamMemberships,
      managerAdminId: reportingLines[0]?.managerAdminId ?? null,
      subordinateAdminIds: reportingLines[0]?.subordinateAdminIds ?? [],
    };
  }

  async createTeam(actorAdminId: string, input: CreateAdminTeamInput) {
    const actor = await this.actorContext(actorAdminId);
    const code = this.normalizeCode(input.code);
    const name = this.normalizeRequiredText(input.name, 'Team name', 120);
    const description = this.normalizeOptionalText(input.description, 1000);
    const parentTeamId = this.normalizeOptionalId(input.parentTeamId);
    const managerAdminId = this.normalizeOptionalId(input.managerAdminId) ?? actorAdminId;

    await this.assertAdminExists(managerAdminId);
    if (!actor.hasWildcard && managerAdminId !== actorAdminId) {
      throw new ForbiddenException('A manager can only create a team managed by themselves');
    }
    if (parentTeamId) await this.assertTeamManagedBy(actor, parentTeamId);

    const id = randomUUID();
    try {
      await this.prisma.$executeRaw(Prisma.sql`
        INSERT INTO admin_teams (
          id, code, name, description, parent_team_id, manager_admin_id, created_by_admin_id
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
    const name = input.name === undefined ? current.name : this.normalizeRequiredText(input.name, 'Team name', 120);
    const description = input.description === undefined
      ? current.description
      : this.normalizeOptionalText(input.description, 1000);
    const parentTeamId = input.parentTeamId === undefined
      ? current.parentTeamId
      : this.normalizeOptionalId(input.parentTeamId);
    const managerAdminId = input.managerAdminId === undefined
      ? current.managerAdminId
      : this.normalizeOptionalId(input.managerAdminId);

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
      if (!actor.hasWildcard && managerAdminId !== actorAdminId) {
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

  async setTeamMember(actorAdminId: string, teamId: string, adminUserId: string, isLead = false) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertTeamManagedBy(actor, teamId);
    await this.assertCanManageTarget(actor, adminUserId);

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO admin_team_members (
        team_id, admin_user_id, is_lead, created_by_admin_id
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
      WHERE team_id = ${teamId}::uuid AND admin_user_id = ${adminUserId}::uuid
    `);
    await this.audit(actorAdminId, 'REMOVE_ADMIN_TEAM_MEMBER', adminUserId, null, {
      teamId,
      adminUserId,
      changed: Number(changed) > 0,
    });
    return { success: true, changed: Number(changed) > 0 };
  }

  async setReportingLine(actorAdminId: string, subordinateAdminId: string, managerAdminId?: string | null) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertAdminExists(subordinateAdminId);
    if (subordinateAdminId === managerAdminId) {
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
      const canCreate = managerAdminId === actorAdminId;
      const canChangeExisting = currentManagerId === actorAdminId;
      if (!canCreate && !canChangeExisting) {
        throw new ForbiddenException('A manager can only create or change their own direct reporting lines');
      }
    }

    if (managerAdminId) {
      await this.assertAdminExists(managerAdminId);
      const managerContext = await this.actorContext(managerAdminId);
      if (!managerContext.hasWildcard && !managerContext.permissions.has('admin.subordinates.manage')) {
        throw new ForbiddenException('Selected manager does not have subordinate management permission');
      }
      await this.prisma.$executeRaw(Prisma.sql`
        INSERT INTO admin_reporting_lines (
          manager_admin_id, subordinate_admin_id, created_by_admin_id
        ) VALUES (
          ${managerAdminId}::uuid,
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
      managerAdminId: managerAdminId ?? null,
    });
    return { success: true, subordinateAdminId, managerAdminId: managerAdminId ?? null };
  }

  async upsertPermissionOverride(
    actorAdminId: string,
    targetAdminId: string,
    permissionCodeInput: string,
    effect: 'ALLOW' | 'DENY',
    reasonInput: string,
    expiresAtInput?: string | null,
  ) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertCanManageTarget(actor, targetAdminId);
    if (actorAdminId === targetAdminId) {
      throw new ForbiddenException('Self permission override is not allowed');
    }

    const permissionCode = this.normalizeRequiredText(permissionCodeInput, 'Permission code', 120);
    const reason = this.normalizeReason(reasonInput);
    const expiresAt = this.parseOptionalFutureDate(expiresAtInput);
    const permission = await this.prisma.permission.findUnique({ where: { code: permissionCode }, select: { code: true } });
    if (!permission) throw new NotFoundException('Permission not found');

    if (effect === 'ALLOW' && !actor.hasWildcard && !actor.permissions.has(permissionCode)) {
      throw new ForbiddenException('A manager cannot allow a permission they do not have');
    }
    if (permissionCode === SUPER_PERMISSION && !actor.hasWildcard) {
      throw new ForbiddenException('Only a wildcard administrator can modify wildcard access');
    }

    const id = randomUUID();
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
        ${targetAdminId}::uuid,
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

    await this.audit(actorAdminId, 'UPSERT_ADMIN_PERMISSION_OVERRIDE', targetAdminId, null, {
      permissionCode,
      effect,
      reason,
      expiresAt: expiresAt?.toISOString() ?? null,
    });
    return { success: true, adminUserId: targetAdminId, permissionCode, effect, reason, expiresAt };
  }

  async deletePermissionOverride(actorAdminId: string, targetAdminId: string, permissionCodeInput: string) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertCanManageTarget(actor, targetAdminId);
    const permissionCode = this.normalizeRequiredText(permissionCodeInput, 'Permission code', 120);
    const changed = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM admin_permission_overrides
      WHERE admin_user_id = ${targetAdminId}::uuid AND permission_code = ${permissionCode}
    `);
    await this.audit(actorAdminId, 'DELETE_ADMIN_PERMISSION_OVERRIDE', targetAdminId, null, {
      permissionCode,
      changed: Number(changed) > 0,
    });
    return { success: true, changed: Number(changed) > 0 };
  }

  async updateAccessProfile(
    actorAdminId: string,
    targetAdminId: string,
    scopeInput: Record<string, unknown>,
    approvalLimitsInput: Record<string, unknown>,
    reasonInput: string,
  ) {
    const actor = await this.actorContext(actorAdminId);
    await this.assertCanManageTarget(actor, targetAdminId, { allowSelfForWildcard: true });
    const reason = this.normalizeReason(reasonInput);
    const scope = this.normalizeJsonRecord(scopeInput, 'Scope');
    const approvalLimits = this.normalizeJsonRecord(approvalLimitsInput, 'Approval limits');

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO admin_access_profiles (
        admin_user_id,
        scope,
        approval_limits,
        updated_by_admin_id
      ) VALUES (
        ${targetAdminId}::uuid,
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

    await this.audit(actorAdminId, 'UPDATE_ADMIN_ACCESS_PROFILE', targetAdminId, null, {
      scope,
      approvalLimits,
      reason,
    });
    return { success: true, adminUserId: targetAdminId, scope, approvalLimits };
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
      admin.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.code)),
    );
    const hasWildcard = permissions.has(SUPER_PERMISSION) || roleCodes.some((code) => PROTECTED_ROLE_CODES.has(code));
    if (hasWildcard) permissions.add(SUPER_PERMISSION);
    return {
      id: admin.id,
      protected: roleCodes.some((code) => PROTECTED_ROLE_CODES.has(code)),
      hasWildcard,
      permissions,
    };
  }

  private async assertCanManageTarget(
    actor: ActorContext,
    targetAdminId: string,
    options: { allowSelfForWildcard?: boolean } = {},
  ) {
    const target = await this.prisma.adminUser.findUnique({
      where: { id: targetAdminId },
      select: {
        id: true,
        roles: { select: { role: { select: { code: true } } } },
      },
    });
    if (!target) throw new NotFoundException('Admin user not found');
    if (actor.id === targetAdminId) {
      if (actor.hasWildcard && options.allowSelfForWildcard) return;
      throw new ForbiddenException('An admin cannot manage their own subordinate policy');
    }

    const targetProtected = target.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code));
    if (targetProtected && !actor.hasWildcard) {
      throw new ForbiddenException('Protected owner account cannot be managed by a manager');
    }
    if (actor.hasWildcard) return;

    const reportingLine = await this.prisma.$queryRaw<Array<{ allowed: boolean }>>(Prisma.sql`
      SELECT EXISTS(
        SELECT 1
        FROM admin_reporting_lines
        WHERE manager_admin_id = ${actor.id}::uuid
          AND subordinate_admin_id = ${targetAdminId}::uuid
      ) AS allowed
    `);
    if (!reportingLine[0]?.allowed) {
      throw new ForbiddenException('A manager can only manage their direct subordinates');
    }
  }

  private async assertTeamManagedBy(actor: ActorContext, teamId: string, existing?: TeamRow) {
    const team = existing ?? await this.findTeam(teamId);
    if (actor.hasWildcard) return;
    if (team.managerAdminId !== actor.id) {
      throw new ForbiddenException('A manager can only manage teams they own');
    }
  }

  private async findTeam(teamId: string) {
    const rows = await this.prisma.$queryRaw<TeamRow[]>(Prisma.sql`
      SELECT
        t.id,
        t.code,
        t.name,
        t.description,
        t.parent_team_id AS "parentTeamId",
        t.manager_admin_id AS "managerAdminId",
        manager.username AS "managerUsername",
        t.created_at AS "createdAt",
        t.updated_at AS "updatedAt",
        0::bigint AS "memberCount"
      FROM admin_teams t
      LEFT JOIN admin_users manager ON manager.id = t.manager_admin_id
      WHERE t.id = ${teamId}::uuid
      LIMIT 1
    `);
    if (!rows[0]) throw new NotFoundException('Team not found');
    return rows[0];
  }

  private async assertTeamExists(teamId: string) {
    await this.findTeam(teamId);
  }

  private async assertAdminExists(adminUserId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId }, select: { id: true } });
    if (!admin) throw new NotFoundException('Admin user not found');
  }

  private normalizeCode(value: string) {
    const code = String(value ?? '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(code)) {
      throw new BadRequestException('Team code must use 2-80 lowercase letters, numbers, underscores or hyphens');
    }
    return code;
  }

  private normalizeRequiredText(value: unknown, label: string, maxLength: number) {
    const text = String(value ?? '').trim();
    if (!text) throw new BadRequestException(`${label} is required`);
    if (text.length > maxLength) throw new BadRequestException(`${label} must not exceed ${maxLength} characters`);
    return text;
  }

  private normalizeOptionalText(value: unknown, maxLength: number) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    if (text.length > maxLength) throw new BadRequestException(`Text must not exceed ${maxLength} characters`);
    return text;
  }

  private normalizeOptionalId(value?: string | null) {
    const id = String(value ?? '').trim();
    return id || null;
  }

  private normalizeReason(value: unknown) {
    const reason = this.normalizeRequiredText(value, 'Reason', 500);
    if (reason.length < 5) throw new BadRequestException('A reason of at least 5 characters is required');
    return reason;
  }

  private parseOptionalFutureDate(value?: string | null) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const date = new Date(text);
    if (!Number.isFinite(date.getTime())) throw new BadRequestException('Invalid expiration date');
    if (date <= new Date()) throw new BadRequestException('Expiration date must be in the future');
    return date;
  }

  private normalizeJsonRecord(value: unknown, label: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException(`${label} must be an object`);
    }
    const record = value as Record<string, unknown>;
    if (Buffer.byteLength(JSON.stringify(record), 'utf8') > MAX_JSON_BYTES) {
      throw new BadRequestException(`${label} is too large`);
    }
    return record;
  }

  private isUniqueViolation(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const record = error as { code?: unknown; meta?: { code?: unknown } };
    return String(record.code ?? '') === '23505' || String(record.meta?.code ?? '') === '23505';
  }

  private audit(
    adminUserId: string,
    action: string,
    targetId: string,
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown>,
  ) {
    return this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId,
        action,
        module: 'admin-access',
        targetId,
        oldData,
        newData,
      }),
    });
  }
}
