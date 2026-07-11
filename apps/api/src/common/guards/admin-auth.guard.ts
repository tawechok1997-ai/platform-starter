import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

const SUPER_ACCESS_ROLE_CODES = new Set(['owner', 'super_admin']);

const HIGH_RISK_ROLE_CODES = new Set([
  'owner',
  'super_admin',
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
        secret: this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_access_key',
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
            delegationsReceived: {
              where: {
                status: 'ACTIVE',
                revokedAt: null,
                expiresAt: { gt: new Date() },
              },
              select: { id: true, permissionCodes: true, grantorAdminId: true, expiresAt: true },
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
    const delegationsReceived = session.adminUser.delegationsReceived ?? [];
    const delegatedPermissions = delegationsReceived.flatMap((delegation) => delegation.permissionCodes);
    const permissions = Array.from(
      new Set([
        ...directPermissions,
        ...delegatedPermissions,
        ...(roleCodes.some((code) => SUPER_ACCESS_ROLE_CODES.has(code)) ? ['*'] : []),
      ]),
    );
    const policyRequiresTwoFactor =
      roleCodes.some((code) => HIGH_RISK_ROLE_CODES.has(code)) ||
      permissions.some((code) => HIGH_RISK_PERMISSIONS.has(code));
    const twoFactorEnforcementEnabled =
      String(this.configService.get<string>('ADMIN_2FA_ENFORCEMENT_ENABLED') ?? 'true').toLowerCase() === 'true';
    const requiresTwoFactor = twoFactorEnforcementEnabled && policyRequiresTwoFactor;

    request.user = {
      id: session.adminUser.id,
      type: 'ADMIN',
      sessionId: session.id,
      username: session.adminUser.username,
      permissions,
      roleCodes,
      twoFactorEnabled: session.adminUser.twoFactorEnabled,
      requiresTwoFactor,
      twoFactorPolicyApplies: policyRequiresTwoFactor,
      twoFactorEnforcementEnabled,
      delegated: delegationsReceived.length > 0,
      delegationIds: delegationsReceived.map((delegation) => delegation.id),
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
