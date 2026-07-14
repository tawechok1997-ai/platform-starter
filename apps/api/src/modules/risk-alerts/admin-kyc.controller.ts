import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdminActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { KycAccessTokenDto, ReviewKycCaseDto, ReviewKycDocumentDto } from './dto/kyc-document.dto';
import { KycDocumentsQueryService } from './kyc-documents-query.service';
import { KycDocumentsService } from './kyc-documents.service';
import { KycReviewCommandService } from './kyc-review-command.service';

@Controller('admin/kyc')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminKycController {
  constructor(
    private readonly kyc: KycDocumentsService,
    private readonly queries: KycDocumentsQueryService,
    private readonly reviews: KycReviewCommandService,
  ) {}

  @RequirePermission('risk.view')
  @Get('cases')
  list(@Query('status') status?: string, @Query('page') page?: string, @Query('take') take?: string) {
    return this.queries.adminList(status, page, take);
  }

  @RequirePermission('risk.view')
  @Get('cases/:id')
  get(@Param('id') id: string) {
    return this.queries.adminGet(id);
  }

  @RequirePermission('risk.resolve')
  @Patch('documents/:id/review')
  reviewDocument(@Param('id') id: string, @Body() body: ReviewKycDocumentDto, @CurrentUser() admin: AuthenticatedAdminActor) {
    return this.reviews.reviewDocument(id, body, admin.id);
  }

  @RequirePermission('risk.resolve')
  @Patch('cases/:id/review')
  reviewCase(@Param('id') id: string, @Body() body: ReviewKycCaseDto, @CurrentUser() admin: AuthenticatedAdminActor) {
    return this.reviews.reviewCase(id, body, admin.id);
  }

  @RequirePermission('risk.view')
  @Post('documents/:id/access-token')
  accessToken(@Param('id') id: string, @CurrentUser() admin: AuthenticatedAdminActor) {
    return this.kyc.issueAccessToken(id, admin.id);
  }

  @RequirePermission('risk.view')
  @Post('documents/download')
  download(@Body() body: KycAccessTokenDto, @CurrentUser() admin: AuthenticatedAdminActor) {
    return this.kyc.downloadWithToken(body.token, admin.id);
  }

  @RequirePermission('risk.resolve')
  @Post('cleanup-expired')
  cleanup(@Query('limit') limit?: string) {
    return this.kyc.cleanupExpired(Number(limit ?? 100));
  }
}
