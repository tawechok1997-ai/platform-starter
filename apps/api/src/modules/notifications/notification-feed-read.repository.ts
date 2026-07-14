import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const FEED_SOURCE_LIMIT = 20;

const TOP_UP_FEED_PROJECTION = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  updatedAt: true,
} as const;

const WITHDRAWAL_FEED_PROJECTION = {
  id: true,
  amount: true,
  currency: true,
  status: true,
  updatedAt: true,
} as const;

const SUPPORT_FEED_PROJECTION = {
  id: true,
  title: true,
  status: true,
  updatedAt: true,
} as const;

const LOGIN_FEED_PROJECTION = {
  id: true,
  success: true,
  ipAddress: true,
  reason: true,
  createdAt: true,
} as const;

@Injectable()
export class NotificationFeedReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  loadMemberFeedSources(userId: string) {
    return Promise.all([
      this.prisma.topUpRequest.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: FEED_SOURCE_LIMIT,
        select: TOP_UP_FEED_PROJECTION,
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: FEED_SOURCE_LIMIT,
        select: WITHDRAWAL_FEED_PROJECTION,
      }),
      this.prisma.riskAlert.findMany({
        where: { memberId: userId, refType: 'SUPPORT_TICKET' },
        orderBy: { updatedAt: 'desc' },
        take: FEED_SOURCE_LIMIT,
        select: SUPPORT_FEED_PROJECTION,
      }),
      this.prisma.loginHistory.findMany({
        where: { userId, type: 'MEMBER' },
        orderBy: { createdAt: 'desc' },
        take: FEED_SOURCE_LIMIT,
        select: LOGIN_FEED_PROJECTION,
      }),
    ]);
  }
}
