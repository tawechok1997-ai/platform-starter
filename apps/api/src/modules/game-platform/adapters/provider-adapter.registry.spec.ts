import { NotFoundException } from '@nestjs/common';
import { DemoProviderAdapter } from './demo-provider.adapter';
import { GenericTransferProviderAdapter } from './generic-transfer-provider.adapter';
import { ProviderAdapterRegistry } from './provider-adapter.registry';

describe('ProviderAdapterRegistry', () => {
  it('resolves demo UAT provider to the safe demo adapter', () => {
    const registry = new ProviderAdapterRegistry();

    expect(registry.hasAdapter('demo-provider-uat')).toBe(true);
    expect(registry.getAdapter('demo-provider-uat')).toBeInstanceOf(DemoProviderAdapter);
  });

  it('normalizes provider codes before lookup', () => {
    const registry = new ProviderAdapterRegistry();

    expect(registry.getAdapter('  DEMO-PROVIDER-UAT  ')).toBeInstanceOf(DemoProviderAdapter);
  });

  it('keeps real-provider behind the generic transfer readiness adapter until vendor docs are available', () => {
    const registry = new ProviderAdapterRegistry();

    expect(registry.hasAdapter('real-provider')).toBe(true);
    expect(registry.getAdapter('real-provider')).toBeInstanceOf(GenericTransferProviderAdapter);
  });

  it('still rejects unknown providers', () => {
    const registry = new ProviderAdapterRegistry();

    expect(() => registry.getAdapter('unknown-provider')).toThrow(NotFoundException);
  });
});
