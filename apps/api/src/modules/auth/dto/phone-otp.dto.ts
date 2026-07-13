import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RequestPhoneOtpDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  deviceId?: string;
}

export class VerifyPhoneOtpDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  deviceId?: string;
}
