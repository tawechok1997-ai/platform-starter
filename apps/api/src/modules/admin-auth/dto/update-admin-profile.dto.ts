import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  avatarUrl?: string;
}
