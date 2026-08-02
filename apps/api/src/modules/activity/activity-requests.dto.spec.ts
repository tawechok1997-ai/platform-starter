import { BadRequestException } from '@nestjs/common';
import { parseActivityMetricBatch } from './activity-requests.dto';

const validMetric = {
  memberId: 'member-1',
  metricCode: 'turnover',
  category: 'slot',
  value: 100,
  sourceType: 'game-round',
  sourceId: 'round-1',
  idempotencyKey: 'metric-1',
};

describe('activity request validation', () => {
  it('accepts a valid single metric and normalizes it into a batch', () => {
    const result = parseActivityMetricBatch(validMetric);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(validMetric);
  });

  it('rejects unknown fields and invalid metric values', () => {
    expect(() => parseActivityMetricBatch({
      ...validMetric,
      value: 0,
      unexpected: true,
    } as never)).toThrow(BadRequestException);
  });

  it('rejects batches larger than the endpoint limit', () => {
    const oversized = Array.from({ length: 501 }, (_, index) => ({
      ...validMetric,
      idempotencyKey: `metric-${index}`,
    }));

    expect(() => parseActivityMetricBatch(oversized)).toThrow(BadRequestException);
  });
});
