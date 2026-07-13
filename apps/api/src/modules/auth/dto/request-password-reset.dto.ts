import { IsOptional, IsString, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
