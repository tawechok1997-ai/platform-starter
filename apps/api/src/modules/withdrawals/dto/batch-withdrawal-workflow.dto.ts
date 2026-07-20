import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export const batchWithdrawalActions = ['APPROVE', 'REJECT', 'VERIFY_PAYMENT'] as const;
export type BatchWithdrawalAction = (typeof batchWithdrawalActions)[number];

export class BatchWithdrawalWorkflowDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @IsUUID('4', { each: true }) @Type(() => String)
  ids!: string[];
  @IsIn(batchWithdrawalActions)
  action!: BatchWithdrawalAction;
  @IsString() @Length(5, 1000)
  reason!: string;
  @IsString() @MaxLength(32)
  stepUpCode!: string;
}
