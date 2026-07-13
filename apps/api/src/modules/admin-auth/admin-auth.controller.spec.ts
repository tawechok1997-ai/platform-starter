import { AdminAuthController } from './admin-auth.controller';

describe('AdminAuthController client IP handling', () => {
  it('uses Express resolved req.ip instead of trusting x-forwarded-for directly', () => {
    const controller = new AdminAuthController({} as any, {} as any, {} as any);
    const clientIp = (controller as any).clientIp({
      ip: '203.0.113.10',
      socket: { remoteAddress: '10.0.0.4' },
      headers: { 'x-forwarded-for': '198.51.100.20' },
    });

    expect(clientIp).toBe('203.0.113.10');
  });

  it('falls back to the socket address when Express has no resolved IP', () => {
    const controller = new AdminAuthController({} as any, {} as any, {} as any);
    expect((controller as any).clientIp({ socket: { remoteAddress: '10.0.0.4' }, headers: {} })).toBe('10.0.0.4');
  });
  it('sets and reads an HttpOnly refresh cookie', () => {
    const controller = new AdminAuthController({} as any, {} as any, {} as any);
    const response = { setHeader: jest.fn() };
    (controller as any).setRefreshCookie(response, 'session.raw-token');

    const cookie = response.setHeader.mock.calls[0][1];
    expect(cookie).toContain('platform_admin_refresh=session.raw-token');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect((controller as any).readRefreshCookie({ headers: { cookie } })).toBe('session.raw-token');
  });
});
