import { ArrayMaxSize, IsArray, IsIn, IsNumberString, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class RiskAlertListQueryDto {
  @IsOptional()
  @IsIn(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'])
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
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  take?: string;
}

export class RiskAlertSuggestionQueryDto {
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export class BulkDismissRiskAlertsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @IsString()
  @Length(5, 1000)
  reason!: string;
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
