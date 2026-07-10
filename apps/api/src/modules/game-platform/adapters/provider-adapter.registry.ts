import { Injectable, NotFoundException } from '@nestjs/common';
import { GameProviderAdapter } from '../provider-adapter.interface';
import { DemoProviderAdapter } from './demo-provider.adapter';
import { SimulatorProviderAdapter } from './simulator-provider.adapter';
import { GenericTransferProviderAdapter } from './generic-transfer-provider.adapter';

@Injectable()
export class ProviderAdapterRegistry {
  private readonly adapters = new Map<string, GameProviderAdapter>();

  constructor() {
    const demoAdapter = new DemoProviderAdapter();
    const simulatorAdapter = new SimulatorProviderAdapter();
    const genericTransferAdapter = new GenericTransferProviderAdapter();

    this.register('demo-provider', demoAdapter);
    this.register('demo-provider-uat', demoAdapter);
    this.register('simulator-provider', simulatorAdapter);
    this.register('generic-transfer', genericTransferAdapter);
    this.register('real-provider', genericTransferAdapter);
  }

  register(providerCode: string, adapter: GameProviderAdapter) {
    this.adapters.set(this.normalize(providerCode), adapter);
  }

  getAdapter(providerCode: string) {
    const adapter = this.adapters.get(this.normalize(providerCode));
    if (!adapter) throw new NotFoundException(`Provider adapter not registered for ${providerCode}`);
    return adapter;
  }

  hasAdapter(providerCode: string) {
    return this.adapters.has(this.normalize(providerCode));
  }

  listAdapterCodes() {
    return Array.from(this.adapters.keys()).sort();
  }

  private normalize(providerCode: string) {
    return providerCode.trim().toLowerCase();
  }
}
