import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { WithdrawalWorkflowController } from './withdrawal-workflow.controller';
import { WithdrawalWorkflowService } from './withdrawal-workflow.service';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), StorageModule],
  controllers: [WithdrawalsController, WithdrawalWorkflowController],
  providers: [WithdrawalsService, WithdrawalWorkflowService],
  exports: [WithdrawalsService, WithdrawalWorkflowService],
})
export class WithdrawalsModule {}
