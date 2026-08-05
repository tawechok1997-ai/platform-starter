import { getRequestMeta } from '../../common/http/request-meta';
import { AdminAuthController } from './admin-auth.controller';

function controller() {
  return new AdminAuthController(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
}

describe('AdminAuthController request and cookie handling', () => {
  it('uses Express resolved req.ip instead of trusting x-forwarded-for directly', () => {
    const meta = getRequestMeta({
      ip: '203.0.113.10',
      socket: { remoteAddress: '10.0.0.4' },
      headers: { 'x-forwarded-for': '198.51.100.20' },
    } as any);

    expect(meta.ipAddress).toBe('203.0.113.10');
  });

  it('falls back to the socket address when Express has no resolved IP', () => {
    const meta = getRequestMeta({ socket: { remoteAddress: '10.0.0.4' }, headers: {} } as any);
    expect(meta.ipAddress).toBe('10.0.0.4');
  });

  it('sets and reads an HttpOnly refresh cookie', () => {
    const instance = controller();
    const response = { setHeader: jest.fn() };
    (instance as any).setRefreshCookie(response, 'session.raw-token');

    const cookie = response.setHeader.mock.calls[0][1];
    expect(cookie).toContain('platform_admin_refresh=session.raw-token');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect((instance as any).readRefreshCookie({ headers: { cookie } })).toBe('session.raw-token');
  });

  it('keeps Admin Login anti-bot disabled until explicitly enabled', async () => {
    const previous = process.env.ADMIN_LOGIN_ANTI_BOT_ENABLED;
    const login = {
      signIn: jest.fn().mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
    };
    const antiBot = { assertValid: jest.fn().mockResolvedValue({ required: true, success: true }) };
    const loginDefense = { assertAllowed: jest.fn().mockResolvedValue(undefined) };
    const instance = new AdminAuthController(
      login as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      antiBot as any,
      loginDefense as any,
    );
    const dto = { username: 'admin', secret: 'secret', deviceId: 'web-admin' } as any;
    const request = { ip: '203.0.113.10', socket: { remoteAddress: '10.0.0.4' }, headers: {} } as any;
    const response = { setHeader: jest.fn() };

    try {
      delete process.env.ADMIN_LOGIN_ANTI_BOT_ENABLED;
      await instance.signIn(dto, request, response);
      expect(antiBot.assertValid).not.toHaveBeenCalled();

      process.env.ADMIN_LOGIN_ANTI_BOT_ENABLED = 'true';
      await instance.signIn(dto, request, response);
      expect(antiBot.assertValid).toHaveBeenCalledTimes(1);
      expect(antiBot.assertValid).toHaveBeenCalledWith('ADMIN_LOGIN', undefined, '203.0.113.10');
    } finally {
      if (previous === undefined) delete process.env.ADMIN_LOGIN_ANTI_BOT_ENABLED;
      else process.env.ADMIN_LOGIN_ANTI_BOT_ENABLED = previous;
    }
  });
});
