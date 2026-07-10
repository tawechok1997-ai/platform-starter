import { IsOptional, IsString, MinLength } from 'class-validator';

export class MemberSignInDto {
  @IsString()
  identifier!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  secret?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
