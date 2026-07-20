import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export const batchDepositActions = ['APPROVE_SLIP', 'REJECT', 'CONFIRM_CREDIT'] as const;
export type BatchDepositAction = (typeof batchDepositActions)[number];

export class BatchDepositWorkflowDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  @Type(() => String)
  ids!: string[];

  @IsIn(batchDepositActions)
  action!: BatchDepositAction;

  @IsString()
  @Length(5, 1000)
  reason!: string;

  @IsString()
  @MaxLength(32)
  stepUpCode!: string;
}
