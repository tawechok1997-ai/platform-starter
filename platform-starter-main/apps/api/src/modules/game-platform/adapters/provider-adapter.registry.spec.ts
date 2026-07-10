import { NotFoundException } from '@nestjs/common';
import { DemoProviderAdapter } from './demo-provider.adapter';
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

  it('still rejects unknown providers', () => {
    const registry = new ProviderAdapterRegistry();

    expect(() => registry.getAdapter('unknown-provider')).toThrow(NotFoundException);
  });
});
