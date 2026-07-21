import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GameSessionTokenService } from './game-session-token.service';

type SessionLifecycleRow = {
  id: string;
  userId: string;
  status: string;
  launchTokenHash: string | null;
  launchTokenExpiresAt: Date | null;
  launchTokenRevokedAt: Date | null;
  lastHeartbeatAt: Date | null;
  endedAt: Date | null;
  closedReason: string | null;
};

@Injectable()
export class GameSessionLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: GameSessionTokenService,
  ) {}

  async issueForMember(sessionId: string, userId: string, ttlMs = 15 * 60_000) {
    const session = await this.getOwnedSession(sessionId, userId);
    if (['ENDED', 'FAILED', 'EXPIRED'].includes(session.status)) {
      throw new UnauthorizedException('Game session is no longer active');
    }

    const issued = this.tokens.issue(ttlMs);
    await this.prisma.$executeRaw`
      UPDATE "game_sessions"
      SET
        "launch_token_hash" = ${issued.tokenHash},
        "launch_token_expires_at" = ${issued.expiresAt},
        "launch_token_revoked_at" = NULL,
        "last_heartbeat_at" = NOW(),
        "updated_at" = NOW()
      WHERE "id" = ${sessionId}::uuid
        AND "user_id" = ${userId}::uuid
    `;

    return {
      sessionId,
      token: issued.token,
      expiresAt: issued.expiresAt.toISOString(),
    };
  }

  async heartbeat(sessionId: string, userId: string, token: string) {
    const session = await this.getOwnedSession(sessionId, userId);
    this.verifySessionToken(session, token);
    if (['ENDED', 'FAILED', 'EXPIRED'].includes(session.status)) {
      throw new UnauthorizedException('Game session is no longer active');
    }

    const rows = await this.prisma.$queryRaw<Array<{ lastHeartbeatAt: Date }>>(Prisma.sql`
      UPDATE "game_sessions"
      SET
        "status" = CASE WHEN "status" = 'LAUNCHED' THEN 'ACTIVE'::"GameSessionStatus" ELSE "status" END,
        "last_heartbeat_at" = NOW(),
        "updated_at" = NOW()
      WHERE "id" = ${sessionId}::uuid
        AND "user_id" = ${userId}::uuid
      RETURNING "last_heartbeat_at" AS "lastHeartbeatAt"
    `);

    return { sessionId, status: 'ACTIVE', lastHeartbeatAt: rows[0]?.lastHeartbeatAt.toISOString() };
  }

  async revoke(sessionId: string, userId: string) {
    await this.getOwnedSession(sessionId, userId);
    await this.prisma.$executeRaw`
      UPDATE "game_sessions"
      SET
        "launch_token_revoked_at" = COALESCE("launch_token_revoked_at", NOW()),
        "updated_at" = NOW()
      WHERE "id" = ${sessionId}::uuid
        AND "user_id" = ${userId}::uuid
    `;
    return { sessionId, revoked: true };
  }

  async close(sessionId: string, userId: string, reason = 'member_closed') {
    await this.getOwnedSession(sessionId, userId);
    const normalizedReason = reason.trim().slice(0, 240) || 'member_closed';
    await this.prisma.$executeRaw`
      UPDATE "game_sessions"
      SET
        "status" = 'ENDED'::"GameSessionStatus",
        "ended_at" = COALESCE("ended_at", NOW()),
        "launch_token_revoked_at" = COALESCE("launch_token_revoked_at", NOW()),
        "closed_reason" = ${normalizedReason},
        "updated_at" = NOW()
      WHERE "id" = ${sessionId}::uuid
        AND "user_id" = ${userId}::uuid
    `;
    return { sessionId, status: 'ENDED', reason: normalizedReason };
  }

  async expireStale(now = new Date()) {
    const count = await this.prisma.$executeRaw`
      UPDATE "game_sessions"
      SET
        "status" = 'EXPIRED'::"GameSessionStatus",
        "ended_at" = COALESCE("ended_at", ${now}),
        "launch_token_revoked_at" = COALESCE("launch_token_revoked_at", ${now}),
        "closed_reason" = COALESCE("closed_reason", 'token_expired'),
        "updated_at" = NOW()
      WHERE "status" IN ('CREATED', 'LAUNCHED', 'ACTIVE')
        AND "launch_token_expires_at" IS NOT NULL
        AND "launch_token_expires_at" <= ${now}
    `;
    return { expired: count, checkedAt: now.toISOString() };
  }

  private async getOwnedSession(sessionId: string, userId: string) {
    const rows = await this.prisma.$queryRaw<SessionLifecycleRow[]>(Prisma.sql`
      SELECT
        "id",
        "user_id" AS "userId",
        "status"::text AS "status",
        "launch_token_hash" AS "launchTokenHash",
        "launch_token_expires_at" AS "launchTokenExpiresAt",
        "launch_token_revoked_at" AS "launchTokenRevokedAt",
        "last_heartbeat_at" AS "lastHeartbeatAt",
        "ended_at" AS "endedAt",
        "closed_reason" AS "closedReason"
      FROM "game_sessions"
      WHERE "id" = ${sessionId}::uuid
        AND "user_id" = ${userId}::uuid
      LIMIT 1
    `);
    if (!rows[0]) throw new NotFoundException('Game session not found');
    return rows[0];
  }

  private verifySessionToken(session: SessionLifecycleRow, token: string) {
    if (!session.launchTokenHash || !session.launchTokenExpiresAt) {
      throw new UnauthorizedException('Game session token has not been issued');
    }
    this.tokens.verify(
      token,
      session.launchTokenHash,
      session.launchTokenExpiresAt,
      session.launchTokenRevokedAt,
    );
  }
}
