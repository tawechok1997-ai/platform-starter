import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) => value === '' ? undefined : value;

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
