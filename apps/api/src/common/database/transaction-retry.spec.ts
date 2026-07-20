import { isRetryableTransactionError, withTransactionRetry } from './transaction-retry';

describe('transaction retry', () => {
  it('retries Prisma serialization conflicts and returns the successful result', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockResolvedValueOnce('ok');
    const sleep = jest.fn(async () => undefined);

    await expect(withTransactionRetry(operation, { sleep })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(20);
  });

  it('retries PostgreSQL serialization and deadlock failures', () => {
    expect(isRetryableTransactionError({ code: '40001' })).toBe(true);
    expect(isRetryableTransactionError({ meta: { code: '40P01' } })).toBe(true);
    expect(isRetryableTransactionError({ message: 'deadlock detected' })).toBe(true);
  });

  it('does not retry business errors', async () => {
    const error = new Error('Insufficient wallet balance');
    const operation = jest.fn().mockRejectedValue(error);
    const sleep = jest.fn(async () => undefined);

    await expect(withTransactionRetry(operation, { sleep })).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('stops after the configured attempt limit', async () => {
    const error = { code: 'P2034' };
    const operation = jest.fn().mockRejectedValue(error);
    const sleep = jest.fn(async () => undefined);

    await expect(withTransactionRetry(operation, { maxAttempts: 3, baseDelayMs: 5, sleep })).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 5);
    expect(sleep).toHaveBeenNthCalledWith(2, 10);
  });
});
