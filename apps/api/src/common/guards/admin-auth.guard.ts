import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { resolveAdminEffectivePermissions } from '../../modules/admin-access/admin-effective-access';
import { resolveJwtAccessKey } from '../security/jwt-access-key';

const HIGH_RISK_ROLE_CODES = new Set([
  'owner',
  'super_admin',
  'system_admin',
  'manager',
  'deposit_withdrawal',
  'operations_manager',
  'finance_reviewer',
  'finance_operator',
  'risk_analyst',
  'security_admin',
  'access_manager',
]);

const HIGH_RISK_PERMISSIONS = new Set([
  '*',
  'admin.create',
  'admin.access.manage',
  'admin.permissions.override',
  'admin.subordinates.manage',
  'roles.update',
  'wallet.adjust',
  'withdraw.approve',
  'withdraw.success',
  'settings.security.update',
  'security.antibot.update',
  'security.antibot.override',
]);

const TWO_FACTOR_BOOTSTRAP_PATHS = [
  '/admin/auth/2fa/setup',
  '/admin/auth/2fa/enable',
  '/admin/auth/logout',
  '/admin/auth/me',
];

type ActiveDelegation = {
  id: string;
  permissionCodes: string[];
  grantorAdminId: string;
  expiresAt: Date;
};

type AdminAccessPolicyState = {
  overrides: Array<{
    permissionCode: string;
    effect: 'ALLOW' | 'DENY';
    expiresAt: Date | null;
  }>;
  scope: Prisma.JsonObject;
  approvalLimits: Prisma.JsonObject;
  teamIds: string[];
  managerAdminId: string | null;
  subordinateAdminIds: string[];
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.getBearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing admin authorization header');

    let payload: { type?: string; sub?: string; sessionId?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: resolveJwtAccessKey(this.configService),
      });
    } catch (error) {
      console.error('admin token verification failed', error);
      throw new UnauthorizedException('Invalid or expired admin token');
    }

    if (payload.type !== 'ADMIN' || !payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid admin token');
    }

    const session = await this.prisma.authSession.findFirst({
      where: {
        id: payload.sessionId,
        adminUserId: payload.sub,
        type: 'ADMIN',
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        adminUser: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session?.adminUser || session.adminUser.status !== 'ACTIVE') {
      throw new UnauthorizedException('Admin session is not active');
    }

    const roleCodes = session.adminUser.roles.map((adminRole) => adminRole.role.code);
    const directPermissions = session.adminUser.roles.flatMap((adminRole) =>
      adminRole.role.permissions.map((rolePermission) => rolePermission.permission.code),
    );
    const [delegationsReceived, accessPolicy] = await Promise.all([
      this.loadActiveDelegations(session.adminUser.id),
      this.loadAccessPolicy(session.adminUser.id),
    ]);
    const delegatedPermissions = delegationsReceived.flatMap((delegation) => delegation.permissionCodes);
    const resolvedAccess = resolveAdminEffectivePermissions({
      rolePermissionCodes: directPermissions,
      delegatedPermissionCodes: delegatedPermissions,
      roleCodes,
      overrides: accessPolicy.overrides,
    });
    const permissions = resolvedAccess.permissions;
    const policyRequiresTwoFactor =
      roleCodes.some((code) => HIGH_RISK_ROLE_CODES.has(code)) ||
      permissions.some((code) => HIGH_RISK_PERMISSIONS.has(code));
    const twoFactorEnforcementEnabled =
      String(this.configService.get<string>('ADMIN_2FA_ENFORCEMENT_ENABLED') ?? 'false').toLowerCase() === 'true';
    const requiresTwoFactor = twoFactorEnforcementEnabled && policyRequiresTwoFactor;

    request.user = {
      id: session.adminUser.id,
      type: 'ADMIN',
      sessionId: session.id,
      username: session.adminUser.username,
      permissions,
      deniedPermissions: resolvedAccess.deniedPermissions,
      roleCodes,
      twoFactorEnabled: session.adminUser.twoFactorEnabled,
      requiresTwoFactor,
      twoFactorPolicyApplies: policyRequiresTwoFactor,
      twoFactorEnforcementEnabled,
      delegated: delegationsReceived.length > 0,
      delegationIds: delegationsReceived.map((delegation) => delegation.id),
      scope: accessPolicy.scope,
      approvalLimits: accessPolicy.approvalLimits,
      teamIds: accessPolicy.teamIds,
      managerAdminId: accessPolicy.managerAdminId,
      subordinateAdminIds: accessPolicy.subordinateAdminIds,
    };

    if (requiresTwoFactor && !session.adminUser.twoFactorEnabled && !this.isTwoFactorBootstrapPath(request.url)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ADMIN_2FA_REQUIRED',
        message: 'Two-factor authentication must be enabled before using privileged admin features',
      });
    }

    return true;
  }

  private async loadActiveDelegations(adminUserId: string): Promise<ActiveDelegation[]> {
    try {
      return await this.prisma.adminDelegation.findMany({
        where: {
          delegateAdminId: adminUserId,
          status: 'ACTIVE',
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          permissionCodes: true,
          grantorAdminId: true,
          expiresAt: true,
        },
      });
    } catch (error) {
      console.error('admin delegation lookup failed; continuing without delegated permissions', error);
      return [];
    }
  }

  private async loadAccessPolicy(adminUserId: string): Promise<AdminAccessPolicyState> {
    try {
      const [overrides, profiles, memberships, reporting] = await Promise.all([
        this.prisma.$queryRaw<AdminAccessPolicyState['overrides']>(Prisma.sql`
          SELECT
            permission_code AS "permissionCode",
            effect,
            expires_at AS "expiresAt"
          FROM admin_permission_overrides
          WHERE admin_user_id = ${adminUserId}::uuid
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY permission_code ASC
        `),
        this.prisma.$queryRaw<Array<{ scope: Prisma.JsonObject; approvalLimits: Prisma.JsonObject }>>(Prisma.sql`
          SELECT
            scope,
            approval_limits AS "approvalLimits"
          FROM admin_access_profiles
          WHERE admin_user_id = ${adminUserId}::uuid
          LIMIT 1
        `),
        this.prisma.$queryRaw<Array<{ teamId: string }>>(Prisma.sql`
          SELECT team_id AS "teamId"
          FROM admin_team_members
          WHERE admin_user_id = ${adminUserId}::uuid
          ORDER BY team_id ASC
        `),
        this.prisma.$queryRaw<Array<{ managerAdminId: string | null; subordinateAdminIds: string[] | null }>>(Prisma.sql`
          SELECT
            (SELECT manager_admin_id FROM admin_reporting_lines WHERE subordinate_admin_id = ${adminUserId}::uuid LIMIT 1) AS "managerAdminId",
            (SELECT ARRAY_AGG(subordinate_admin_id ORDER BY subordinate_admin_id) FROM admin_reporting_lines WHERE manager_admin_id = ${adminUserId}::uuid) AS "subordinateAdminIds"
        `),
      ]);

      return {
        overrides,
        scope: profiles[0]?.scope ?? {},
        approvalLimits: profiles[0]?.approvalLimits ?? {},
        teamIds: memberships.map((membership) => membership.teamId),
        managerAdminId: reporting[0]?.managerAdminId ?? null,
        subordinateAdminIds: reporting[0]?.subordinateAdminIds ?? [],
      };
    } catch (error) {
      console.error('admin access policy lookup failed; rejecting the admin session', error);
      throw new UnauthorizedException('Admin access policy is unavailable');
    }
  }

  private isTwoFactorBootstrapPath(value?: string) {
    const path = String(value ?? '').split('?')[0];
    return TWO_FACTOR_BOOTSTRAP_PATHS.some((allowed) => path === allowed || path.endsWith(allowed));
  }

  private getBearerToken(value?: string): string | null {
    if (!value) return null;
    const [scheme, token] = value.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
