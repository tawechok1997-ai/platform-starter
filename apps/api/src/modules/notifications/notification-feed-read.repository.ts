import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  LOGIN_NOTIFICATION_LIST_PROJECTION,
  NOTIFICATION_CHANNEL_DETAIL_PROJECTION,
  NOTIFICATION_FEED_SOURCE_LIMIT,
  NOTIFICATION_PREFERENCE_DETAIL_PROJECTION,
  NOTIFICATION_STATE_LIST_PROJECTION,
  SUPPORT_NOTIFICATION_LIST_PROJECTION,
  TOP_UP_NOTIFICATION_LIST_PROJECTION,
  WITHDRAWAL_NOTIFICATION_LIST_PROJECTION,
} from './notification-read.projections';

@Injectable()
export class NotificationFeedReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  loadMemberFeedSources(userId: string) {
    return Promise.all([
      this.prisma.topUpRequest.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: NOTIFICATION_FEED_SOURCE_LIMIT,
        select: TOP_UP_NOTIFICATION_LIST_PROJECTION,
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: NOTIFICATION_FEED_SOURCE_LIMIT,
        select: WITHDRAWAL_NOTIFICATION_LIST_PROJECTION,
      }),
      this.prisma.riskAlert.findMany({
        where: { memberId: userId, refType: 'SUPPORT_TICKET' },
        orderBy: { updatedAt: 'desc' },
        take: NOTIFICATION_FEED_SOURCE_LIMIT,
        select: SUPPORT_NOTIFICATION_LIST_PROJECTION,
      }),
      this.prisma.loginHistory.findMany({
        where: { userId, type: 'MEMBER' },
        orderBy: { createdAt: 'desc' },
        take: NOTIFICATION_FEED_SOURCE_LIMIT,
        select: LOGIN_NOTIFICATION_LIST_PROJECTION,
      }),
    ]);
  }

  loadMemberFeedState(userId: string, notificationKeys: string[]) {
    return this.prisma.notificationState.findMany({
      where: { userId, notificationKey: { in: notificationKeys } },
      select: NOTIFICATION_STATE_LIST_PROJECTION,
    });
  }

  loadMemberPreferenceDetail(userId: string, channelSettingKey: string) {
    return Promise.all([
      this.prisma.notificationPreference.findUnique({
        where: { userId },
        select: NOTIFICATION_PREFERENCE_DETAIL_PROJECTION,
      }),
      this.prisma.siteSetting.findUnique({
        where: { key: channelSettingKey },
        select: NOTIFICATION_CHANNEL_DETAIL_PROJECTION,
      }),
    ]);
  }
}
