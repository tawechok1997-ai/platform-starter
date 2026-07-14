import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { UploadKycDocumentDto } from './dto/kyc-document.dto';
import { KycDocumentsQueryService } from './kyc-documents-query.service';
import { KycMemberCommandService } from './kyc-member-command.service';

@Controller('member/kyc')
@UseGuards(MemberAuthGuard)
export class MemberKycController {
  constructor(
    private readonly queries: KycDocumentsQueryService,
    private readonly commands: KycMemberCommandService,
  ) {}

  @Get()
  getCase(@CurrentUser() user: MemberActor) {
    return this.queries.memberCase(user.id);
  }

  @Post('documents')
  upload(@CurrentUser() user: MemberActor, @Body() body: UploadKycDocumentDto) {
    return this.commands.upload(user.id, body);
  }

  @Post('submit')
  submit(@CurrentUser() user: MemberActor) {
    return this.commands.submit(user.id);
  }
}
