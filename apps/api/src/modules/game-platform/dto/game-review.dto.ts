import { BadRequestException } from '@nestjs/common';

export type ReviewDto = { note?: unknown; reason?: unknown; status?: unknown };

export function normalizeReviewNote(body: ReviewDto) {
  return normalizeRequiredText(body, 'note', 1);
}

export function normalizeActionReason(body: ReviewDto) {
  return normalizeRequiredText(body, 'reason', 8);
}

export function normalizeSnapshotReview(body: ReviewDto) {
  const note = normalizeReviewNote(body);
  const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : 'REVIEWED';
  if (!['REVIEWED', 'RESOLVED', 'IGNORED'].includes(status)) throw new BadRequestException('status is invalid');
  return { note, status };
}

function normalizeRequiredText(body: ReviewDto, field: 'note' | 'reason', minimumLength: number) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Review payload must be an object');
  const raw = body[field];
  if (raw === undefined || raw === null || raw === '') throw new BadRequestException(`${field} is required`);
  if (typeof raw !== 'string') throw new BadRequestException(`${field} must be a string`);
  const value = raw.trim();
  if (value.length < minimumLength) throw new BadRequestException(`${field} must be at least ${minimumLength} characters`);
  if (value.length > 1000) throw new BadRequestException(`${field} is too long`);
  return value;
}
