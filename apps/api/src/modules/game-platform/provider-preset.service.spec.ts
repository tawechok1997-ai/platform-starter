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
});
