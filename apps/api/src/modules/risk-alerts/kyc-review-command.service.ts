import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { DomainError, InvalidStateTransitionError } from '../../common/domain/domain-error';
import { PrismaKycWatchlistRepositoryAdapter } from '../../common/infrastructure/prisma-risk-promotion-repository-adapters';
import { PrismaService } from '../../database/prisma.service';
import { ReviewKycCaseDto, ReviewKycDocumentDto } from './dto/kyc-document.dto';
import { KycReviewPolicy, type KycStatus } from './domain/kyc-review.policy';
import { mapKycCase, mapKycDocument } from './kyc.mapper';

@Injectable()
export class KycReviewCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async reviewDocument(documentId: string, input: ReviewKycDocumentDto, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const repository = new PrismaKycWatchlistRepositoryAdapter(tx);
      const existing = await repository.findKycDocumentForUpdate(documentId);
      if (!existing || existing.deletedAt) throw new NotFoundException('KYC document not found');
      if (existing.version !== input.version) {
        throw new ConflictException('KYC document changed by another reviewer');
      }

      const updated = await repository.saveKycDocumentReview({
        ...existing,
        status: input.status,
        reviewNote: input.note ?? null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      });
      if (!updated) throw new ConflictException('KYC document changed by another reviewer');

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
      return { item: mapKycDocument(updated.view) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async reviewCase(caseId: string, input: ReviewKycCaseDto, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const repository = new PrismaKycWatchlistRepositoryAdapter(tx);
      const existing = await repository.findKycCaseForUpdate(caseId);
      if (!existing) throw new NotFoundException('KYC case not found');
      if (existing.version !== input.version) {
        throw new ConflictException('KYC case changed by another reviewer');
      }

      const from = existing.status;
      const to = String(input.status) as KycStatus;
      if (!KycReviewPolicy.isReviewable(from)) throw new ConflictException('KYC case is not reviewable');
      try {
        KycReviewPolicy.assertTransition(from, to);
        KycReviewPolicy.assertReviewReason(to, input.note);
      } catch (error: unknown) {
        if (error instanceof InvalidStateTransitionError) throw new ConflictException(error.message);
        if (error instanceof DomainError) throw new BadRequestException(error.message);
        throw error;
      }

      if (input.status === 'APPROVED') {
        const rejectedCount = await repository.countUnacceptedKycDocuments(caseId);
        if (rejectedCount > 0) {
          throw new BadRequestException('All KYC documents must be accepted before approval');
        }
      }

      const reviewedAt = KycReviewPolicy.requiresReviewedAt(to) ? new Date() : null;
      const updated = await repository.saveKycCaseReview({
        ...existing,
        status: input.status,
        reviewNote: input.note ?? null,
        reviewedBy: adminId,
        reviewedAt,
      });
      if (!updated) throw new ConflictException('KYC case changed by another reviewer');

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
      return { item: mapKycCase(updated.view) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
