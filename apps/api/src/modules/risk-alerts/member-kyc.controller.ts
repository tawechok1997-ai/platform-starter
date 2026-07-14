import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { UploadKycDocumentDto } from './dto/kyc-document.dto';
import { KycDocumentsQueryService } from './kyc-documents-query.service';
import { KycDocumentsService } from './kyc-documents.service';

@Controller('member/kyc')
@UseGuards(MemberAuthGuard)
export class MemberKycController {
  constructor(
    private readonly kyc: KycDocumentsService,
    private readonly queries: KycDocumentsQueryService,
  ) {}

  @Get()
  getCase(@CurrentUser() user: MemberActor) {
    return this.queries.memberCase(user.id);
  }

  @Post('documents')
  upload(@CurrentUser() user: MemberActor, @Body() body: UploadKycDocumentDto) {
    return this.kyc.upload(user.id, body);
  }

  @Post('submit')
  submit(@CurrentUser() user: MemberActor) {
    return this.kyc.submit(user.id);
  }
}
