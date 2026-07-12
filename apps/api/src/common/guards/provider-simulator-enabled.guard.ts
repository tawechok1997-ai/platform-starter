import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProviderSimulatorEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(_context: ExecutionContext) {
    const environment = this.config.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
    const enabled = this.config.get<string>('ENABLE_PROVIDER_SIMULATOR') === 'true';
    if (environment === 'production' || !enabled) {
      throw new NotFoundException();
    }
    return true;
  }
}
