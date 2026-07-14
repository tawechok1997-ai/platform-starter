import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { DomainError } from '../../common/domain/domain-error';
import { PrismaService } from '../../database/prisma.service';
import { WatchlistPolicy } from './domain/watchlist.policy';
import { CreateRiskWatchlistEntryDto, ReleaseRiskWatchlistEntryDto } from './dto/risk-watchlist.dto';
import { mapRiskWatchlistItem, type RiskWatchlistRow } from './risk-watchlist.mapper';

@Injectable()
export class RiskWatchlistCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRiskWatchlistEntryDto, actor: { id: string }) {
    const normalized = this.normalize(input.subjectType, input.subjectValue);
    const hash = this.hash(normalized);
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new BadRequestException('Invalid expiresAt');
    if (expiresAt && expiresAt <= new Date()) throw new BadRequestException('expiresAt must be in the future');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<RiskWatchlistRow[]>(Prisma.sql`
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
        const mapped = mapRiskWatchlistItem(item);
        await tx.adminAuditLog.create({
          data: buildAdminAuditData({
            adminUserId: actor.id,
            module: 'risk_watchlist',
            action: 'CREATE_RISK_WATCHLIST_ENTRY',
            targetId: String(item.id),
            newData: mapped,
          }),
        });
        return { item: mapped };
      });
    } catch (error: unknown) {
      if (this.databaseErrorCode(error) === '23505') {
        throw new ConflictException('Active watchlist entry already exists');
      }
      throw error;
    }
  }

  async release(id: string, input: ReleaseRiskWatchlistEntryDto, actor: { id: string }) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<RiskWatchlistRow[]>(Prisma.sql`
        SELECT * FROM "risk_watchlist_entries" WHERE "id" = ${id}::uuid FOR UPDATE
      `);
      const existing = rows[0];
      if (!existing) throw new NotFoundException('Risk watchlist entry not found');
      if (Number(existing.version) !== input.version) {
        throw new ConflictException('Risk watchlist entry was modified by another request');
      }
      this.assertReleasePolicy(String(existing.status), input.reason);

      const updatedRows = await tx.$queryRaw<RiskWatchlistRow[]>(Prisma.sql`
        UPDATE "risk_watchlist_entries"
        SET "status" = 'RELEASED', "released_by_admin_id" = ${actor.id}::uuid,
            "released_at" = CURRENT_TIMESTAMP, "release_reason" = ${input.reason},
            "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${id}::uuid AND "version" = ${input.version}
        RETURNING *
      `);
      const updated = updatedRows[0];
      if (!updated) throw new ConflictException('Risk watchlist entry was modified by another request');

      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          module: 'risk_watchlist',
          action: 'RELEASE_RISK_WATCHLIST_ENTRY',
          targetId: id,
          oldData: { status: existing.status, version: existing.version },
          newData: { status: 'RELEASED', version: Number(existing.version) + 1, reason: input.reason },
        }),
      });
      return { item: mapRiskWatchlistItem(updated) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private assertReleasePolicy(status: string, reason?: string | null) {
    try {
      WatchlistPolicy.assertRelease({ status, reason });
    } catch (error: unknown) {
      if (error instanceof DomainError) throw new BadRequestException(error.message);
      throw error;
    }
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
    if (['PHONE', 'BANK_ACCOUNT'].includes(subjectType)) {
      return `${'*'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
    }
    if (subjectType === 'IP') return value.replace(/(\d+)$/, '***');
    return value.length <= 8 ? `${value.slice(0, 2)}***` : `${value.slice(0, 4)}***${value.slice(-4)}`;
  }

  private databaseErrorCode(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
  }
}
