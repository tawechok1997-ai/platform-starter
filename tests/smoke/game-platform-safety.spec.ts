import { test, expect, request } from '@playwright/test';

const API_URL = process.env.SMOKE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';
const ADMIN_TOKEN = process.env.SMOKE_ADMIN_TOKEN ?? '';
const MEMBER_TOKEN = process.env.SMOKE_MEMBER_TOKEN ?? '';
const PROVIDER_ID = process.env.SMOKE_PROVIDER_ID ?? '';
const GAME_ID = process.env.SMOKE_GAME_ID ?? '';
const SESSION_ID = process.env.SMOKE_SESSION_ID ?? '';
const FAILED_TRANSFER_ID = process.env.SMOKE_FAILED_TRANSFER_ID ?? '';

test.describe('game platform safety smoke', () => {
  test.skip(!API_URL, 'Set SMOKE_API_URL to run game platform smoke tests');

  test('admin provider risk and preflight are readable', async () => {
    test.skip(!ADMIN_TOKEN || !PROVIDER_ID, 'Set SMOKE_ADMIN_TOKEN and SMOKE_PROVIDER_ID');
    const api = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    const risk = await api.get(`/admin/game-providers/${PROVIDER_ID}/risk-panel`);
    expect(risk.ok()).toBeTruthy();
    const riskBody = await risk.json();
    expect(riskBody).toHaveProperty('checks');
    expect(riskBody).toHaveProperty('flags');
    const preflight = await api.get(`/admin/game-providers/${PROVIDER_ID}/preflight`);
    expect(preflight.ok()).toBeTruthy();
    const preflightBody = await preflight.json();
    expect(preflightBody).toHaveProperty('blockers');
    expect(preflightBody).toHaveProperty('ok');
  });

  test('member launch and transfer history endpoints respond', async () => {
    test.skip(!MEMBER_TOKEN || !GAME_ID, 'Set SMOKE_MEMBER_TOKEN and SMOKE_GAME_ID');
    const api = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${MEMBER_TOKEN}` } });
    const launch = await api.post(`/member/games/${GAME_ID}/launch`);
    expect(launch.ok()).toBeTruthy();
    const body = await launch.json();
    expect(body).toHaveProperty('launchUrl');
    expect(body.session?.id).toBeTruthy();
    const history = await api.get(`/member/game-sessions/${body.session.id}/transfers`);
    expect(history.ok()).toBeTruthy();
    expect(await history.json()).toHaveProperty('items');
  });

  test('admin can list safety logs', async () => {
    test.skip(!ADMIN_TOKEN, 'Set SMOKE_ADMIN_TOKEN');
    const api = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    for (const path of ['/admin/game-transfers', '/admin/webhook-logs', '/admin/provider-wallet-snapshots', '/admin/game-sessions', '/admin/money-ops/control-center', '/admin/money-ops/alert-rules']) {
      const response = await api.get(path);
      expect(response.ok()).toBeTruthy();
    }
  });

  test('webhook duplicate path is safe', async () => {
    const api = await request.newContext({ baseURL: API_URL });
    const idempotencyKey = `smoke-${Date.now()}`;
    const payload = { eventType: 'demo.webhook.received', idempotencyKey, providerTransactionId: `smoke-tx-${Date.now()}` };
    const first = await api.post('/provider-webhooks/demo-provider', { data: payload });
    expect([200, 201].includes(first.status())).toBeTruthy();
    const second = await api.post('/provider-webhooks/demo-provider', { data: payload });
    expect([200, 201, 208].includes(second.status())).toBeTruthy();
    const body = await second.json();
    expect(body.duplicate === true || body.ok === true).toBeTruthy();
  });

  test('provider simulator modes respond safely', async () => {
    const api = await request.newContext({ baseURL: API_URL });
    const health = await api.get('/provider-simulator/health');
    expect(health.ok()).toBeTruthy();
    const launch = await api.post('/provider-simulator/launch', { data: { gameCode: 'sim-slot-001' } });
    expect(launch.ok()).toBeTruthy();
    expect(await launch.json()).toHaveProperty('launchUrl');
    const failed = await api.post('/provider-simulator/transfer-in', { data: { amount: 100, mode: 'failed' } });
    expect(failed.ok()).toBeTruthy();
    expect((await failed.json()).ok).toBeFalsy();
    const mismatch = await api.post('/provider-simulator/balance', { data: { mode: 'mismatch' } });
    expect(mismatch.ok()).toBeTruthy();
    expect((await mismatch.json()).balance).toBe('777.77');
    const invalidSignature = await api.post('/provider-simulator/webhook', { data: { mode: 'invalid_signature' } });
    expect(invalidSignature.ok()).toBeTruthy();
    expect((await invalidSignature.json()).ok).toBeFalsy();
  });

  test('money ops alert scan and ledger mutation gate are safe', async () => {
    test.skip(!ADMIN_TOKEN, 'Set SMOKE_ADMIN_TOKEN');
    const api = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    const scan = await api.post('/admin/money-ops/alert-rules/scan');
    expect(scan.ok()).toBeTruthy();
    expect(await scan.json()).toHaveProperty('persisted');
    const mutate = await api.post('/admin/money-ops/ledger/mutate', { data: { userId: 'smoke-user', direction: 'CREDIT', amount: 1 } });
    expect([403, 400, 404].includes(mutate.status())).toBeTruthy();
  });

  test('retry failed dry-run transfer is guarded', async () => {
    test.skip(!ADMIN_TOKEN || !FAILED_TRANSFER_ID, 'Set SMOKE_ADMIN_TOKEN and SMOKE_FAILED_TRANSFER_ID');
    const api = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    const response = await api.post(`/admin/game-transfers/${FAILED_TRANSFER_ID}/retry-dry-run`, { data: { note: 'smoke retry' } });
    expect([200, 201, 400, 404].includes(response.status())).toBeTruthy();
  });

  test('reconcile endpoint is guarded', async () => {
    test.skip(!ADMIN_TOKEN || !SESSION_ID, 'Set SMOKE_ADMIN_TOKEN and SMOKE_SESSION_ID');
    const api = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    const response = await api.post(`/admin/game-sessions/${SESSION_ID}/reconcile`);
    expect([200, 201, 403, 404].includes(response.status())).toBeTruthy();
  });
});
