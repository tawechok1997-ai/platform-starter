export type ApiAuthTokenProvider = () => string | null | undefined | Promise<string | null | undefined>;
export type ApiRequestIdProvider = () => string | null | undefined;

export type ApiCacheMode = "default" | "no-store" | "reload" | "force-cache" | "only-if-cached";

export interface ApiClientOptions {
  baseUrl: string;
  getAuthToken?: ApiAuthTokenProvider;
  refreshAuthToken?: ApiAuthTokenProvider;
  getRequestId?: ApiRequestIdProvider;
  fetchImpl?: typeof fetch;
  defaultHeaders?: HeadersInit;
  retry?: number;
  timeoutMs?: number;
  cache?: ApiCacheMode;
  responseCacheTtlMs?: number;
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers" | "cache"> {
  headers?: HeadersInit;
  retry?: number;
  timeoutMs?: number;
  cache?: ApiCacheMode;
  auth?: boolean;
  responseCacheTtlMs?: number;
  cacheKey?: string;
}

export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
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

export class ApiTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`API request timed out after ${timeoutMs}ms`);
    this.name = "ApiTimeoutError";
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
  if (response.status === 204 || response.status === 205) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (JSON_CONTENT_TYPES.some((type) => contentType.includes(type))) return response.json();
  const text = await response.text();
  return text.length > 0 ? text : null;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}

function normalizedError(response: Response, payload: unknown): ApiClientError {
  const typed = isApiErrorPayload(payload) ? payload : undefined;
  const headerRequestId = response.headers.get("x-request-id") ?? undefined;
  const message = typeof typed?.message === "string"
    ? typed.message
    : `API request failed with status ${response.status}`;
  return new ApiClientError(
    message,
    response.status,
    payload,
    typeof typed?.code === "string" ? typed.code : undefined,
    typeof typed?.requestId === "string" ? typed.requestId : headerRequestId,
  );
}

function combineSignals(external: AbortSignal | null | undefined, timeoutMs: number): {
  signal: AbortSignal;
  cleanup: () => void;
  didTimeout: () => boolean;
} {
  const controller = new AbortController();
  let timedOut = false;
  const onExternalAbort = () => controller.abort(external?.reason);
  external?.addEventListener("abort", onExternalAbort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new ApiTimeoutError(timeoutMs));
  }, timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      external?.removeEventListener("abort", onExternalAbort);
    },
    didTimeout: () => timedOut,
  };
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const defaultRetry = Math.max(0, options.retry ?? 0);
  const defaultTimeoutMs = Math.max(1, options.timeoutMs ?? 15_000);
  const responseCache = new Map<string, CachedResponse>();

  async function request<TResponse = unknown>(path: string, requestOptions: ApiRequestOptions = {}): Promise<TResponse> {
    const {
      retry = defaultRetry,
      timeoutMs = defaultTimeoutMs,
      auth = true,
      headers: requestHeaders,
      responseCacheTtlMs,
      cacheKey,
      signal: externalSignal,
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
      const combined = combineSignals(externalSignal, Math.max(1, timeoutMs));
      try {
        const headers = mergeHeaders(options.defaultHeaders, requestHeaders);
        const requestId = options.getRequestId?.();
        if (requestId && !headers.has("x-request-id")) headers.set("x-request-id", requestId);
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

        if (!response.ok) throw normalizedError(response, body);
        if (resolvedCacheKey && ttlMs > 0) {
          responseCache.set(resolvedCacheKey, { expiresAt: Date.now() + ttlMs, payload: body });
        }
        return body as TResponse;
      } catch (error) {
        const normalized = combined.didTimeout() ? new ApiTimeoutError(Math.max(1, timeoutMs)) : error;
        lastError = normalized;
        const isRetryableStatus = normalized instanceof ApiClientError && normalized.status >= 500;
        const isRetryableTransport = !(normalized instanceof ApiClientError) && !(normalized instanceof DOMException && normalized.name === "AbortError" && !combined.didTimeout());
        if (attempt >= attempts || (!isRetryableStatus && !isRetryableTransport)) throw normalized;
      } finally {
        combined.cleanup();
      }
    }
    throw lastError;
  }

  async function upload<TResponse = unknown>(path: string, body: BodyInit, requestOptions: ApiRequestOptions = {}): Promise<TResponse> {
    return request<TResponse>(path, { ...requestOptions, method: requestOptions.method ?? "POST", body });
  }

  async function download(path: string, requestOptions: ApiRequestOptions = {}): Promise<ArrayBuffer> {
    const headers = mergeHeaders(options.defaultHeaders, requestOptions.headers);
    const requestId = options.getRequestId?.();
    if (requestId && !headers.has("x-request-id")) headers.set("x-request-id", requestId);
    if (requestOptions.auth !== false && options.getAuthToken) {
      const token = await options.getAuthToken();
      if (token) headers.set("authorization", `Bearer ${token}`);
    }
    const timeoutMs = Math.max(1, requestOptions.timeoutMs ?? defaultTimeoutMs);
    const combined = combineSignals(requestOptions.signal, timeoutMs);
    try {
      const response = await fetchImpl(joinApiUrl(options.baseUrl, path), {
        ...requestOptions,
        method: requestOptions.method ?? "GET",
        signal: combined.signal,
        headers,
      });
      if (!response.ok) throw normalizedError(response, await readResponseBody(response));
      return response.arrayBuffer();
    } catch (error) {
      if (combined.didTimeout()) throw new ApiTimeoutError(timeoutMs);
      throw error;
    } finally {
      combined.cleanup();
    }
  }

  function clearCache(cacheKey?: string) {
    if (cacheKey) responseCache.delete(cacheKey);
    else responseCache.clear();
  }

  return { request, upload, download, clearCache };
}
