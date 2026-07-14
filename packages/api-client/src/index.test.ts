import assert from "node:assert/strict";
import { ApiClientError, ApiTimeoutError, createApiClient, joinApiUrl, mergeHeaders } from "./index";

async function run() {
  assert.equal(joinApiUrl("https://api.example.com/", "/admin/auth/me"), "https://api.example.com/admin/auth/me");
  assert.equal(joinApiUrl("https://api.example.com", "member/profile"), "https://api.example.com/member/profile");

  const headers = mergeHeaders({ "x-source": "admin", authorization: "Bearer old" }, { authorization: "Bearer new" });
  assert.equal(headers.get("x-source"), "admin");
  assert.equal(headers.get("authorization"), "Bearer new");

  const calls: string[] = [];
  const client = createApiClient({
    baseUrl: "https://api.example.com",
    getAuthToken: () => "token-1",
    getRequestId: () => "request-1",
    fetchImpl: (async (url, init) => {
      calls.push(String(url));
      const requestHeaders = new Headers(init?.headers);
      assert.equal(requestHeaders.get("authorization"), "Bearer token-1");
      assert.equal(requestHeaders.get("x-request-id"), "request-1");
      return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
    }) as typeof fetch,
  });
  assert.deepEqual(await client.request<{ ok: boolean }>("/health"), { ok: true });
  assert.deepEqual(calls, ["https://api.example.com/health"]);

  let retries = 0;
  const retryClient = createApiClient({
    baseUrl: "https://api.example.com",
    retry: 1,
    fetchImpl: (async () => {
      retries += 1;
      return new Response(JSON.stringify({ message: "temporary" }), {
        status: retries === 1 ? 503 : 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  });
  assert.deepEqual(await retryClient.request("/retry"), { message: "temporary" });
  assert.equal(retries, 2);

  let token = "expired";
  const refreshedClient = createApiClient({
    baseUrl: "https://api.example.com",
    getAuthToken: () => token,
    refreshAuthToken: () => {
      token = "fresh";
      return token;
    },
    fetchImpl: (async (_url, init) => {
      const authorization = new Headers(init?.headers).get("authorization");
      if (authorization === "Bearer expired") {
        return new Response(JSON.stringify({ message: "expired" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ token }), { headers: { "content-type": "application/json" } });
    }) as typeof fetch,
  });
  assert.deepEqual(await refreshedClient.request("/me"), { token: "fresh" });

  let cachedCalls = 0;
  const cachedClient = createApiClient({
    baseUrl: "https://api.example.com",
    responseCacheTtlMs: 1000,
    fetchImpl: (async () => {
      cachedCalls += 1;
      return new Response(JSON.stringify({ cachedCalls }), { headers: { "content-type": "application/json" } });
    }) as typeof fetch,
  });
  assert.deepEqual(await cachedClient.request("/cached"), { cachedCalls: 1 });
  assert.deepEqual(await cachedClient.request("/cached"), { cachedCalls: 1 });
  assert.equal(cachedCalls, 1);
  cachedClient.clearCache();
  assert.deepEqual(await cachedClient.request("/cached"), { cachedCalls: 2 });

  const errorClient = createApiClient({
    baseUrl: "https://api.example.com",
    fetchImpl: (async () => new Response(JSON.stringify({ code: "FORBIDDEN", message: "forbidden", requestId: "req-403" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    })) as typeof fetch,
  });
  await assert.rejects(errorClient.request("/forbidden"), (error: unknown) => {
    assert.ok(error instanceof ApiClientError);
    const clientError = error as ApiClientError;
    assert.equal(clientError.status, 403);
    assert.equal(clientError.code, "FORBIDDEN");
    assert.equal(clientError.requestId, "req-403");
    assert.equal(clientError.message, "forbidden");
    return true;
  });

  let uploadBody: BodyInit | null | undefined;
  const binaryClient = createApiClient({
    baseUrl: "https://api.example.com",
    fetchImpl: (async (_url, init) => {
      uploadBody = init?.body;
      if (init?.method === "POST") {
        return new Response(JSON.stringify({ uploaded: true }), { headers: { "content-type": "application/json" } });
      }
      return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "application/octet-stream" } });
    }) as typeof fetch,
  });
  assert.deepEqual(await binaryClient.upload("/files", new Blob(["hello"])), { uploaded: true });
  assert.ok(uploadBody instanceof Blob);
  assert.deepEqual([...new Uint8Array(await binaryClient.download("/files/1"))], [1, 2, 3]);

  const timeoutClient = createApiClient({
    baseUrl: "https://api.example.com",
    timeoutMs: 5,
    fetchImpl: ((_, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason ?? new DOMException("Aborted", "AbortError")), { once: true });
    })) as typeof fetch,
  });
  await assert.rejects(timeoutClient.request("/slow"), (error: unknown) => {
    assert.ok(error instanceof ApiTimeoutError);
    assert.equal((error as ApiTimeoutError).timeoutMs, 5);
    return true;
  });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
