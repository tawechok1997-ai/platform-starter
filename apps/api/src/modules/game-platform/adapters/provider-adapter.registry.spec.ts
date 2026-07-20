import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { GameProviderAdapter } from '../provider-adapter.interface';
import { DemoProviderAdapter } from './demo-provider.adapter';
import { GenericTransferProviderAdapter } from './generic-transfer-provider.adapter';
import { ProviderAdapterRegistry } from './provider-adapter.registry';

function adapterStub(): GameProviderAdapter {
  return {
    healthCheck: jest.fn(),
    launchGame: jest.fn(),
    getBalance: jest.fn(),
    transferIn: jest.fn(),
    transferOut: jest.fn(),
    syncGames: jest.fn(),
    getBetHistory: jest.fn(),
    validateWebhook: jest.fn(),
    parseWebhook: jest.fn(),
  };
}

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

  it('rejects blank provider codes', () => {
    const registry = new ProviderAdapterRegistry();

    expect(() => registry.register('   ', adapterStub())).toThrow(BadRequestException);
    expect(() => registry.getAdapter('   ')).toThrow(BadRequestException);
    expect(registry.hasAdapter('   ')).toBe(false);
  });

  it('rejects accidental duplicate registration', () => {
    const registry = new ProviderAdapterRegistry();

    expect(() => registry.register('demo-provider', adapterStub())).toThrow(ConflictException);
  });

  it('allows an explicit adapter replacement', () => {
    const registry = new ProviderAdapterRegistry();
    const replacement = adapterStub();

    registry.register('demo-provider', replacement, { replace: true });

    expect(registry.getAdapter('demo-provider')).toBe(replacement);
  });

  it('describes registered provider aliases and adapter implementations', () => {
    const registry = new ProviderAdapterRegistry();

    expect(registry.describeAdapters()).toEqual(expect.arrayContaining([
      { providerCode: 'demo-provider', adapterName: 'DemoProviderAdapter' },
      { providerCode: 'generic-transfer', adapterName: 'GenericTransferProviderAdapter' },
      { providerCode: 'simulator-provider', adapterName: 'SimulatorProviderAdapter' },
    ]));
  });
});
