import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class RiskAlertListQueryDto {
  @IsOptional()
  @IsIn(['ALL', 'OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'])
  status?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @IsUUID()
  memberId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  createdFrom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  createdTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

export class RiskAlertSuggestionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class BulkDismissRiskAlertsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  ids!: string[];
}

export class AssignRiskAlertDto {
  @IsOptional()
  @IsUUID()
  adminUserId?: string | null;
}

export class AddRiskAlertNoteDto {
  @IsString()
  @MaxLength(1000)
  note!: string;
}

export class UpdateRiskAlertStatusDto {
  @IsIn(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'])
  status!: string;
}
