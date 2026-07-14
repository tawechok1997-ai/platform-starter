import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { mapAdminKycCase, mapKycCase, mapKycDocument, type KycRow } from './kyc.mapper';

@Injectable()
export class KycDocumentsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async memberCase(memberId: string) {
    const rows = await this.prisma.$queryRaw<KycRow[]>(Prisma.sql`
      SELECT * FROM "kyc_cases" WHERE "member_id" = ${memberId}::uuid
      ORDER BY "created_at" DESC LIMIT 1
    `);
    if (!rows[0]) return { item: null, documents: [] };
    return {
      item: mapKycCase(rows[0]),
      documents: await this.caseDocuments(String(rows[0].id), memberId),
    };
  }

  async adminList(status?: string, pageInput?: string, takeInput?: string) {
    const page = Math.max(Number(pageInput ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(takeInput ?? 50) || 50, 1), 100);
    const allowed = ['DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'EXPIRED'];
    if (status && !allowed.includes(status)) throw new BadRequestException('Invalid KYC status');
    const where = status ? Prisma.sql`WHERE c."status"=${status}` : Prisma.empty;
    const [items, counts] = await Promise.all([
      this.prisma.$queryRaw<KycRow[]>(Prisma.sql`
        SELECT c.*, u."username", u."phone", u."email",
          (SELECT COUNT(*)::int FROM "kyc_documents" d WHERE d."case_id"=c."id" AND d."deleted_at" IS NULL) AS "document_count"
        FROM "kyc_cases" c JOIN "users" u ON u."id"=c."member_id"
        ${where} ORDER BY c."created_at" DESC OFFSET ${(page - 1) * take} LIMIT ${take}
      `),
      this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM "kyc_cases" c ${where}
      `),
    ]);
    const total = Number(counts[0]?.count ?? 0);
    return {
      items: items.map(mapAdminKycCase),
      total,
      page,
      take,
      pageCount: Math.max(Math.ceil(total / take), 1),
    };
  }

  async adminGet(caseId: string) {
    const rows = await this.prisma.$queryRaw<KycRow[]>(Prisma.sql`
      SELECT c.*, u."username", u."phone", u."email" FROM "kyc_cases" c
      JOIN "users" u ON u."id"=c."member_id" WHERE c."id"=${caseId}::uuid
    `);
    if (!rows[0]) throw new NotFoundException('KYC case not found');
    return {
      item: mapAdminKycCase(rows[0]),
      documents: await this.caseDocuments(caseId),
    };
  }

  private async caseDocuments(caseId: string, memberId?: string) {
    const memberClause = memberId ? Prisma.sql`AND "member_id"=${memberId}::uuid` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<KycRow[]>(Prisma.sql`
      SELECT * FROM "kyc_documents" WHERE "case_id"=${caseId}::uuid ${memberClause} AND "deleted_at" IS NULL
      ORDER BY "created_at" DESC
    `);
    return rows.map(mapKycDocument);
  }
}
