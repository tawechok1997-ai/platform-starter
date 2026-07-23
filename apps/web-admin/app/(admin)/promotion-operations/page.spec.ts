import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('promotion operations uses lifecycle-aware Member visibility', () => {
  assert.equal(source.includes("campaign.lifecycle === 'published' || campaign.enabled === true"), true);
  assert.equal(source.includes("lifecycle === 'published' && campaign.enabled !== false"), true);
  assert.equal(source.includes('Member เห็น'), true);
});

test('promotion operations exposes readiness checklist', () => {
  assert.equal(source.includes('getCampaignReadiness'), true);
  assert.equal(source.includes("label: 'ชื่อและรายละเอียด'"), true);
  assert.equal(source.includes("label: 'เทิร์นมากกว่า 0'"), true);
  assert.equal(source.includes("label: 'สื่อพร้อม'"), true);
  assert.equal(source.includes("label: 'ช่วงเวลาถูกต้อง'"), true);
});

test('promotion claims are prioritized before rendering', () => {
  assert.equal(source.includes('claimPriority'), true);
  assert.equal(source.includes('PENDING_REVIEW'), true);
  assert.equal(source.includes('prioritizedClaims.map'), true);
});
