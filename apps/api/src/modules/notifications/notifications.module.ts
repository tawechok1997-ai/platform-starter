import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { NotificationFeedReadRepository } from './notification-feed-read.repository';
import { NotificationsCommandService } from './notifications-command.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsQueryService } from './notifications-query.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsQueryService,
    NotificationsCommandService,
    NotificationFeedReadRepository,
  ],
})
export class NotificationsModule {}
