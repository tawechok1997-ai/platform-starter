import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService compatibility facade', () => {
  it('delegates authentication and session operations without owning crypto logic', async () => {
    const login = {
      signIn: jest.fn().mockResolvedValue({ accessToken: 'access' }),
      verifyTwoFactor: jest.fn().mockResolvedValue({ accessToken: 'access-2' }),
      assertStepUp: jest.fn().mockResolvedValue({ success: true }),
    } as any;
    const refresh = { refresh: jest.fn().mockResolvedValue({ accessToken: 'access-3' }) } as any;
    const queries = { listSessions: jest.fn().mockResolvedValue({ items: [] }) } as any;
    const commands = {
      signOut: jest.fn().mockResolvedValue({ success: true }),
      revokeSession: jest.fn().mockResolvedValue({ success: true, current: false }),
      revokeOtherSessions: jest.fn().mockResolvedValue({ success: true, revoked: 2 }),
      revokeAllSessions: jest.fn().mockResolvedValue({ success: true, revoked: 3 }),
    } as any;
    const twoFactor = {
      setup: jest.fn(), enable: jest.fn(), disable: jest.fn(), regenerateRecoveryCodes: jest.fn(),
    } as any;
    const service = new AdminAuthService(login, refresh, queries, commands, twoFactor);

    await service.signIn({ username: 'admin', secret: 'secret' } as any, { ipAddress: '127.0.0.1' });
    await service.assertStepUp('admin-1', '123456');
    await service.refreshSession('session.token');
    await service.listSessions('admin-1', 'session-1');
    await service.signOut('session-1', 'admin-1');

    expect(login.signIn).toHaveBeenCalled();
    expect(login.assertStepUp).toHaveBeenCalledWith('admin-1', '123456', {});
    expect(refresh.refresh).toHaveBeenCalledWith('session.token', {});
    expect(queries.listSessions).toHaveBeenCalledWith('admin-1', 'session-1');
    expect(commands.signOut).toHaveBeenCalledWith('session-1', 'admin-1', {});
  });
});
