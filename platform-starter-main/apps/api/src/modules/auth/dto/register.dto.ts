import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @Transform(emptyToUndefined)
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @Transform(emptyToUndefined)
  @Transform(trim)
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  secret?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  bankName!: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\d{6,20}$/, { message: 'bankAccountNumber must contain 6 to 20 digits' })
  bankAccountNumber!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  bankAccountName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  referralCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  captchaToken?: string;
}
