import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { OperationsController } from './operations.controller';
import { ActivityService } from './activity.service';
import { AdminActivityQueryService } from './admin-activity-query.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [OperationsController],
  providers: [ActivityService, AdminActivityQueryService],
  exports: [ActivityService, AdminActivityQueryService],
})
export class ActivityModule {}
