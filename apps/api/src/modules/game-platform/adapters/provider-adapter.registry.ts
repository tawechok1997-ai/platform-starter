import { Injectable, NotFoundException } from '@nestjs/common';
import { GameProviderAdapter } from '../provider-adapter.interface';
import { DemoProviderAdapter } from './demo-provider.adapter';
import { SimulatorProviderAdapter } from './simulator-provider.adapter';
import { GenericTransferProviderAdapter } from './generic-transfer-provider.adapter';

@Injectable()
export class ProviderAdapterRegistry {
  private readonly adapters = new Map<string, GameProviderAdapter>();

  constructor() {
    this.register('demo-provider', new DemoProviderAdapter());
    this.register('simulator-provider', new SimulatorProviderAdapter());
    this.register('generic-transfer', new GenericTransferProviderAdapter());
    this.register('real-provider', new GenericTransferProviderAdapter());
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
