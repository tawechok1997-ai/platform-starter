export type TransactionRetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
};

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 20;
const RETRYABLE_POSTGRES_CODES = new Set(['40001', '40P01']);

export async function withTransactionRetry<T>(
  operation: () => Promise<T>,
  options: TransactionRetryOptions = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS);
  const sleep = options.sleep ?? ((delayMs) => new Promise<void>((resolve) => setTimeout(resolve, delayMs)));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === maxAttempts) throw error;
      await sleep(baseDelayMs * attempt);
    }
  }

  throw new Error('Transaction retry loop exhausted unexpectedly');
}

export function isRetryableTransactionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    meta?: { code?: unknown; database_error?: unknown };
  };

  if (candidate.code === 'P2034') return true;

  const postgresCode = typeof candidate.meta?.code === 'string'
    ? candidate.meta.code
    : typeof candidate.code === 'string'
      ? candidate.code
      : '';
  if (RETRYABLE_POSTGRES_CODES.has(postgresCode)) return true;

  const details = `${String(candidate.message ?? '')} ${String(candidate.meta?.database_error ?? '')}`.toLowerCase();
  return details.includes('serialization failure') || details.includes('deadlock detected');
}
