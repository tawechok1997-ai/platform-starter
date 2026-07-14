import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { MatchRiskWatchlistDto } from './dto/risk-watchlist.dto';
import {
  mapRiskWatchlistItem,
  mapRiskWatchlistMatch,
  type RiskWatchlistRow,
} from './risk-watchlist.mapper';

export type RiskWatchlistListFilter = {
  status?: string;
  listType?: string;
  subjectType?: string;
  memberId?: string;
  page?: string;
  take?: string;
};

@Injectable()
export class RiskWatchlistQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: RiskWatchlistListFilter = {}) {
    const page = Math.max(Number(filter.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(filter.take ?? 50) || 50, 1), 100);
    const clauses: Prisma.Sql[] = [Prisma.sql`1=1`];
    if (filter.status) clauses.push(Prisma.sql`"status" = ${filter.status}`);
    if (filter.listType) clauses.push(Prisma.sql`"list_type" = ${filter.listType}`);
    if (filter.subjectType) clauses.push(Prisma.sql`"subject_type" = ${filter.subjectType}`);
    if (filter.memberId) clauses.push(Prisma.sql`"member_id" = ${filter.memberId}::uuid`);
    const where = Prisma.join(clauses, ' AND ');
    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<RiskWatchlistRow[]>(Prisma.sql`
        SELECT * FROM "risk_watchlist_entries"
        WHERE ${where}
        ORDER BY "created_at" DESC
        OFFSET ${(page - 1) * take} LIMIT ${take}
      `),
      this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM "risk_watchlist_entries" WHERE ${where}
      `),
    ]);
    const total = Number(countRows[0]?.count ?? 0);
    return {
      items: items.map(mapRiskWatchlistItem),
      total,
      page,
      take,
      pageCount: Math.max(Math.ceil(total / take), 1),
    };
  }

  async match(input: MatchRiskWatchlistDto) {
    const normalized = this.normalize(input.subjectType, input.subjectValue);
    const hash = this.hash(normalized);
    const items = await this.prisma.$queryRaw<RiskWatchlistRow[]>(Prisma.sql`
      SELECT "id", "subject_type", "display_masked", "list_type", "reason_code", "severity", "member_id", "expires_at", "created_at"
      FROM "risk_watchlist_entries"
      WHERE "subject_type" = ${input.subjectType}
        AND "subject_value_hash" = ${hash}
        AND "status" = 'ACTIVE'
        AND ("expires_at" IS NULL OR "expires_at" > CURRENT_TIMESTAMP)
      ORDER BY CASE WHEN "list_type" = 'BLACKLIST' THEN 0 ELSE 1 END, "severity" DESC
    `);
    return mapRiskWatchlistMatch(items);
  }

  private normalize(subjectType: string, value: string) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) throw new BadRequestException('subjectValue is required');
    if (subjectType === 'EMAIL') return trimmed.toLowerCase();
    if (subjectType === 'PHONE' || subjectType === 'BANK_ACCOUNT') return trimmed.replace(/[^0-9]/g, '');
    if (subjectType === 'IP') return trimmed.toLowerCase();
    return trimmed;
  }

  private hash(value: string) {
    const secret = process.env.RISK_MATCH_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 16) throw new BadRequestException('Risk matching secret is not configured');
    return createHmac('sha256', secret).update(value).digest('hex');
  }
}
