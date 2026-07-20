import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';

export type ProviderSimulatorRuntimeConfig = {
  enabled: boolean;
  mode: 'SIMULATOR' | 'SEAMLESS' | 'TRANSFER' | 'HYBRID' | 'EXTERNAL';
  realMoneyProviderEnabled: boolean;
  externalProviderCallbackEnabled: boolean;
};

export function readProviderSimulatorRuntimeConfig(env: NodeJS.ProcessEnv = process.env): ProviderSimulatorRuntimeConfig {
  const rawMode = (env.GAME_PROVIDER_MODE ?? 'SIMULATOR').trim().toUpperCase();
  const allowedModes = ['SIMULATOR', 'SEAMLESS', 'TRANSFER', 'HYBRID', 'EXTERNAL'] as const;
  if (!allowedModes.includes(rawMode as (typeof allowedModes)[number])) {
    throw new ServiceUnavailableException(`Unsupported GAME_PROVIDER_MODE: ${rawMode || '(empty)'}`);
  }

  return {
    enabled: env.ENABLE_PROVIDER_SIMULATOR === 'true',
    mode: rawMode as ProviderSimulatorRuntimeConfig['mode'],
    realMoneyProviderEnabled: env.REAL_MONEY_PROVIDER_ENABLED === 'true',
    externalProviderCallbackEnabled: env.EXTERNAL_PROVIDER_CALLBACK_ENABLED === 'true',
  };
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
