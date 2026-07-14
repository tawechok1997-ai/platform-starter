import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminTwoFactorCodeDto {
  @IsString()
  @MaxLength(32)
  code!: string;
}

export class AdminRefreshSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  refreshToken?: string;
}
