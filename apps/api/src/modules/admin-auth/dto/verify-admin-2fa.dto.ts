import { IsString } from 'class-validator';

export class VerifyAdminTwoFactorDto {
  @IsString()
  challengeId!: string;

  @IsString()
  code!: string;
}
