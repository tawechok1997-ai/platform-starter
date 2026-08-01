import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { AdminActivityModule } from '../admin-activity/admin-activity.module';
import { AdminActivitiesController } from './admin-activities.controller';
import { ActivityConfigService } from './activity-config.service';
import { ActivityRepository } from './activity.repository';
import { ActivityService } from './activity.service';
import { MemberActivitiesController } from './member-activities.controller';
import { MemberActivitiesService } from './member-activities.service';
import { OperationsController } from './operations.controller';

@Module({
  imports: [DatabaseModule, JwtAuthModule, AdminActivityModule],
  controllers: [OperationsController, MemberActivitiesController, AdminActivitiesController],
  providers: [ActivityService, ActivityConfigService, ActivityRepository, MemberActivitiesService],
  exports: [ActivityService, ActivityConfigService, MemberActivitiesService],
})
export class ActivityModule {}
