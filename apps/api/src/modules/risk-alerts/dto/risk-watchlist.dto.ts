import { IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

const WATCHLIST_SUBJECT_TYPES = ['MEMBER', 'PHONE', 'EMAIL', 'BANK_ACCOUNT', 'DEVICE', 'IP'] as const;
const WATCHLIST_TYPES = ['WATCHLIST', 'BLACKLIST'] as const;
const WATCHLIST_REASONS = [
  'FRAUD_CONFIRMED', 'FRAUD_SUSPECTED', 'CHARGEBACK', 'IDENTITY_MISMATCH',
  'DUPLICATE_IDENTITY', 'MONEY_LAUNDERING_RISK', 'ABUSE', 'SECURITY_COMPROMISE',
  'REGULATORY_REQUEST', 'MANUAL_REVIEW', 'OTHER',
] as const;
const WATCHLIST_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export class CreateRiskWatchlistEntryDto {
  @IsIn(WATCHLIST_SUBJECT_TYPES)
  subjectType!: typeof WATCHLIST_SUBJECT_TYPES[number];

  @IsString()
  @Length(1, 255)
  subjectValue!: string;

  @IsIn(WATCHLIST_TYPES)
  listType!: typeof WATCHLIST_TYPES[number];

  @IsIn(WATCHLIST_REASONS)
  reasonCode!: typeof WATCHLIST_REASONS[number];

  @IsOptional()
  @IsIn(WATCHLIST_SEVERITIES)
  severity?: typeof WATCHLIST_SEVERITIES[number];

  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  note?: string;

  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class ReleaseRiskWatchlistEntryDto {
  @IsString()
  @Length(3, 1000)
  reason!: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  version!: number;
}

export class MatchRiskWatchlistDto {
  @IsIn(WATCHLIST_SUBJECT_TYPES)
  subjectType!: typeof WATCHLIST_SUBJECT_TYPES[number];

  @IsString()
  @Length(1, 255)
  subjectValue!: string;
}
