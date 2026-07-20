import { assertProviderSimulatorAvailable, readProviderSimulatorRuntimeConfig } from './provider-simulator-config';

describe('provider simulator runtime config', () => {
  it('accepts isolated simulator mode', () => {
    const env = {
      ENABLE_PROVIDER_SIMULATOR: 'true',
      GAME_PROVIDER_MODE: 'SIMULATOR',
      REAL_MONEY_PROVIDER_ENABLED: 'false',
      EXTERNAL_PROVIDER_CALLBACK_ENABLED: 'false',
    } as NodeJS.ProcessEnv;
    const config = assertProviderSimulatorAvailable(env);
    expect(config.mode).toBe('SIMULATOR');
    expect(config.placeholderAssetsEnabled).toBe(true);
  });

  it('accepts an explicitly enabled seamless wallet', () => {
    const config = readProviderSimulatorRuntimeConfig({
      GAME_PROVIDER_MODE: 'SEAMLESS',
      SEAMLESS_WALLET_ENABLED: 'true',
      ALLOW_PLACEHOLDER_GAME_ASSETS: 'false',
    } as NodeJS.ProcessEnv);
    expect(config).toMatchObject({ mode: 'SEAMLESS', seamlessWalletEnabled: true, placeholderAssetsEnabled: false });
  });

  it('rejects unknown provider modes', () => {
    expect(() => readProviderSimulatorRuntimeConfig({ GAME_PROVIDER_MODE: 'MAGIC' } as NodeJS.ProcessEnv))
      .toThrow('Unsupported GAME_PROVIDER_MODE');
  });

  it('rejects malformed boolean flags', () => {
    expect(() => readProviderSimulatorRuntimeConfig({
      GAME_PROVIDER_MODE: 'SIMULATOR',
      ENABLE_PROVIDER_SIMULATOR: 'yes',
    } as NodeJS.ProcessEnv)).toThrow('ENABLE_PROVIDER_SIMULATOR must be either true or false');
  });

  it('requires the seamless wallet flag for seamless mode', () => {
    expect(() => readProviderSimulatorRuntimeConfig({
      GAME_PROVIDER_MODE: 'SEAMLESS',
      SEAMLESS_WALLET_ENABLED: 'false',
    } as NodeJS.ProcessEnv)).toThrow('SEAMLESS_WALLET_ENABLED must be true');
  });

  it('rejects placeholder assets for real-money providers', () => {
    expect(() => readProviderSimulatorRuntimeConfig({
      GAME_PROVIDER_MODE: 'EXTERNAL',
      REAL_MONEY_PROVIDER_ENABLED: 'true',
      ALLOW_PLACEHOLDER_GAME_ASSETS: 'true',
    } as NodeJS.ProcessEnv)).toThrow('Placeholder game assets cannot be enabled');
  });

  it('rejects simulator mixed with real-money or callback mode', () => {
    expect(() => assertProviderSimulatorAvailable({
      ENABLE_PROVIDER_SIMULATOR: 'true',
      GAME_PROVIDER_MODE: 'SIMULATOR',
      REAL_MONEY_PROVIDER_ENABLED: 'true',
      ALLOW_PLACEHOLDER_GAME_ASSETS: 'false',
    } as NodeJS.ProcessEnv)).toThrow('cannot run while external provider mode is enabled');

    expect(() => assertProviderSimulatorAvailable({
      ENABLE_PROVIDER_SIMULATOR: 'true',
      GAME_PROVIDER_MODE: 'SIMULATOR',
      EXTERNAL_PROVIDER_CALLBACK_ENABLED: 'true',
    } as NodeJS.ProcessEnv)).toThrow('cannot run while external provider mode is enabled');
  });

  it('hides the simulator when disabled', () => {
    expect(() => assertProviderSimulatorAvailable({
      ENABLE_PROVIDER_SIMULATOR: 'false',
      GAME_PROVIDER_MODE: 'SIMULATOR',
    } as NodeJS.ProcessEnv)).toThrow('Provider simulator is disabled');
  });
});
