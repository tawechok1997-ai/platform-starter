import { Module } from '@nestjs/common';
import { ProviderSimulatorController } from './provider-simulator.controller';
import { ProviderSimulatorService } from './provider-simulator.service';

@Module({
  controllers: [ProviderSimulatorController],
  providers: [ProviderSimulatorService],
  exports: [ProviderSimulatorService],
})
export class ProviderSimulatorModule {}
