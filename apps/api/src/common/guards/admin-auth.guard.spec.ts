import { UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';

function createContext(request: any) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

function activeSession(permissionCodes: string[] = []) {
  return {
    id: 'session-1',
    adminUser: {
      id: 'admin-1',
      username: 'operator',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      roles: permissionCodes.length === 0
        ? []
        : [{ role: { code: 'operator', permissions: permissionCodes.map((code) => ({ permission: { code } })) } }],
    },
  };
}

describe('AdminAuthGuard', () => {
  it('keeps empty permissions empty instead of granting wildcard access', async () => {
    const request = { headers: { authorization: 'Bearer access-token' } } as any;
    const jwtService = { verifyAsync: jest.fn().mockResolvedValue({ type: 'ADMIN', sub: 'admin-1', sessionId: 'session-1' }) } as any;
    const configService = { get: jest.fn().mockReturnValue('secret') } as any;
    const prisma = { authSession: { findFirst: jest.fn().mockResolvedValue(activeSession()) } } as any;
    const guard = new AdminAuthGuard(jwtService, configService, prisma);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user.permissions).toEqual([]);
    expect(request.user.permissions).not.toContain('*');
  });

  it.each(['owner', 'super_admin'])('grants wildcard access to protected role %s', async (roleCode) => {
    const request = { headers: { authorization: 'Bearer access-token' } } as any;
    const jwtService = { verifyAsync: jest.fn().mockResolvedValue({ type: 'ADMIN', sub: 'admin-1', sessionId: 'session-1' }) } as any;
    const configService = {
      get: jest.fn((key: string) => key === 'JWT_ACCESS_KEY' ? 'secret' : 'false'),
    } as any;
    const session = {
      ...activeSession(),
      adminUser: {
        ...activeSession().adminUser,
        roles: [{ role: { code: roleCode, permissions: [] } }],
      },
    };
    const prisma = { authSession: { findFirst: jest.fn().mockResolvedValue(session) } } as any;
    const guard = new AdminAuthGuard(jwtService, configService, prisma);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user.roleCodes).toEqual([roleCode]);
    expect(request.user.permissions).toContain('*');
  });

  it('hydrates only the distinct permissions assigned through roles', async () => {
    const request = { headers: { authorization: 'Bearer access-token' } } as any;
    const jwtService = { verifyAsync: jest.fn().mockResolvedValue({ type: 'ADMIN', sub: 'admin-1', sessionId: 'session-1' }) } as any;
    const configService = { get: jest.fn().mockReturnValue('secret') } as any;
    const session = {
      ...activeSession(),
      adminUser: {
        ...activeSession().adminUser,
        roles: [
          { role: { code: 'operator', permissions: [{ permission: { code: 'users.view' } }, { permission: { code: 'users.view' } }] } },
          { role: { code: 'reporter', permissions: [{ permission: { code: 'reports.view' } }] } },
        ],
      },
    };
    const prisma = { authSession: { findFirst: jest.fn().mockResolvedValue(session) } } as any;
    const guard = new AdminAuthGuard(jwtService, configService, prisma);

    await guard.canActivate(createContext(request));
    expect(request.user.permissions).toEqual(['users.view', 'reports.view']);
  });

  it('rejects inactive admin sessions', async () => {
    const request = { headers: { authorization: 'Bearer access-token' } } as any;
    const jwtService = { verifyAsync: jest.fn().mockResolvedValue({ type: 'ADMIN', sub: 'admin-1', sessionId: 'session-1' }) } as any;
    const configService = { get: jest.fn().mockReturnValue('secret') } as any;
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue({ ...activeSession(), adminUser: { ...activeSession().adminUser, status: 'LOCKED' } }),
      },
    } as any;
    const guard = new AdminAuthGuard(jwtService, configService, prisma);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(UnauthorizedException);
  });
});
