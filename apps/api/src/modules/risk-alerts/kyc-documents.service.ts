import { Injectable } from '@nestjs/common';
import { ReviewKycCaseDto, ReviewKycDocumentDto, UploadKycDocumentDto } from './dto/kyc-document.dto';
import { KycAccessService } from './kyc-access.service';
import { KycDocumentsQueryService } from './kyc-documents-query.service';
import { KycMemberCommandService } from './kyc-member-command.service';
import { KycRetentionService } from './kyc-retention.service';
import { KycReviewCommandService } from './kyc-review-command.service';

@Injectable()
export class KycDocumentsService {
  constructor(
    private readonly queries: KycDocumentsQueryService,
    private readonly memberCommands: KycMemberCommandService,
    private readonly reviews: KycReviewCommandService,
    private readonly access: KycAccessService,
    private readonly retention: KycRetentionService,
  ) {}

  memberCase(memberId: string) { return this.queries.memberCase(memberId); }
  adminList(status?: string, page?: string, take?: string) { return this.queries.adminList(status, page, take); }
  adminGet(caseId: string) { return this.queries.adminGet(caseId); }
  upload(memberId: string, input: UploadKycDocumentDto) { return this.memberCommands.upload(memberId, input); }
  submit(memberId: string) { return this.memberCommands.submit(memberId); }
  reviewDocument(documentId: string, input: ReviewKycDocumentDto, adminId: string) { return this.reviews.reviewDocument(documentId, input, adminId); }
  reviewCase(caseId: string, input: ReviewKycCaseDto, adminId: string) { return this.reviews.reviewCase(caseId, input, adminId); }
  issueAccessToken(documentId: string, adminId: string) { return this.access.issueAccessToken(documentId, adminId); }
  downloadWithToken(token: string, adminId: string) { return this.access.downloadWithToken(token, adminId); }
  cleanupExpired(limit = 100) { return this.retention.cleanupExpired(limit); }
}
