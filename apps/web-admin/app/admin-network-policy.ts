const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const RETRYABLE_STATUSES = new Set([408, 425, 429, 502, 503, 504]);

export const ADMIN_REQUEST_TIMEOUT_MS = 15_000;
export const ADMIN_READ_RETRY_LIMIT = 1;
export const ADMIN_RETRY_DELAY_MS = 150;
export const ADMIN_MAX_RETRY_AFTER_MS = 1_000;

export class AdminRequestTimeoutError extends Error {
  readonly code = 'ADMIN_REQUEST_TIMEOUT';

  constructor(readonly timeoutMs: number) {
    super(`Admin request timed out after ${timeoutMs}ms`);
    this.name = 'AdminRequestTimeoutError';
  }
}

type AdminRequestExecutorOptions = {
  fetchImpl?: typeof fetch;
  retryLimit?: number;
  sleep?: (delayMs: number) => Promise<void>;
  timeoutMs?: number;
};

export function isAdminReadOnlyMethod(method: string | undefined) {
  return READ_ONLY_METHODS.has(String(method ?? 'GET').toUpperCase());
}

export function shouldRetryAdminStatus(status: number, method: string | undefined, attempt: number, retryLimit = ADMIN_READ_RETRY_LIMIT) {
  return isAdminReadOnlyMethod(method)
    && attempt < retryLimit
    && RETRYABLE_STATUSES.has(status);
}

export function adminRetryDelayMs(response?: Response) {
  const retryAfter = response?.headers.get('retry-after')?.trim();
  if (!retryAfter) return ADMIN_RETRY_DELAY_MS;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.round(seconds * 1_000), ADMIN_MAX_RETRY_AFTER_MS);
  }

  const dateMs = Date.parse(retryAfter);
  if (!Number.isFinite(dateMs)) return ADMIN_RETRY_DELAY_MS;
  return Math.min(Math.max(0, dateMs - Date.now()), ADMIN_MAX_RETRY_AFTER_MS);
}

export async function executeAdminRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
  executorOptions: AdminRequestExecutorOptions = {},
) {
  const fetchImpl = executorOptions.fetchImpl ?? fetch;
  const retryLimit = Math.max(0, executorOptions.retryLimit ?? ADMIN_READ_RETRY_LIMIT);
  const sleep = executorOptions.sleep ?? defaultSleep;
  const timeoutMs = Math.max(1, executorOptions.timeoutMs ?? ADMIN_REQUEST_TIMEOUT_MS);
  const method = String(init.method ?? 'GET').toUpperCase();

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetchWithTimeout(fetchImpl, input, init, timeoutMs);
      if (!shouldRetryAdminStatus(response.status, method, attempt, retryLimit)) return response;
      await sleep(adminRetryDelayMs(response));
    } catch (error) {
      if (init.signal?.aborted || !isAdminReadOnlyMethod(method) || attempt >= retryLimit) throw error;
      await sleep(ADMIN_RETRY_DELAY_MS);
    }
  }
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  let timedOut = false;
  const externalSignal = init.signal;
  const forwardAbort = () => controller.abort(externalSignal?.reason);

  if (externalSignal?.aborted) forwardAbort();
  else externalSignal?.addEventListener('abort', forwardAbort, { once: true });

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new AdminRequestTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', forwardAbort);
  }
}

function defaultSleep(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}
