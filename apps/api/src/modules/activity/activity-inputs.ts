export type ActivityMetricInput = {
  memberId: string;
  metricCode: string;
  category?: string;
  value: number;
  sourceType: string;
  sourceId?: string;
  idempotencyKey: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
};

export type ActivityMetricBatchInput = ActivityMetricInput | ActivityMetricInput[];

export type ActivityLotteryNumbersInput = {
  topNumber?: unknown;
  bottomNumber?: unknown;
};
