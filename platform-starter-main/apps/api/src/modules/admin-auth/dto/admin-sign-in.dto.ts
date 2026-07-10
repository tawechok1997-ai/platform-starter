import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminSignInDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(6)
  secret!: string;

  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  captchaToken?: string;
}
