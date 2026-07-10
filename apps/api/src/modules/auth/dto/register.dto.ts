import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  phone?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  email?: string;

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

  @IsOptional()
  @IsString()
  referralCode?: string;
}
