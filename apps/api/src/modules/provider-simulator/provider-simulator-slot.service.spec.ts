import { BadRequestException } from '@nestjs/common';
import { ProviderSimulatorSlotService } from './provider-simulator-slot.service';

describe('ProviderSimulatorSlotService', () => {
  const previousEnv = {
    ENABLE_PROVIDER_SIMULATOR: process.env.ENABLE_PROVIDER_SIMULATOR,
    GAME_PROVIDER_MODE: process.env.GAME_PROVIDER_MODE,
    REAL_MONEY_PROVIDER_ENABLED: process.env.REAL_MONEY_PROVIDER_ENABLED,
    EXTERNAL_PROVIDER_CALLBACK_ENABLED: process.env.EXTERNAL_PROVIDER_CALLBACK_ENABLED,
    PROVIDER_SIMULATOR_SLOT_SECRET: process.env.PROVIDER_SIMULATOR_SLOT_SECRET,
  };

  beforeAll(() => {
    process.env.ENABLE_PROVIDER_SIMULATOR = 'true';
    process.env.GAME_PROVIDER_MODE = 'SIMULATOR';
    process.env.REAL_MONEY_PROVIDER_ENABLED = 'false';
    process.env.EXTERNAL_PROVIDER_CALLBACK_ENABLED = 'false';
    process.env.PROVIDER_SIMULATOR_SLOT_SECRET = 'provider-simulator-slot-v1';
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('creates the demo provider game session through the persistence owner', async () => {
    const persistence = {
      launchMemberSlot: jest.fn().mockResolvedValue({
        id: 'session-launch',
        launchUrl: '/games/demo-launch?game=demo-slot-001&session=session-launch&provider=simulator-provider',
        providerSessionId: 'sim_session-launch',
        game: { providerGameCode: 'demo-slot-001' },
        provider: { code: 'simulator-provider' },
      }),
    };
    const transactions = { gameTransaction: jest.fn() };
    const service = new ProviderSimulatorSlotService(persistence as any, transactions as any);

    const result = await service.launch({
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(persistence.launchMemberSlot).toHaveBeenCalledWith({
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
    expect(result.launchUrl).toContain('/games/demo-launch');
    expect(result.providerSessionId).toBe('sim_session-launch');
    expect(transactions.gameTransaction).not.toHaveBeenCalled();
  });

  it('debits BET and credits WIN on the same member wallet with deterministic idempotency ids', async () => {
    const persistence = {
      findMemberSlotSession: jest.fn().mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        status: 'LAUNCHED',
        launchUrl: '/games/demo-launch?game=demo-slot-001&session=session-1',
        game: {
          providerGameCode: 'demo-slot-001',
          name: 'Demo Fortune Slot',
          category: 'slot',
          status: 'ACTIVE',
        },
        provider: {
          code: 'simulator-provider',
          name: 'Simulator Provider',
          currency: 'THB',
          status: 'ACTIVE',
        },
      }),
      markMemberSlotSessionActive: jest.fn().mockResolvedValue({ count: 1 }),
    };
    const transactions = {
      gameTransaction: jest.fn()
        .mockResolvedValueOnce({
          providerTransactionId: 'sim_bet_bet_b2176507-2df4-4e4b-b2cb-1929959eb683',
          beforeBalance: '1000.00',
          afterBalance: '950.00',
          replayed: false,
        })
        .mockResolvedValueOnce({
          providerTransactionId: 'sim_win_win_b2176507-2df4-4e4b-b2cb-1929959eb683',
          beforeBalance: '950.00',
          afterBalance: '1025.00',
          replayed: false,
        }),
    };
    const service = new ProviderSimulatorSlotService(persistence as any, transactions as any);

    const result = await service.spin({
      userId: 'user-1',
      sessionId: 'session-1',
      spinId: 'b2176507-2df4-4e4b-b2cb-1929959eb683',
      amount: 50,
    });

    expect(result.symbols).toEqual(['🍋', '🍋', '🍒']);
    expect(result.multiplier).toBe(1.5);
    expect(result.betAmount).toBe('50.00');
    expect(result.winAmount).toBe('75.00');
    expect(result.netAmount).toBe('25.00');
    expect(result.balance).toBe('1025.00');
    expect(transactions.gameTransaction).toHaveBeenNthCalledWith(1, 'BET', expect.objectContaining({
      userId: 'user-1',
      transactionId: 'bet_b2176507-2df4-4e4b-b2cb-1929959eb683',
      roundId: 'slot_b2176507-2df4-4e4b-b2cb-1929959eb683',
      amount: '50.00',
      sessionId: 'session-1',
    }));
    expect(transactions.gameTransaction).toHaveBeenNthCalledWith(2, 'WIN', expect.objectContaining({
      transactionId: 'win_b2176507-2df4-4e4b-b2cb-1929959eb683',
      amount: '75.00',
    }));
    expect(persistence.markMemberSlotSessionActive).toHaveBeenCalledWith('user-1', 'session-1');
  });

  it('rejects sessions that were not launched by the simulator', async () => {
    const persistence = {
      findMemberSlotSession: jest.fn().mockResolvedValue({
        id: 'session-2',
        userId: 'user-1',
        status: 'LAUNCHED',
        launchUrl: 'https://external-provider.example/play',
        game: {
          providerGameCode: 'demo-slot-001',
          name: 'Demo Fortune Slot',
          category: 'slot',
          status: 'ACTIVE',
        },
        provider: {
          code: 'real-provider',
          name: 'External Provider',
          currency: 'THB',
          status: 'ACTIVE',
        },
      }),
      markMemberSlotSessionActive: jest.fn(),
    };
    const transactions = { gameTransaction: jest.fn() };
    const service = new ProviderSimulatorSlotService(persistence as any, transactions as any);

    await expect(service.spin({
      userId: 'user-1',
      sessionId: 'session-2',
      spinId: 'a3ce9885-65ff-4dc2-98b4-0b56f59248dd',
      amount: 50,
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(transactions.gameTransaction).not.toHaveBeenCalled();
  });
});
