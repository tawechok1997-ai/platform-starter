import assert from 'node:assert/strict';
import test from 'node:test';
import { memberApiFetch } from '../../../app/member-api';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const storage = new Map<string, string>();
const redirects: string[] = [];

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    location: {
      pathname: '/withdraw',
      search: '?step=confirm',
      hash: '#review',
      replace: (href: string) => redirects.push(href),
    },
  },
});

test.after(() => {
  globalThis.fetch = originalFetch;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
});

test('concurrent unauthorized requests share one refresh operation', async () => {
  storage.set('member_access_token', 'expired-access');
  storage.set('member_refresh_token', 'valid-refresh');
  let refreshCalls = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/member/auth/refresh')) {
      refreshCalls += 1;
      await Promise.resolve();
      return Response.json({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    }
    const authorization = new Headers(init?.headers).get('Authorization');
    return authorization === 'Bearer new-access'
      ? Response.json({ ok: true })
      : Response.json({ message: 'expired' }, { status: 401 });
  };

  const responses = await Promise.all([memberApiFetch('/member/wallet'), memberApiFetch('/member/notifications')]);

  assert.equal(refreshCalls, 1);
  assert.deepEqual(
    responses.map((response) => response.status),
    [200, 200],
  );
  assert.equal(storage.get('member_access_token'), 'new-access');
  assert.equal(storage.get('member_refresh_token'), 'new-refresh');
});

test('server failures do not clear a valid stored session', async () => {
  storage.set('member_access_token', 'valid-access');
  storage.set('member_refresh_token', 'valid-refresh');
  globalThis.fetch = async () => Response.json({ message: 'temporary failure' }, { status: 500 });

  const response = await memberApiFetch('/member/wallet');

  assert.equal(response.status, 500);
  assert.equal(storage.get('member_access_token'), 'valid-access');
  assert.equal(storage.get('member_refresh_token'), 'valid-refresh');
});

test('failed refresh clears tokens and redirects through session-expired with a safe return path', async () => {
  redirects.length = 0;
  storage.set('member_access_token', 'expired-access');
  storage.set('member_refresh_token', 'invalid-refresh');
  globalThis.fetch = async (input) =>
    String(input).endsWith('/member/auth/refresh')
      ? Response.json({ message: 'invalid refresh' }, { status: 401 })
      : Response.json({ message: 'expired' }, { status: 401 });

  await memberApiFetch('/member/wallet');

  assert.equal(storage.has('member_access_token'), false);
  assert.equal(storage.has('member_refresh_token'), false);
  assert.deepEqual(redirects, ['/session-expired?next=%2Fwithdraw%3Fstep%3Dconfirm%23review']);
});
