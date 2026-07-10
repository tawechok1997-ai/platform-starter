import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MemberAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.getBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing authorization header');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_access_key',
      });

      if (payload.type !== 'MEMBER' || !payload.sub || !payload.sessionId) {
        throw new UnauthorizedException('Invalid member token');
      }

      const session = await this.prisma.authSession.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          type: 'MEMBER',
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!session?.user || session.user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Member session is not active');
      }

      request.user = {
        id: session.user.id,
        type: 'MEMBER',
        sessionId: session.id,
        username: session.user.username,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired member token');
    }
  }

  private getBearerToken(value?: string): string | null {
    if (!value) return null;
    const [scheme, token] = value.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
