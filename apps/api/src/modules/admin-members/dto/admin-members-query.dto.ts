import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminMembersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  page?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  take?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  from?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  bankStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  kycStatus?: string;
}
