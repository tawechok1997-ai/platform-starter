import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AdminActor } from '../../common/actors';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import {
  type GameTournament,
  type GameTournamentLeaderboardCache,
  type GameTournamentLeaderboardEntry,
  type TournamentWriteInput,
  isTournamentRadarDue,
  isTournamentVisible,
  normalizeTournamentWrite,
  publicLeaderboardAlias,
} from './game-tournament.types';

type RequestMeta = { ipAddress?: string; userAgent?: string };
type StoredLeaderboard = GameTournamentLeaderboardCache & { updatedBy: string | null };

const TOURNAMENTS_KEY = 'features.gameTournaments';
const LEADERBOARD_KEY_PREFIX = 'features.gameTournamentLeaderboard.';
const RADAR_TICK_MS = 60_000;

@Injectable()
export class GameTournamentService implements OnModuleInit, OnModuleDestroy {
  private radarTimer: NodeJS.Timeout | null = null;
  private radarRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.radarTimer = setInterval(() => { void this.runDueRadarTournaments(); }, RADAR_TICK_MS);
    this.radarTimer.unref?.();
    const bootstrap = setTimeout(() => { void this.runDueRadarTournaments(); }, 5_000);
    bootstrap.unref?.();
  }

  onModuleDestroy() {
    if (this.radarTimer) clearInterval(this.radarTimer);
    this.radarTimer = null;
  }

  async listAdmin() {
    const tournaments = await this.readTournaments();
    const caches = await this.readLeaderboardCaches(tournaments.map((item) => item.id));
    const gameIds = Array.from(new Set(tournaments.flatMap((item) => item.gameIds)));
    const games = gameIds.length ? await this.prisma.game.findMany({
      where: { id: { in: gameIds } },
      select: { id: true, name: true, providerGameCode: true, status: true, provider: { select: { id: true, name: true, code: true, status: true } } },
    }) : [];
    const gamesById = new Map(games.map((game) => [game.id, game]));
    const now = new Date();

    return {
      items: tournaments.map((tournament) => {
        const leaderboard = caches.get(tournament.id) ?? null;
        return {
          ...tournament,
          games: tournament.gameIds.map((id) => gamesById.get(id)).filter(Boolean),
          leaderboard,
          radarDue: isTournamentRadarDue(tournament, leaderboard, now),
          nextRadarAt: tournament.radarEnabled
            ? new Date((leaderboard ? Date.parse(leaderboard.calculatedAt) : now.getTime()) + tournament.radarIntervalMinutes * 60_000).toISOString()
            : null,
        };
      }),
      summary: {
        total: tournaments.length,
        active: tournaments.filter((item) => item.status === 'ACTIVE').length,
        scheduled: tournaments.filter((item) => item.status === 'SCHEDULED').length,
        radarEnabled: tournaments.filter((item) => item.radarEnabled).length,
      },
    };
  }

  async listPublic() {
    const tournaments = (await this.readTournaments()).filter(isTournamentVisible);
    const caches = await this.readLeaderboardCaches(tournaments.map((item) => item.id));
    return {
      items: tournaments.map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
        description: tournament.description,
        status: tournament.status,
        startsAt: tournament.startsAt,
        endsAt: tournament.endsAt,
        gameIds: tournament.gameIds,
        metric: 'GAME_LAUNCHES' as const,
        leaderboard: this.toPublicLeaderboard(caches.get(tournament.id) ?? null),
      })),
    };
  }

  async getAdminLeaderboard(id: string, refresh = false) {
    const tournament = await this.findTournament(id);
    const cached = await this.readLeaderboardCache(id);
    if (refresh || !cached || isTournamentRadarDue(tournament, cached)) return this.recalculate(id, null, {}, 'admin-read');
    return cached;
  }

  async getPublicLeaderboard(id: string) {
    const tournament = await this.findTournament(id);
    if (!isTournamentVisible(tournament)) throw new NotFoundException('Tournament not found');
    const cached = await this.readLeaderboardCache(id);
    const leaderboard = !cached || isTournamentRadarDue(tournament, cached)
      ? await this.recalculate(id, null, {}, 'public-read')
      : cached;
    return this.toPublicLeaderboard(leaderboard);
  }

  async create(input: TournamentWriteInput, actor: AdminActor, meta: RequestMeta) {
    const tournaments = await this.readTournaments();
    const id = randomUUID();
    let item: GameTournament;
    try {
      item = normalizeTournamentWrite(input, null, id);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Tournament payload is invalid');
    }
    if (tournaments.some((existing) => existing.slug === item.slug)) throw new ConflictException('Tournament slug already exists');
    await this.assertGames(item.gameIds);
    await this.saveTournaments([...tournaments, item], actor, meta, 'game_tournament.create', item.id);
    return item;
  }

  async update(id: string, input: TournamentWriteInput, actor: AdminActor, meta: RequestMeta) {
    const tournaments = await this.readTournaments();
    const index = tournaments.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException('Tournament not found');
    let item: GameTournament;
    try {
      item = normalizeTournamentWrite(input, tournaments[index] ?? null, id);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Tournament payload is invalid');
    }
    if (tournaments.some((existing) => existing.id !== id && existing.slug === item.slug)) throw new ConflictException('Tournament slug already exists');
    await this.assertGames(item.gameIds);
    const next = [...tournaments];
    next[index] = item;
    await this.saveTournaments(next, actor, meta, 'game_tournament.update', item.id);
    return item;
  }

  async remove(id: string, actor: AdminActor, meta: RequestMeta) {
    const tournaments = await this.readTournaments();
    const item = tournaments.find((tournament) => tournament.id === id);
    if (!item) throw new NotFoundException('Tournament not found');
    await this.saveTournaments(tournaments.filter((tournament) => tournament.id !== id), actor, meta, 'game_tournament.delete', id);
    await this.prisma.siteSetting.deleteMany({ where: { key: this.leaderboardKey(id) } });
    return { success: true, id };
  }

  async recalculate(id: string, actor: AdminActor | null, meta: RequestMeta, trigger = 'manual') {
    const tournament = await this.findTournament(id);
    const windowStart = new Date(tournament.startsAt);
    const configuredEnd = new Date(tournament.endsAt);
    const now = new Date();
    const windowEnd = configuredEnd.getTime() < now.getTime() ? configuredEnd : now;
    const entries = windowEnd.getTime() < windowStart.getTime()
      ? []
      : await this.calculateEntries(tournament, windowStart, windowEnd);
    const cache: StoredLeaderboard = {
      tournamentId: tournament.id,
      metric: 'GAME_LAUNCHES',
      calculatedAt: now.toISOString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      entries,
      updatedBy: actor?.id ?? null,
    };

    await this.prisma.siteSetting.upsert({
      where: { key: this.leaderboardKey(id) },
      update: { valueJson: cache as unknown as Prisma.InputJsonValue, group: 'FEATURES', type: 'JSON', isPublic: true, isSensitive: false, updatedBy: actor?.id ?? null },
      create: { key: this.leaderboardKey(id), valueJson: cache as unknown as Prisma.InputJsonValue, group: 'FEATURES', type: 'JSON', isPublic: true, isSensitive: false, updatedBy: actor?.id ?? null },
    });

    if (actor) await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: actor.id,
        action: 'game_tournament.radar.run',
        module: 'game_tournaments',
        targetId: tournament.id,
        oldData: null,
        newData: { trigger, calculatedAt: cache.calculatedAt, entries: cache.entries.length },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }),
    });
    return cache;
  }

  async runDueRadarTournaments() {
    if (this.radarRunning) return { skipped: true, reason: 'already-running' };
    this.radarRunning = true;
    try {
      const tournaments = await this.readTournaments();
      const caches = await this.readLeaderboardCaches(tournaments.map((item) => item.id));
      const due = tournaments.filter((tournament) => isTournamentRadarDue(tournament, caches.get(tournament.id) ?? null));
      const completed: string[] = [];
      const failed: string[] = [];
      for (const tournament of due) {
        try {
          await this.recalculate(tournament.id, null, {}, 'radar');
          completed.push(tournament.id);
        } catch {
          failed.push(tournament.id);
        }
      }
      return { skipped: false, due: due.length, completed, failed };
    } finally {
      this.radarRunning = false;
    }
  }

  private async calculateEntries(tournament: GameTournament, windowStart: Date, windowEnd: Date): Promise<GameTournamentLeaderboardEntry[]> {
    const grouped = await this.prisma.gameSession.groupBy({
      by: ['userId'],
      where: {
        gameId: { in: tournament.gameIds },
        createdAt: { gte: windowStart, lte: windowEnd },
        status: { in: ['LAUNCHED', 'ACTIVE', 'ENDED'] },
      },
      _count: { _all: true },
    });
    const ranked = grouped
      .map((entry) => ({ userId: entry.userId, score: entry._count._all }))
      .sort((left, right) => right.score - left.score || left.userId.localeCompare(right.userId))
      .slice(0, tournament.leaderboardSize);
    if (!ranked.length) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: ranked.map((entry) => entry.userId) } },
      select: { id: true, username: true, profile: { select: { displayName: true } } },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));
    return ranked.map((entry, index) => {
      const user = usersById.get(entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        username: user?.username ?? 'member',
        displayName: user?.profile?.displayName ?? null,
        score: entry.score,
      };
    });
  }

  private async assertGames(gameIds: string[]) {
    const count = await this.prisma.game.count({ where: { id: { in: gameIds } } });
    if (count !== gameIds.length) throw new BadRequestException('One or more tournament games do not exist');
  }

  private async findTournament(id: string) {
    const tournament = (await this.readTournaments()).find((item) => item.id === id);
    if (!tournament) throw new NotFoundException('Tournament not found');
    return tournament;
  }

  private async readTournaments(): Promise<GameTournament[]> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key: TOURNAMENTS_KEY } });
    const raw = setting?.valueJson;
    if (!Array.isArray(raw)) return [];
    return raw.map((value) => this.parseTournament(value)).filter((value): value is GameTournament => value !== null);
  }

  private parseTournament(value: unknown): GameTournament | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    try {
      return normalizeTournamentWrite({
        name: String(record.name ?? ''),
        slug: String(record.slug ?? ''),
        description: String(record.description ?? ''),
        status: record.status as GameTournament['status'],
        startsAt: String(record.startsAt ?? ''),
        endsAt: String(record.endsAt ?? ''),
        gameIds: Array.isArray(record.gameIds) ? record.gameIds.map(String) : [],
        leaderboardSize: Number(record.leaderboardSize ?? 50),
        radarEnabled: Boolean(record.radarEnabled),
        radarIntervalMinutes: Number(record.radarIntervalMinutes ?? 15),
      }, {
        id: String(record.id ?? ''),
        name: String(record.name ?? ''),
        slug: String(record.slug ?? ''),
        description: String(record.description ?? ''),
        status: record.status as GameTournament['status'],
        startsAt: String(record.startsAt ?? ''),
        endsAt: String(record.endsAt ?? ''),
        gameIds: Array.isArray(record.gameIds) ? record.gameIds.map(String) : [],
        leaderboardSize: Number(record.leaderboardSize ?? 50),
        radarEnabled: Boolean(record.radarEnabled),
        radarIntervalMinutes: Number(record.radarIntervalMinutes ?? 15),
        createdAt: String(record.createdAt ?? new Date(0).toISOString()),
        updatedAt: String(record.updatedAt ?? record.createdAt ?? new Date(0).toISOString()),
      }, String(record.id ?? ''), new Date(String(record.updatedAt ?? record.createdAt ?? new Date().toISOString())));
    } catch {
      return null;
    }
  }

  private async saveTournaments(items: GameTournament[], actor: AdminActor, meta: RequestMeta, action: string, targetId: string) {
    const nextValue = items as unknown as Prisma.InputJsonValue;
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.siteSetting.findUnique({ where: { key: TOURNAMENTS_KEY } });
      const saved = await tx.siteSetting.upsert({
        where: { key: TOURNAMENTS_KEY },
        update: { valueJson: nextValue, group: 'FEATURES', type: 'JSON', isPublic: true, isSensitive: false, updatedBy: actor.id },
        create: { key: TOURNAMENTS_KEY, valueJson: nextValue, group: 'FEATURES', type: 'JSON', isPublic: true, isSensitive: false, updatedBy: actor.id },
      });
      await tx.siteSettingHistory.create({
        data: {
          settingKey: TOURNAMENTS_KEY,
          oldValueJson: current?.valueJson ?? Prisma.JsonNull,
          newValueJson: saved.valueJson,
          changedBy: actor.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          action,
          module: 'game_tournaments',
          targetId,
          oldData: current?.valueJson ?? null,
          newData: saved.valueJson,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
    });
  }

  private async readLeaderboardCaches(ids: string[]) {
    if (!ids.length) return new Map<string, GameTournamentLeaderboardCache>();
    const settings = await this.prisma.siteSetting.findMany({ where: { key: { in: ids.map((id) => this.leaderboardKey(id)) } } });
    const result = new Map<string, GameTournamentLeaderboardCache>();
    for (const setting of settings) {
      const cache = this.parseLeaderboard(setting.valueJson);
      if (cache) result.set(cache.tournamentId, cache);
    }
    return result;
  }

  private async readLeaderboardCache(id: string) {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key: this.leaderboardKey(id) } });
    return this.parseLeaderboard(setting?.valueJson);
  }

  private parseLeaderboard(value: unknown): GameTournamentLeaderboardCache | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (!Array.isArray(record.entries)) return null;
    const tournamentId = String(record.tournamentId ?? '');
    const calculatedAt = String(record.calculatedAt ?? '');
    if (!tournamentId || !Number.isFinite(Date.parse(calculatedAt))) return null;
    return {
      tournamentId,
      metric: 'GAME_LAUNCHES',
      calculatedAt,
      windowStart: String(record.windowStart ?? calculatedAt),
      windowEnd: String(record.windowEnd ?? calculatedAt),
      entries: record.entries.map((entry, index) => {
        const item = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry as Record<string, unknown> : {};
        return {
          rank: Number(item.rank ?? index + 1),
          userId: String(item.userId ?? ''),
          username: String(item.username ?? 'member'),
          displayName: item.displayName == null ? null : String(item.displayName),
          score: Number(item.score ?? 0),
        };
      }).filter((entry) => entry.userId && Number.isFinite(entry.score)),
    };
  }

  private toPublicLeaderboard(cache: GameTournamentLeaderboardCache | null) {
    if (!cache) return null;
    return {
      metric: cache.metric,
      calculatedAt: cache.calculatedAt,
      windowStart: cache.windowStart,
      windowEnd: cache.windowEnd,
      entries: cache.entries.map((entry) => ({ rank: entry.rank, alias: publicLeaderboardAlias(entry), score: entry.score })),
    };
  }

  private leaderboardKey(id: string) {
    return `${LEADERBOARD_KEY_PREFIX}${id}`;
  }
}
