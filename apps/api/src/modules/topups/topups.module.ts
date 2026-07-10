import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { DepositWorkflowController } from './deposit-workflow.controller';
import { DepositWorkflowService } from './deposit-workflow.service';
import { TopUpsController } from './topups.controller';
import { TopUpsService } from './topups.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), StorageModule],
  controllers: [TopUpsController, DepositWorkflowController],
  providers: [TopUpsService, DepositWorkflowService],
  exports: [TopUpsService, DepositWorkflowService],
})
export class TopUpsModule {}
