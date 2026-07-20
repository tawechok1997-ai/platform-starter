import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    this.register('provider-simulator', genericTransferAdapter);
  }

  register(providerCode: string, adapter: GameProviderAdapter, options: { replace?: boolean } = {}) {
    const code = this.normalize(providerCode);
    if (!code) throw new BadRequestException('Provider code is required');
    if (!adapter) throw new BadRequestException(`Provider adapter is required for ${code}`);
    if (this.adapters.has(code) && options.replace !== true) {
      throw new ConflictException(`Provider adapter already registered for ${code}`);
    }
    this.adapters.set(code, adapter);
    return adapter;
  }

  getAdapter(providerCode: string) {
    const code = this.normalize(providerCode);
    if (!code) throw new BadRequestException('Provider code is required');
    const adapter = this.adapters.get(code);
    if (!adapter) throw new NotFoundException(`Provider adapter not registered for ${providerCode}`);
    return adapter;
  }

  hasAdapter(providerCode: string) {
    const code = this.normalize(providerCode);
    return Boolean(code) && this.adapters.has(code);
  }

  listAdapterCodes() {
    return Array.from(this.adapters.keys()).sort();
  }

  describeAdapters() {
    return this.listAdapterCodes().map((providerCode) => ({
      providerCode,
      adapterName: this.adapters.get(providerCode)?.constructor.name ?? 'UnknownAdapter',
    }));
  }

  private normalize(providerCode: string) {
    return typeof providerCode === 'string' ? providerCode.trim().toLowerCase() : '';
  }
}
