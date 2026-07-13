import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';

const SUPPORT_CATEGORIES = ['general', 'finance', 'account', 'game', 'technical'] as const;
const SUPPORT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
] as const;

export class CreateSupportTicketDto {
  @IsOptional()
  @IsIn(SUPPORT_CATEGORIES)
  category?: (typeof SUPPORT_CATEGORIES)[number];

  @IsString()
  @Length(3, 180)
  subject!: string;

  @IsString()
  @Length(1, 5000)
  message!: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  refType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  refId?: string;
}

export class SupportReplyDto {
  @IsString()
  @Length(1, 5000)
  message!: string;
}

export class RegisterSupportAttachmentDto {
  @IsString()
  @Length(1, 255)
  originalName!: string;

  @IsIn(SUPPORT_MIME_TYPES)
  mimeType!: (typeof SUPPORT_MIME_TYPES)[number];

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  sizeBytes!: number;

  @IsString()
  @Length(8, 512)
  @Matches(/^support\/[a-zA-Z0-9/_-]+$/)
  storageKey!: string;

  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/)
  checksumSha256!: string;
}

export class AdminUpdateSupportTicketDto {
  @IsOptional()
  @IsIn(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'])
  status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  note?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
