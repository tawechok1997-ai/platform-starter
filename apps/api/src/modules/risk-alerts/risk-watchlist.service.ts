import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateRiskWatchlistEntryDto, MatchRiskWatchlistDto, ReleaseRiskWatchlistEntryDto } from './dto/risk-watchlist.dto';

@Injectable()
export class RiskWatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: { status?: string; listType?: string; subjectType?: string; memberId?: string; page?: string; take?: string } = {}) {
    const page = Math.max(Number(filter.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(filter.take ?? 50) || 50, 1), 100);
    const clauses: Prisma.Sql[] = [Prisma.sql`1=1`];
    if (filter.status) clauses.push(Prisma.sql`"status" = ${filter.status}`);
    if (filter.listType) clauses.push(Prisma.sql`"list_type" = ${filter.listType}`);
    if (filter.subjectType) clauses.push(Prisma.sql`"subject_type" = ${filter.subjectType}`);
    if (filter.memberId) clauses.push(Prisma.sql`"member_id" = ${filter.memberId}::uuid`);
    const where = Prisma.join(clauses, ' AND ');
    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
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
    return { items: items.map((item) => this.publicItem(item)), total, page, take, pageCount: Math.max(Math.ceil(total / take), 1) };
  }

  async create(input: CreateRiskWatchlistEntryDto, actor: { id: string }) {
    const normalized = this.normalize(input.subjectType, input.subjectValue);
    const hash = this.hash(normalized);
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new BadRequestException('Invalid expiresAt');
    if (expiresAt && expiresAt <= new Date()) throw new BadRequestException('expiresAt must be in the future');
    try {
      const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        INSERT INTO "risk_watchlist_entries" (
          "subject_type", "subject_value_hash", "display_masked", "list_type", "reason_code",
          "severity", "member_id", "note", "evidence", "expires_at", "created_by_admin_id"
        ) VALUES (
          ${input.subjectType}, ${hash}, ${this.mask(input.subjectType, normalized)}, ${input.listType}, ${input.reasonCode},
          ${input.severity ?? 'MEDIUM'}, ${input.memberId ?? null}::uuid, ${input.note ?? null},
          ${input.evidence ? JSON.stringify(input.evidence) : null}::jsonb, ${expiresAt}, ${actor.id}::uuid
        ) RETURNING *
      `);
      const item = rows[0];
      await this.audit(actor.id, 'CREATE_RISK_WATCHLIST_ENTRY', String(item.id), null, this.publicItem(item));
      return { item: this.publicItem(item) };
    } catch (error: any) {
      if (error?.code === '23505') throw new ConflictException('Active watchlist entry already exists');
      throw error;
    }
  }

  async release(id: string, input: ReleaseRiskWatchlistEntryDto, actor: { id: string }) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        SELECT * FROM "risk_watchlist_entries" WHERE "id" = ${id}::uuid FOR UPDATE
      `);
      const existing = rows[0];
      if (!existing) throw new NotFoundException('Risk watchlist entry not found');
      if (existing.status !== 'ACTIVE') throw new BadRequestException('Only active entries can be released');
      if (Number(existing.version) !== input.version) throw new ConflictException('Risk watchlist entry was modified by another request');
      const updatedRows = await tx.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        UPDATE "risk_watchlist_entries"
        SET "status" = 'RELEASED', "released_by_admin_id" = ${actor.id}::uuid,
            "released_at" = CURRENT_TIMESTAMP, "release_reason" = ${input.reason},
            "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${id}::uuid AND "version" = ${input.version}
        RETURNING *
      `);
      const updated = updatedRows[0];
      if (!updated) throw new ConflictException('Risk watchlist entry was modified by another request');
      await tx.adminAuditLog.create({ data: {
        adminUserId: actor.id, module: 'risk_watchlist', action: 'RELEASE_RISK_WATCHLIST_ENTRY', targetId: id,
        oldData: { status: existing.status, version: existing.version },
        newData: { status: 'RELEASED', version: Number(existing.version) + 1, reason: input.reason },
      } });
      return { item: this.publicItem(updated) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async match(input: MatchRiskWatchlistDto) {
    const normalized = this.normalize(input.subjectType, input.subjectValue);
    const hash = this.hash(normalized);
    const items = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT "id", "subject_type", "display_masked", "list_type", "reason_code", "severity", "member_id", "expires_at", "created_at"
      FROM "risk_watchlist_entries"
      WHERE "subject_type" = ${input.subjectType}
        AND "subject_value_hash" = ${hash}
        AND "status" = 'ACTIVE'
        AND ("expires_at" IS NULL OR "expires_at" > CURRENT_TIMESTAMP)
      ORDER BY CASE WHEN "list_type" = 'BLACKLIST' THEN 0 ELSE 1 END, "severity" DESC
    `);
    return {
      matched: items.length > 0,
      blocked: items.some((item) => item.list_type === 'BLACKLIST'),
      items: items.map((item) => this.publicItem(item)),
    };
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

  private mask(subjectType: string, value: string) {
    if (subjectType === 'EMAIL') {
      const [name, domain = ''] = value.split('@');
      return `${name.slice(0, 2)}***@${domain}`;
    }
    if (['PHONE', 'BANK_ACCOUNT'].includes(subjectType)) return `${'*'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
    if (subjectType === 'IP') return value.replace(/(\d+)$/, '***');
    return value.length <= 8 ? `${value.slice(0, 2)}***` : `${value.slice(0, 4)}***${value.slice(-4)}`;
  }

  private publicItem(item: Record<string, any>) {
    return {
      id: item.id, subjectType: item.subject_type, displayMasked: item.display_masked,
      listType: item.list_type, reasonCode: item.reason_code, severity: item.severity,
      status: item.status, memberId: item.member_id, note: item.note, evidence: item.evidence,
      expiresAt: item.expires_at, releasedAt: item.released_at, releaseReason: item.release_reason,
      version: Number(item.version ?? 1), createdAt: item.created_at, updatedAt: item.updated_at,
    };
  }

  private audit(adminUserId: string, action: string, targetId: string, oldData: any, newData: any) {
    return this.prisma.adminAuditLog.create({ data: { adminUserId, module: 'risk_watchlist', action, targetId, oldData, newData } });
  }
}
