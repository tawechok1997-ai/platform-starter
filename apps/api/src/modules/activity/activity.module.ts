import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { AdminActivityModule } from '../admin-activity/admin-activity.module';
import { OperationsController } from './operations.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [JwtAuthModule, AdminActivityModule],
  controllers: [OperationsController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
