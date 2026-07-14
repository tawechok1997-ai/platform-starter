import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAdminMemberStatusDto {
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsIn(['ACTIVE', 'SUSPENDED', 'LOCKED'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}
