import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { OperationsController } from './operations.controller';
import { ActivityService } from './activity.service';
import { AdminActivityQueryService } from './admin-activity-query.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [OperationsController],
  providers: [ActivityService, AdminActivityQueryService],
  exports: [ActivityService, AdminActivityQueryService],
})
export class ActivityModule {}
