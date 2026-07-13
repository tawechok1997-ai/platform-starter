import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { UploadKycDocumentDto } from './dto/kyc-document.dto';
import { KycDocumentsService } from './kyc-documents.service';

@Controller('member/kyc')
@UseGuards(MemberAuthGuard)
export class MemberKycController {
  constructor(private readonly kyc: KycDocumentsService) {}

  @Get()
  getCase(@CurrentUser() user: any) {
    return this.kyc.memberCase(user.id ?? user.sub);
  }

  @Post('documents')
  upload(@CurrentUser() user: any, @Body() body: UploadKycDocumentDto) {
    return this.kyc.upload(user.id ?? user.sub, body);
  }

  @Post('submit')
  submit(@CurrentUser() user: any) {
    return this.kyc.submit(user.id ?? user.sub);
  }
}