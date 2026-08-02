import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const workspace = readFileSync(new URL('../page.tsx', import.meta.url), 'utf8');

test('activity settings cover every runtime activity owner', () => {
  assert.match(page, /group="features"/);
  assert.match(page, /permissionBase="settings\.features"/);
  assert.match(page, /activity_system_enabled/);
  assert.match(page, /daily_login_rewards_json/);
  assert.match(page, /mission_definitions_json/);
  assert.match(page, /turnover_reward_tiers_json/);
  assert.match(page, /lottery_prediction_rounds_json/);
  assert.match(page, /risk="sensitive"/);
});

test('settings workspace exposes the activity configuration page', () => {
  assert.match(workspace, /item\('activities', 'operations', '\/settings\/activities'/);
  assert.match(workspace, /กิจกรรม ภารกิจ และรางวัล/);
});
