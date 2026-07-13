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
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers" | "cache"> {
  headers?: HeadersInit;
  retry?: number;
  cache?: ApiCacheMode;
  auth?: boolean;
  responseCacheTtlMs?: number;
  cacheKey?: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
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

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const defaultRetry = Math.max(0, options.retry ?? 0);
  const responseCache = new Map<string, CachedResponse>();

  async function request<TResponse = unknown>(path: string, requestOptions: ApiRequestOptions = {}): Promise<TResponse> {
    const { retry = defaultRetry, auth = true, headers: requestHeaders, responseCacheTtlMs, cacheKey, ...init } = requestOptions;
    const ttlMs = responseCacheTtlMs ?? options.responseCacheTtlMs ?? 0;
    const resolvedCacheKey = ttlMs > 0 ? cacheKey ?? `${init.method ?? "GET"}:${path}` : undefined;
    const cached = resolvedCacheKey ? responseCache.get(resolvedCacheKey) : undefined;

    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload as TResponse;
    }

    const attempts = Math.max(0, retry) + 1;
    let lastError: unknown;
    let refreshedAuth = false;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const headers = mergeHeaders(options.defaultHeaders, requestHeaders);

        if (auth && options.getAuthToken) {
          const token = await options.getAuthToken();
          if (token) headers.set("authorization", `Bearer ${token}`);
        }

        const response = await fetchImpl(joinApiUrl(options.baseUrl, path), {
          ...init,
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
          throw new ApiClientError(`API request failed with status ${response.status}`, response.status, body);
        }

        if (resolvedCacheKey && ttlMs > 0) {
          responseCache.set(resolvedCacheKey, { expiresAt: Date.now() + ttlMs, payload: body });
        }

        return body as TResponse;
      } catch (error) {
        lastError = error;
        const isRetryableStatus = error instanceof ApiClientError && error.status >= 500;
        const isNetworkError = !(error instanceof ApiClientError);
        if (attempt >= attempts || (!isRetryableStatus && !isNetworkError)) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  return { request };
}
