import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./demo-slot.module.css', import.meta.url), 'utf8');
const launcher = readFileSync(new URL('../../components/game/member-provider-game-launch.ts', import.meta.url), 'utf8');

test('demo launch is a wallet-backed slot rather than the old transfer screen', () => {
  assert.match(page, /data-member-wallet-slot="true"/);
  assert.match(page, /Demo Fortune Slot/);
  assert.match(page, /BET, WIN, idempotency/);
  assert.match(page, /\/member\/provider-simulator\/sessions\/\$\{encodeURIComponent\(session\)\}\/spin/);
  assert.match(page, /JSON\.stringify\(\{ spinId, amount: numericAmount \}\)/);
  assert.match(page, /setWallet\(\(current\) => \(\{ \.\.\.current, balance: nextBalance/);
  assert.doesNotMatch(page, /transfer-in|transfer-out|โยกเงินเข้าออกเกม/);
});

test('slot launch requires a provider-created member session', () => {
  assert.match(page, /const session = params\.get\('session'\)/);
  assert.match(page, /if \(!session\)/);
  assert.match(page, /เปิดจากเกม Demo ที่สร้าง GameSession แล้ว/);
  assert.match(page, /encodeURIComponent\(session\)/);
});

test('shared Mobile and Desktop launcher always selects the simulator endpoint for the demo slot', () => {
  assert.match(launcher, /const DEMO_SLOT_GAME_CODE = 'demo-slot-001';/);
  assert.match(launcher, /if \(isDemoSlotCandidate\(normalized\)\)/);
  assert.match(launcher, /requestLaunch\(DEMO_SLOT_GAME_CODE, options\.signal, options\.locale\)/);
  assert.match(launcher, /`\/member\/provider-simulator\/games\/\$\{DEMO_SLOT_GAME_CODE\}\/launch`/);
  assert.match(launcher, /candidate\.providerCode === 'simulator-provider' && candidate\.category === 'slot'/);
});

test('slot spin uses a client idempotency UUID and exposes round evidence', () => {
  assert.match(page, /crypto\.randomUUID/);
  assert.match(page, /spinId/);
  assert.match(page, /roundId/);
  assert.match(page, /replayed/);
  assert.match(page, /item\.roundId/);
});

test('one slot page adapts to desktop and mobile viewports', () => {
  assert.match(styles, /grid-template-columns:\s*minmax\(0, 1\.55fr\) minmax\(290px, 0\.75fr\)/);
  assert.match(styles, /@media \(max-width: 820px\)/);
  assert.match(styles, /min-height:\s*100dvh/);
  assert.match(styles, /@media \(max-width: 420px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
