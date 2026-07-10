import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

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

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_access_key' });
      if (payload.type !== 'ADMIN' || !payload.sub || !payload.sessionId) throw new UnauthorizedException('Invalid admin token');

      const session = await this.prisma.authSession.findFirst({
        where: { id: payload.sessionId, adminUserId: payload.sub, type: 'ADMIN', revokedAt: null, expiresAt: { gt: new Date() } },
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

      if (!session?.adminUser || session.adminUser.status !== 'ACTIVE') throw new UnauthorizedException('Admin session is not active');

      const permissions = Array.from(new Set(session.adminUser.roles.flatMap((adminRole) => adminRole.role.permissions.map((rolePermission) => rolePermission.permission.code))));

      request.user = {
        id: session.adminUser.id,
        type: 'ADMIN',
        sessionId: session.id,
        username: session.adminUser.username,
        permissions: permissions.length > 0 ? permissions : ['*'],
      };

      return true;
    } catch (error) {
      console.error('admin auth guard failed', error);
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }

  private getBearerToken(value?: string): string | null {
    if (!value) return null;
    const [scheme, token] = value.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
