import { Type } from 'class-transformer';
import { IsDefined, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class MoneyOpsLedgerQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

export class LedgerMutationDto {
  @IsUUID()
  userId!: string;

  @IsDefined()
  amount!: unknown;

  @IsIn(['CREDIT', 'DEBIT'])
  direction!: 'CREDIT' | 'DEBIT';

  @IsString()
  @MaxLength(100)
  referenceType!: string;

  @IsString()
  @MaxLength(255)
  referenceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;
}

export class WriteMoneyOpsAuditDto {
  @IsString()
  @MaxLength(120)
  action!: string;

  @IsString()
  @MaxLength(120)
  module!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetId?: string;

  @IsOptional()
  oldData?: unknown;

  @IsOptional()
  newData?: unknown;
}

export class ResolveMoneyOpsRiskAlertDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
