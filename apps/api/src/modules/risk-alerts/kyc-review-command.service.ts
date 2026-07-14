import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { ReviewKycCaseDto, ReviewKycDocumentDto } from './dto/kyc-document.dto';
import { mapKycCase, mapKycDocument, type KycRow } from './kyc.mapper';

@Injectable()
export class KycReviewCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async reviewDocument(documentId: string, input: ReviewKycDocumentDto, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<KycRow[]>(Prisma.sql`
        SELECT * FROM "kyc_documents" WHERE "id"=${documentId}::uuid FOR UPDATE
      `);
      const existing = rows[0];
      if (!existing || existing.deleted_at) throw new NotFoundException('KYC document not found');
      if (Number(existing.version) !== input.version) {
        throw new ConflictException('KYC document changed by another reviewer');
      }

      const updated = await tx.$queryRaw<KycRow[]>(Prisma.sql`
        UPDATE "kyc_documents" SET "status"=${input.status}, "review_note"=${input.note ?? null},
          "reviewed_by_admin_id"=${adminId}::uuid, "reviewed_at"=CURRENT_TIMESTAMP,
          "version"="version"+1, "updated_at"=CURRENT_TIMESTAMP
        WHERE "id"=${documentId}::uuid AND "version"=${input.version}
        RETURNING *
      `);
      if (!updated[0]) throw new ConflictException('KYC document changed by another reviewer');

      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: adminId,
          module: 'kyc',
          action: 'REVIEW_KYC_DOCUMENT',
          targetId: documentId,
          oldData: { status: existing.status, version: existing.version },
          newData: { status: input.status, note: input.note ?? null, version: input.version + 1 },
        }),
      });
      return { item: mapKycDocument(updated[0]) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async reviewCase(caseId: string, input: ReviewKycCaseDto, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<KycRow[]>(Prisma.sql`
        SELECT * FROM "kyc_cases" WHERE "id"=${caseId}::uuid FOR UPDATE
      `);
      const existing = rows[0];
      if (!existing) throw new NotFoundException('KYC case not found');
      if (Number(existing.version) !== input.version) {
        throw new ConflictException('KYC case changed by another reviewer');
      }
      if (!['SUBMITTED', 'REVIEWING'].includes(String(existing.status))) {
        throw new ConflictException('KYC case is not reviewable');
      }

      if (input.status === 'APPROVED') {
        const rejected = await tx.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count FROM "kyc_documents"
          WHERE "case_id"=${caseId}::uuid AND "deleted_at" IS NULL AND "status" <> 'ACCEPTED'
        `);
        if (Number(rejected[0]?.count ?? 0) > 0) {
          throw new BadRequestException('All KYC documents must be accepted before approval');
        }
      }

      const reviewedAt = ['APPROVED', 'REJECTED'].includes(input.status) ? new Date() : null;
      const updated = await tx.$queryRaw<KycRow[]>(Prisma.sql`
        UPDATE "kyc_cases" SET "status"=${input.status}, "review_note"=${input.note ?? null},
          "reviewed_by_admin_id"=${adminId}::uuid, "reviewed_at"=${reviewedAt},
          "version"="version"+1, "updated_at"=CURRENT_TIMESTAMP
        WHERE "id"=${caseId}::uuid AND "version"=${input.version} RETURNING *
      `);
      if (!updated[0]) throw new ConflictException('KYC case changed by another reviewer');

      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: adminId,
          module: 'kyc',
          action: 'REVIEW_KYC_CASE',
          targetId: caseId,
          oldData: { status: existing.status, version: existing.version },
          newData: { status: input.status, note: input.note ?? null, version: input.version + 1 },
        }),
      });
      return { item: mapKycCase(updated[0]) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
