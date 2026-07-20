import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { AdminActivityController } from './admin-activity.controller';
import { AdminActivityQueryService } from './admin-activity-query.service';
import { AdminActivityService } from './admin-activity.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [AdminActivityController],
  providers: [AdminActivityService, AdminActivityQueryService],
  exports: [AdminActivityService, AdminActivityQueryService],
})
export class AdminActivityModule {}
