import assert from "node:assert/strict";
import { ApiClientError, createApiClient, joinApiUrl, mergeHeaders } from "./index";

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
    fetchImpl: (async (url, init) => {
      calls.push(String(url));
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer token-1");
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

  const errorClient = createApiClient({
    baseUrl: "https://api.example.com",
    fetchImpl: (async () => new Response(JSON.stringify({ message: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    })) as typeof fetch,
  });
  await assert.rejects(errorClient.request("/forbidden"), (error: unknown) => {
    assert.ok(error instanceof ApiClientError);
    const clientError = error as ApiClientError;
    assert.equal(clientError.status, 403);
    assert.deepEqual(clientError.payload, { message: "forbidden" });
    return true;
  });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
