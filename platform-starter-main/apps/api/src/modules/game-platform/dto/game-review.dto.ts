import { BadRequestException } from '@nestjs/common';

export type ReviewDto = { note?: unknown; status?: unknown };

export function normalizeReviewNote(body: ReviewDto) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Review payload must be an object');
  if (body.note === undefined || body.note === null || body.note === '') throw new BadRequestException('note is required');
  if (typeof body.note !== 'string') throw new BadRequestException('note must be a string');
  const note = body.note.trim();
  if (!note) throw new BadRequestException('note is required');
  if (note.length > 1000) throw new BadRequestException('note is too long');
  return note;
}

export function normalizeSnapshotReview(body: ReviewDto) {
  const note = normalizeReviewNote(body);
  const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : 'REVIEWED';
  if (!['REVIEWED', 'RESOLVED', 'IGNORED'].includes(status)) throw new BadRequestException('status is invalid');
  return { note, status };
}
