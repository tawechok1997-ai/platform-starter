import { ProviderPresetService } from './provider-preset.service';

describe('ProviderPresetService real-provider readiness', () => {
  it('exposes required real-provider endpoints, credentials and safe gates', () => {
    const service = new ProviderPresetService({} as any, {} as any);
    const preset = service.listPresets().items.find((item) => item.code === 'real-provider');

    expect(preset).toBeDefined();
    expect(preset).toEqual(expect.objectContaining({ walletMode: 'HYBRID' }));
    expect(preset?.endpoints).toEqual(expect.arrayContaining([
      'LAUNCH',
      'BALANCE',
      'TRANSFER_IN',
      'TRANSFER_OUT',
      'GAME_LIST',
      'BET_HISTORY',
      'WEBHOOK',
      'HEALTH_CHECK',
    ]));
    expect(preset?.credentials).toEqual(expect.arrayContaining([
      'API_KEY',
      'SECRET_KEY',
      'MERCHANT_ID',
      'AGENT_ID',
      'WEBHOOK_SECRET',
    ]));
    expect(preset?.gates).toEqual(expect.objectContaining({
      launchEnabled: true,
      transferEnabled: false,
      walletSyncEnabled: true,
      realMoneyEnabled: false,
      webhookSettlementEnabled: false,
    }));
  });

  it('rejects unsupported endpoint overrides before persisting provider config', async () => {
    const service = new ProviderPresetService({} as any, {} as any);

    await expect(service.applyPreset({
      presetCode: 'real-provider',
      name: 'Real Provider',
      code: 'real-provider-test',
      baseUrl: 'https://provider.example.test/api',
      endpointOverrides: [{ type: 'UNKNOWN', url: 'https://provider.example.test/unknown' }],
    }, { id: 'admin-1' }, {})).rejects.toThrow('Unsupported endpoint override type: UNKNOWN');
  });

  it('does not persist placeholder credentials when a preset is created without secret values', async () => {
    const tx = {
      gameProvider: { create: jest.fn().mockResolvedValue({ id: 'provider-1', code: 'real-provider-test' }) },
      gameProviderEndpoint: { createMany: jest.fn().mockResolvedValue({ count: 8 }) },
      gameProviderCredential: { createMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(async (run) => run(tx)),
      adminAuditLog: { create: jest.fn() },
      gameProvider: { findUnique: jest.fn().mockResolvedValue({ id: 'provider-1' }) },
    };
    const service = new ProviderPresetService(prisma as any, { get: jest.fn() } as any);

    await service.applyPreset({
      presetCode: 'real-provider',
      name: 'Real Provider',
      code: 'real-provider-test',
      baseUrl: 'https://provider.example.test/api',
    }, { id: 'admin-1' }, {});

    expect(tx.gameProviderCredential.createMany).not.toHaveBeenCalled();
    expect(tx.gameProvider.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          environment: 'PRODUCTION',
          requiredCredentialTypes: expect.arrayContaining(['API_KEY', 'WEBHOOK_SECRET']),
          providedCredentialTypes: [],
        }),
      }),
    }));
  });

  it('marks UAT providers from their code before the demo preset fallback', async () => {
    const tx = {
      gameProvider: { create: jest.fn().mockResolvedValue({ id: 'provider-uat', code: 'demo-provider-uat' }) },
      gameProviderEndpoint: { createMany: jest.fn().mockResolvedValue({ count: 6 }) },
      gameProviderCredential: { createMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(async (run) => run(tx)),
      adminAuditLog: { create: jest.fn() },
      gameProvider: { findUnique: jest.fn().mockResolvedValue({ id: 'provider-uat' }) },
    };
    const service = new ProviderPresetService(prisma as any, { get: jest.fn() } as any);

    await service.applyPreset({ presetCode: 'demo-provider', name: 'Demo UAT', code: 'demo-provider-uat', baseUrl: 'https://demo-provider-uat.local' }, { id: 'admin-1' }, {});

    expect(tx.gameProvider.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ metadata: expect.objectContaining({ environment: 'UAT' }) }),
    }));
  });
});
