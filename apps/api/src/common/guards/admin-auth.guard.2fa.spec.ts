import { ForbiddenException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';

function executionContext(url: string) {
  const request: any = { headers: { authorization: 'Bearer token' }, url };
  return {
    request,
    context: {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any,
  };
}

function session(options: { roleCode: string; permissions: string[]; twoFactorEnabled: boolean }) {
  return {
    id: 'session-1',
    adminUser: {
      id: 'admin-1',
      username: 'admin',
      status: 'ACTIVE',
      twoFactorEnabled: options.twoFactorEnabled,
      roles: [
        {
          role: {
            code: options.roleCode,
            permissions: options.permissions.map((code) => ({ permission: { code } })),
          },
        },
      ],
    },
  };
}

describe('AdminAuthGuard privileged 2FA enforcement', () => {
  const jwtService = { verifyAsync: jest.fn().mockResolvedValue({ type: 'ADMIN', sub: 'admin-1', sessionId: 'session-1' }) } as any;
  const configService = { get: jest.fn().mockReturnValue('test-key') } as any;

  beforeEach(() => jest.clearAllMocks());

  it('blocks privileged admins from protected routes until 2FA is enabled', async () => {
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue(session({ roleCode: 'super_admin', permissions: ['*'], twoFactorEnabled: false })),
      },
    } as any;
    const guard = new AdminAuthGuard(jwtService, configService, prisma);
    const { context } = executionContext('/admin/access/overview');

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('allows privileged admins to reach the 2FA setup flow', async () => {
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue(session({ roleCode: 'super_admin', permissions: ['*'], twoFactorEnabled: false })),
      },
    } as any;
    const guard = new AdminAuthGuard(jwtService, configService, prisma);
    const { context, request } = executionContext('/admin/auth/2fa/setup');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user.requiresTwoFactor).toBe(true);
    expect(request.user.twoFactorEnabled).toBe(false);
  });

  it('allows privileged admins after 2FA is enabled', async () => {
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue(session({ roleCode: 'finance_reviewer', permissions: ['withdraw.approve'], twoFactorEnabled: true })),
      },
    } as any;
    const guard = new AdminAuthGuard(jwtService, configService, prisma);
    const { context } = executionContext('/admin/withdrawals');

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('does not force 2FA on a low-risk read-only admin', async () => {
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue(session({ roleCode: 'viewer', permissions: ['reports.view'], twoFactorEnabled: false })),
      },
    } as any;
    const guard = new AdminAuthGuard(jwtService, configService, prisma);
    const { context } = executionContext('/admin/reports');

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
