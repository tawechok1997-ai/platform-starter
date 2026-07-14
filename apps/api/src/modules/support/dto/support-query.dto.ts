import { IsIn, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class MemberSupportTicketListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cursor?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export class AdminSupportTicketListQueryDto extends MemberSupportTicketListQueryDto {
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'WAITING_MEMBER', 'CLOSED'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'status'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: string;
}
