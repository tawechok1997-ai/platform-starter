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
  );
}

describe('AdminAuthController client IP handling', () => {
  it('uses Express resolved req.ip instead of trusting x-forwarded-for directly', () => {
    const instance = controller();
    const clientIp = (instance as any).clientIp({
      ip: '203.0.113.10',
      socket: { remoteAddress: '10.0.0.4' },
      headers: { 'x-forwarded-for': '198.51.100.20' },
    });

    expect(clientIp).toBe('203.0.113.10');
  });

  it('falls back to the socket address when Express has no resolved IP', () => {
    const instance = controller();
    expect((instance as any).clientIp({ socket: { remoteAddress: '10.0.0.4' }, headers: {} })).toBe('10.0.0.4');
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
});
