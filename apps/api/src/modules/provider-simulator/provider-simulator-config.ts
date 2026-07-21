import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';

export type ProviderSimulatorRuntimeConfig = {
  enabled: boolean;
  mode: 'SIMULATOR' | 'SEAMLESS' | 'TRANSFER' | 'HYBRID' | 'EXTERNAL';
  realMoneyProviderEnabled: boolean;
  externalProviderCallbackEnabled: boolean;
  seamlessWalletEnabled: boolean;
  placeholderAssetsEnabled: boolean;
};

function readBooleanFlag(env: NodeJS.ProcessEnv, name: string, fallback = false) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new ServiceUnavailableException(`${name} must be either true or false`);
}

export function readProviderSimulatorRuntimeConfig(env: NodeJS.ProcessEnv = process.env): ProviderSimulatorRuntimeConfig {
  const rawMode = (env.GAME_PROVIDER_MODE ?? 'SIMULATOR').trim().toUpperCase();
  const allowedModes = ['SIMULATOR', 'SEAMLESS', 'TRANSFER', 'HYBRID', 'EXTERNAL'] as const;
  if (!allowedModes.includes(rawMode as (typeof allowedModes)[number])) {
    throw new ServiceUnavailableException(`Unsupported GAME_PROVIDER_MODE: ${rawMode || '(empty)'}`);
  }

  const config: ProviderSimulatorRuntimeConfig = {
    enabled: readBooleanFlag(env, 'ENABLE_PROVIDER_SIMULATOR'),
    mode: rawMode as ProviderSimulatorRuntimeConfig['mode'],
    realMoneyProviderEnabled: readBooleanFlag(env, 'REAL_MONEY_PROVIDER_ENABLED'),
    externalProviderCallbackEnabled: readBooleanFlag(env, 'EXTERNAL_PROVIDER_CALLBACK_ENABLED'),
    seamlessWalletEnabled: readBooleanFlag(env, 'SEAMLESS_WALLET_ENABLED', rawMode === 'SEAMLESS'),
    placeholderAssetsEnabled: readBooleanFlag(env, 'ALLOW_PLACEHOLDER_GAME_ASSETS', rawMode === 'SIMULATOR'),
  };

  if (config.mode === 'SEAMLESS' && !config.seamlessWalletEnabled) {
    throw new ServiceUnavailableException('SEAMLESS_WALLET_ENABLED must be true when GAME_PROVIDER_MODE is SEAMLESS');
  }
  if (config.mode !== 'SEAMLESS' && config.seamlessWalletEnabled && config.mode !== 'SIMULATOR') {
    throw new ServiceUnavailableException('SEAMLESS_WALLET_ENABLED is only supported in SEAMLESS or SIMULATOR mode');
  }
  if (config.realMoneyProviderEnabled && config.placeholderAssetsEnabled) {
    throw new ServiceUnavailableException('Placeholder game assets cannot be enabled for real-money providers');
  }

  return config;
}

export function assertProviderSimulatorAvailable(env: NodeJS.ProcessEnv = process.env) {
  const config = readProviderSimulatorRuntimeConfig(env);
  if (!config.enabled) throw new NotFoundException('Provider simulator is disabled');
  if (config.mode !== 'SIMULATOR') {
    throw new ServiceUnavailableException('Provider simulator is unavailable outside simulator mode');
  }
  if (config.realMoneyProviderEnabled || config.externalProviderCallbackEnabled) {
    throw new ServiceUnavailableException('Provider simulator cannot run while external provider mode is enabled');
  }
  return config;
}
