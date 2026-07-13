import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RiskWatchlistService } from './risk-watchlist.service';

export type RiskSubject = {
  subjectType: 'MEMBER' | 'PHONE' | 'EMAIL' | 'BANK_ACCOUNT' | 'DEVICE' | 'IP';
  subjectValue: string;
};

@Injectable()
export class RiskEnforcementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly watchlist: RiskWatchlistService,
  ) {}

  async enforce(input: {
    subjects: RiskSubject[];
    context: string;
    memberId?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    actorId?: string | null;
    overrideReason?: string | null;
  }) {
    const unique = new Map<string, RiskSubject>();
    for (const subject of input.subjects) {
      const value = String(subject.subjectValue ?? '').trim();
      if (!value) continue;
      unique.set(`${subject.subjectType}:${value}`, { ...subject, subjectValue: value });
    }

    const matches = [] as Array<Record<string, any>>;
    for (const subject of unique.values()) {
      const result = await this.watchlist.match(subject);
      for (const item of result.items) matches.push({ ...item, subjectType: subject.subjectType });
    }

    if (!matches.length) return { matched: false, blocked: false, items: [] };

    const blocked = matches.some((item) => item.listType === 'BLACKLIST');
    await this.createRiskAlert({ ...input, matches, blocked });

    const overrideReason = String(input.overrideReason ?? '').trim();
    if (blocked && !overrideReason) {
      throw new BadRequestException('รายการนี้ตรงกับ blacklist และไม่สามารถดำเนินการต่อได้');
    }
    if (blocked && overrideReason.length < 10) {
      throw new BadRequestException('เหตุผล override blacklist ต้องมีอย่างน้อย 10 ตัวอักษร');
    }
    if (blocked && !input.actorId) {
      throw new BadRequestException('Blacklist override requires an authenticated admin');
    }

    if (blocked) {
      await this.prisma.adminAuditLog.create({
        data: {
          adminUserId: input.actorId!,
          module: 'risk_watchlist',
          action: 'OVERRIDE_BLACKLIST_MATCH',
          targetId: input.referenceId ?? input.memberId ?? input.context,
          oldData: { blocked: true, matches: matches.map((item) => item.id) },
          newData: { overrideReason, context: input.context },
        },
      });
    }

    return { matched: true, blocked, overridden: blocked, items: matches };
  }

  private async createRiskAlert(input: {
    context: string;
    memberId?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    matches: Array<Record<string, any>>;
    blocked: boolean;
  }) {
    const severity = input.blocked ? 'CRITICAL' : 'HIGH';
    const title = input.blocked ? 'พบข้อมูลตรงกับ blacklist' : 'พบข้อมูลตรงกับ watchlist';
    const description = `พบรายการความเสี่ยง ${input.matches.length} รายการในขั้นตอน ${input.context}`;
    const metadata = {
      context: input.context,
      blocked: input.blocked,
      matchIds: input.matches.map((item) => item.id),
      subjects: input.matches.map((item) => ({ subjectType: item.subjectType, listType: item.listType, reasonCode: item.reasonCode })),
    };

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "risk_alerts" (
        "type", "severity", "status", "member_id", "ref_type", "ref_id",
        "title", "description", "metadata", "created_at", "updated_at"
      ) VALUES (
        'WATCHLIST_MATCH'::"RiskAlertType", ${severity}::"RiskAlertSeverity", 'OPEN'::"RiskAlertStatus",
        ${input.memberId ?? null}::uuid, ${input.referenceType ?? null}, ${input.referenceId ?? null},
        ${title}, ${description}, ${JSON.stringify(metadata)}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);
  }
}
