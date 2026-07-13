import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const DOCUMENT_TYPES = ['NATIONAL_ID_FRONT','NATIONAL_ID_BACK','PASSPORT','SELFIE','ADDRESS_PROOF','BANK_PROOF','OTHER'] as const;
const REVIEW_STATUSES = ['ACCEPTED','REJECTED'] as const;
const CASE_REVIEW_STATUSES = ['REVIEWING','APPROVED','REJECTED'] as const;

export class UploadKycDocumentDto {
  @IsIn(DOCUMENT_TYPES)
  documentType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @MinLength(1)
  dataUrl!: string;
}

export class ReviewKycDocumentDto {
  @IsIn(REVIEW_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  version!: number;
}

export class ReviewKycCaseDto {
  @IsIn(CASE_REVIEW_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  version!: number;
}

export class KycAccessTokenDto {
  @IsString()
  @MinLength(20)
  @MaxLength(1024)
  token!: string;
}
