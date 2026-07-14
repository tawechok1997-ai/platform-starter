export type ApiAuthTokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type ApiCacheMode = "default" | "no-store" | "reload" | "force-cache" | "only-if-cached";

export interface ApiClientOptions {
  baseUrl: string;
  getAuthToken?: ApiAuthTokenProvider;
  refreshAuthToken?: ApiAuthTokenProvider;
  fetchImpl?: typeof fetch;
  defaultHeaders?: HeadersInit;
  retry?: number;
  cache?: ApiCacheMode;
  responseCacheTtlMs?: number;
  timeoutMs?: number;
  createRequestId?: () => string;
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers" | "cache"> {
  headers?: HeadersInit;
  retry?: number;
  cache?: ApiCacheMode;
  auth?: boolean;
  responseCacheTtlMs?: number;
  cacheKey?: string;
  timeoutMs?: number;
  requestId?: string;
}

export interface ApiErrorPayload {
  message?: string;
  code?: string;
  requestId?: string;
  [key: string]: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const JSON_CONTENT_TYPES = ["application/json", "application/problem+json"];

type CachedResponse = { expiresAt: number; payload: unknown };

export function joinApiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function mergeHeaders(...headersList: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();
  for (const headerInit of headersList) {
    if (!headerInit) continue;
    new Headers(headerInit).forEach((value, key) => headers.set(key, value));
  }
  return headers;
}

export async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (JSON_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

function errorPayload(value: unknown): ApiErrorPayload | null {
  return value && typeof value === "object" ? value as ApiErrorPayload : null;
}

function normalizedErrorMessage(status: number, payload: unknown): string {
  const candidate = errorPayload(payload)?.message;
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : `API request failed with status ${status}`;
}

function randomRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function combineSignals(signal: AbortSignal | null | undefined, timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  }
  const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(new Error("API request timeout")), timeoutMs) : undefined;
  return {
    signal: controller.signal,
    cleanup: () => {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    },
  };
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const defaultRetry = Math.max(0, options.retry ?? 0);
  const defaultTimeoutMs = Math.max(0, options.timeoutMs ?? 15_000);
  const responseCache = new Map<string, CachedResponse>();

  async function request<TResponse = unknown>(path: string, requestOptions: ApiRequestOptions = {}): Promise<TResponse> {
    const {
      retry = defaultRetry,
      auth = true,
      headers: requestHeaders,
      responseCacheTtlMs,
      cacheKey,
      timeoutMs = defaultTimeoutMs,
      requestId = options.createRequestId?.() ?? randomRequestId(),
      ...init
    } = requestOptions;
    const ttlMs = responseCacheTtlMs ?? options.responseCacheTtlMs ?? 0;
    const resolvedCacheKey = ttlMs > 0 ? cacheKey ?? `${init.method ?? "GET"}:${path}` : undefined;
    const cached = resolvedCacheKey ? responseCache.get(resolvedCacheKey) : undefined;

    if (cached && cached.expiresAt > Date.now()) return cached.payload as TResponse;

    const attempts = Math.max(0, retry) + 1;
    let lastError: unknown;
    let refreshedAuth = false;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const combined = combineSignals(init.signal, timeoutMs);
      try {
        const headers = mergeHeaders(options.defaultHeaders, requestHeaders);
        headers.set("x-request-id", requestId);

        if (auth && options.getAuthToken) {
          const token = await options.getAuthToken();
          if (token) headers.set("authorization", `Bearer ${token}`);
        }

        const response = await fetchImpl(joinApiUrl(options.baseUrl, path), {
          ...init,
          signal: combined.signal,
          cache: requestOptions.cache ?? options.cache,
          headers,
        });
        const body = await readResponseBody(response);

        if (response.status === 401 && auth && options.refreshAuthToken && !refreshedAuth) {
          refreshedAuth = true;
          const token = await options.refreshAuthToken();
          if (token) {
            attempt -= 1;
            continue;
          }
        }

        if (!response.ok) {
          const payload = errorPayload(body);
          throw new ApiClientError(
            normalizedErrorMessage(response.status, body),
            response.status,
            body,
            typeof payload?.code === "string" ? payload.code : undefined,
            typeof payload?.requestId === "string" ? payload.requestId : response.headers.get("x-request-id") ?? requestId,
          );
        }

        if (resolvedCacheKey && ttlMs > 0) responseCache.set(resolvedCacheKey, { expiresAt: Date.now() + ttlMs, payload: body });
        return body as TResponse;
      } catch (error) {
        lastError = error;
        const isRetryableStatus = error instanceof ApiClientError && error.status >= 500;
        const isNetworkError = !(error instanceof ApiClientError);
        if (attempt >= attempts || (!isRetryableStatus && !isNetworkError)) throw error;
      } finally {
        combined.cleanup();
      }
    }

    throw lastError;
  }

  function json<TResponse, TBody = unknown>(path: string, body: TBody, requestOptions: ApiRequestOptions = {}): Promise<TResponse> {
    const headers = mergeHeaders({ "content-type": "application/json" }, requestOptions.headers);
    return request<TResponse>(path, { ...requestOptions, headers, body: JSON.stringify(body) });
  }

  function upload<TResponse>(path: string, formData: FormData, requestOptions: ApiRequestOptions = {}): Promise<TResponse> {
    return request<TResponse>(path, { ...requestOptions, body: formData });
  }

  async function download(path: string, requestOptions: ApiRequestOptions = {}): Promise<Blob> {
    const headers = mergeHeaders(options.defaultHeaders, requestOptions.headers);
    headers.set("x-request-id", requestOptions.requestId ?? options.createRequestId?.() ?? randomRequestId());
    if (requestOptions.auth !== false && options.getAuthToken) {
      const token = await options.getAuthToken();
      if (token) headers.set("authorization", `Bearer ${token}`);
    }
    const combined = combineSignals(requestOptions.signal, requestOptions.timeoutMs ?? defaultTimeoutMs);
    try {
      const response = await fetchImpl(joinApiUrl(options.baseUrl, path), { ...requestOptions, headers, signal: combined.signal });
      if (!response.ok) {
        const body = await readResponseBody(response);
        throw new ApiClientError(normalizedErrorMessage(response.status, body), response.status, body);
      }
      return response.blob();
    } finally {
      combined.cleanup();
    }
  }

  function invalidateCache(prefix?: string): void {
    if (!prefix) return responseCache.clear();
    for (const key of responseCache.keys()) if (key.startsWith(prefix)) responseCache.delete(key);
  }

  return { request, json, upload, download, invalidateCache };
}
