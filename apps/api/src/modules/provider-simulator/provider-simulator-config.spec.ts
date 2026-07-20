import { assertProviderSimulatorAvailable, readProviderSimulatorRuntimeConfig } from './provider-simulator-config';

describe('provider simulator runtime config', () => {
  it('accepts isolated simulator mode', () => {
    const env = {
      ENABLE_PROVIDER_SIMULATOR: 'true',
      GAME_PROVIDER_MODE: 'SIMULATOR',
      REAL_MONEY_PROVIDER_ENABLED: 'false',
      EXTERNAL_PROVIDER_CALLBACK_ENABLED: 'false',
    } as NodeJS.ProcessEnv;
    expect(assertProviderSimulatorAvailable(env).mode).toBe('SIMULATOR');
  });

  it('rejects unknown provider modes', () => {
    expect(() => readProviderSimulatorRuntimeConfig({ GAME_PROVIDER_MODE: 'MAGIC' } as NodeJS.ProcessEnv))
      .toThrow('Unsupported GAME_PROVIDER_MODE');
  });

  it('rejects simulator mixed with real-money or callback mode', () => {
    expect(() => assertProviderSimulatorAvailable({
      ENABLE_PROVIDER_SIMULATOR: 'true',
      GAME_PROVIDER_MODE: 'SIMULATOR',
      REAL_MONEY_PROVIDER_ENABLED: 'true',
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
