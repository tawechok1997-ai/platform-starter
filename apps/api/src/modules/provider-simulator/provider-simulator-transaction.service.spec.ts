import { BadRequestException, ConflictException } from '@nestjs/common';
import { ProviderSimulatorTransactionService } from './provider-simulator-transaction.service';

describe('ProviderSimulatorTransactionService', () => {
  it('retries a transient Prisma transaction conflict', async () => {
    const simulator = {
      gameTransaction: jest.fn()
        .mockRejectedValueOnce({ code: 'P2034' })
        .mockResolvedValueOnce({ status: 'SUCCESS' }),
    };
    const manualReviews = { create: jest.fn() };
    const service = new ProviderSimulatorTransactionService(simulator as never, manualReviews as never);

    await expect(service.gameTransaction('BET', { transactionId: 'bet-1' })).resolves.toEqual({ status: 'SUCCESS' });
    expect(simulator.gameTransaction).toHaveBeenCalledTimes(2);
    expect(manualReviews.create).not.toHaveBeenCalled();
  });

  it('does not retry or review unrelated failures', async () => {
    const error = new Error('Original bet transaction was not found');
    const simulator = { gameTransaction: jest.fn().mockRejectedValue(error) };
    const manualReviews = { create: jest.fn() };
    const service = new ProviderSimulatorTransactionService(simulator as never, manualReviews as never);

    await expect(service.gameTransaction('BET', {})).rejects.toBe(error);
    expect(simulator.gameTransaction).toHaveBeenCalledTimes(1);
    expect(manualReviews.create).not.toHaveBeenCalled();
  });

  it('persists an insufficient-balance rollback-win for manual review', async () => {
    const simulator = {
      gameTransaction: jest.fn().mockRejectedValue(new BadRequestException('Balance cannot be negative')),
    };
    const manualReviews = {
      create: jest.fn().mockResolvedValue({ id: 'review-1', status: 'OPEN' }),
    };
    const service = new ProviderSimulatorTransactionService(simulator as never, manualReviews as never);

    const request = service.gameTransaction('ROLLBACK', {
      userId: '11111111-1111-4111-8111-111111111111',
      transactionId: 'rollback-1',
      originalTransactionId: 'win-1',
      rollbackTarget: 'WIN',
      roundId: 'round-1',
      gameCode: 'fortune-tiger',
      amount: '25.00',
      currency: 'THB',
    });

    await expect(request).rejects.toBeInstanceOf(ConflictException);
    expect(manualReviews.create).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'ROLLBACK_WIN',
      providerTransactionId: 'sim_rollback_win_rollback-1',
      originalProviderTransactionId: 'win-1',
      reason: expect.stringContaining('Balance cannot be negative'),
    }));
  });
});
