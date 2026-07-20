import { ProviderSimulatorTransactionService } from './provider-simulator-transaction.service';

describe('ProviderSimulatorTransactionService', () => {
  it('retries a transient Prisma transaction conflict', async () => {
    const simulator = {
      gameTransaction: jest.fn()
        .mockRejectedValueOnce({ code: 'P2034' })
        .mockResolvedValueOnce({ status: 'SUCCESS' }),
    };
    const service = new ProviderSimulatorTransactionService(simulator as any);

    await expect(service.gameTransaction('BET', { transactionId: 'bet-1' })).resolves.toEqual({ status: 'SUCCESS' });
    expect(simulator.gameTransaction).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transaction failures', async () => {
    const error = new Error('Insufficient wallet balance');
    const simulator = { gameTransaction: jest.fn().mockRejectedValue(error) };
    const service = new ProviderSimulatorTransactionService(simulator as any);

    await expect(service.gameTransaction('BET', {})).rejects.toBe(error);
    expect(simulator.gameTransaction).toHaveBeenCalledTimes(1);
  });
});
