import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { mapAdminSession } from './admin-session.mapper';

@Injectable()
export class AdminSessionsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listSessions(adminUserId: string, currentSessionId: string) {
    const sessions = await this.prisma.authSession.findMany({
      where: { adminUserId, type: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const now = new Date();
    return {
      items: sessions.map((session) => mapAdminSession(session, currentSessionId, now)),
    };
  }
}
