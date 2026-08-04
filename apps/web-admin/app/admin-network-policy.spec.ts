import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_MAX_RETRY_AFTER_MS,
  ADMIN_RETRY_DELAY_MS,
  AdminRequestTimeoutError,
  adminRetryDelayMs,
  executeAdminRequest,
  isAdminReadOnlyMethod,
  shouldRetryAdminStatus,
} from './admin-network-policy';

test('only read-only requests can retry temporary failures', () => {
  assert.equal(isAdminReadOnlyMethod(undefined), true);
  assert.equal(isAdminReadOnlyMethod('GET'), true);
  assert.equal(isAdminReadOnlyMethod('head'), true);
  assert.equal(isAdminReadOnlyMethod('POST'), false);
  assert.equal(shouldRetryAdminStatus(503, 'GET', 0), true);
  assert.equal(shouldRetryAdminStatus(503, 'GET', 1), false);
  assert.equal(shouldRetryAdminStatus(503, 'PATCH', 0), false);
  assert.equal(shouldRetryAdminStatus(401, 'GET', 0), false);
  assert.equal(shouldRetryAdminStatus(403, 'GET', 0), false);
});

test('read requests retry one temporary response and then return the next response', async () => {
  let calls = 0;
  const delays: number[] = [];
  const fetchImpl = (async () => {
    calls += 1;
    return calls === 1
      ? new Response('{}', { status: 503, headers: { 'retry-after': '30' } })
      : new Response('{"ok":true}', { status: 200 });
  }) as typeof fetch;

  const response = await executeAdminRequest('/api/admin/reports', {}, {
    fetchImpl,
    sleep: async (delayMs) => { delays.push(delayMs); },
  });

  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [ADMIN_MAX_RETRY_AFTER_MS]);
});

test('read requests retry one network failure but mutations never retry automatically', async () => {
  let readCalls = 0;
  const readFetch = (async () => {
    readCalls += 1;
    if (readCalls === 1) throw new TypeError('network unavailable');
    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const readResponse = await executeAdminRequest('/api/admin/dashboard', {}, {
    fetchImpl: readFetch,
    sleep: async () => undefined,
  });
  assert.equal(readResponse.status, 204);
  assert.equal(readCalls, 2);

  let mutationCalls = 0;
  const mutationFetch = (async () => {
    mutationCalls += 1;
    throw new TypeError('network unavailable');
  }) as typeof fetch;

  await assert.rejects(
    executeAdminRequest('/api/admin/settings', { method: 'PATCH' }, {
      fetchImpl: mutationFetch,
      sleep: async () => undefined,
    }),
    /network unavailable/,
  );
  assert.equal(mutationCalls, 1);
});

test('timeouts are bounded and retry only once for read requests', async () => {
  let calls = 0;
  const fetchImpl = ((_input: RequestInfo | URL, init?: RequestInit) => {
    calls += 1;
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
  }) as typeof fetch;

  await assert.rejects(
    executeAdminRequest('/api/admin/provider-health', {}, {
      fetchImpl,
      retryLimit: 1,
      sleep: async () => undefined,
      timeoutMs: 5,
    }),
    (error: unknown) => error instanceof AdminRequestTimeoutError && error.timeoutMs === 5,
  );
  assert.equal(calls, 2);
});

test('caller cancellation is never retried', async () => {
  const controller = new AbortController();
  controller.abort(new DOMException('Cancelled', 'AbortError'));
  let calls = 0;
  const fetchImpl = ((_input: RequestInfo | URL, init?: RequestInit) => {
    calls += 1;
    return Promise.reject(init?.signal?.reason ?? new DOMException('Aborted', 'AbortError'));
  }) as typeof fetch;

  await assert.rejects(
    executeAdminRequest('/api/admin/members', { signal: controller.signal }, {
      fetchImpl,
      sleep: async () => undefined,
    }),
    /Cancelled/,
  );
  assert.equal(calls, 1);
});

test('Retry-After parsing is bounded and falls back safely', () => {
  assert.equal(adminRetryDelayMs(), ADMIN_RETRY_DELAY_MS);
  assert.equal(adminRetryDelayMs(new Response(null, { headers: { 'retry-after': '0' } })), 0);
  assert.equal(
    adminRetryDelayMs(new Response(null, { headers: { 'retry-after': '999' } })),
    ADMIN_MAX_RETRY_AFTER_MS,
  );
  assert.equal(
    adminRetryDelayMs(new Response(null, { headers: { 'retry-after': 'not-a-date' } })),
    ADMIN_RETRY_DELAY_MS,
  );
});
