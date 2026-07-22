import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GAME_CATEGORY_ICON_DEFINITIONS,
  ICON_SETTINGS_DEFAULTS,
  ICON_SETTINGS_FIELDS,
  referenceIconPath,
} from './icon-settings-config';

const expected = [
  ['game_category_home_icon', 'หน้าเเรก.png', 'home.png'],
  ['game_category_casino_icon', 'คาสิโน.png', 'casino.png'],
  ['game_category_slot_icon', 'สล็อต.png', 'slot.png'],
  ['game_category_live_icon', 'ถ่ายทอดสด.png', 'live.png'],
  ['game_category_sport_icon', 'กีฬา.png', 'sport.png'],
  ['game_category_fishing_icon', 'ตกปลา.png', 'fishing.png'],
  ['game_category_lottery_icon', 'หวย.png', 'lottery.png'],
  ['game_category_card_icon', 'ไพ่.png', 'card.png'],
] as const;

test('maps Thai reference category filenames to stable English project filenames', () => {
  for (const [key, sourceFile, outputFile] of expected) {
    const definition = GAME_CATEGORY_ICON_DEFINITIONS.find((item) => item.key === key);
    assert.ok(definition, `${key} definition must exist`);
    assert.equal(definition.sourceFile, sourceFile);
    assert.equal(definition.outputFile, outputFile);
    assert.equal(ICON_SETTINGS_DEFAULTS[key], referenceIconPath(outputFile));
  }
});

test('every game category settings key uses a project-local image path', () => {
  assert.equal(GAME_CATEGORY_ICON_DEFINITIONS.length, 12);
  for (const definition of GAME_CATEGORY_ICON_DEFINITIONS) {
    assert.match(definition.key, /^game_category_[a-z]+_icon$/);
    assert.match(ICON_SETTINGS_DEFAULTS[definition.key], /^\/assets\/reference-brand\/menu\/[a-z-]+\.png$/);
  }
});

test('keeps the existing bank, profile, vip, and wallet icon fields', () => {
  const keys = new Set(ICON_SETTINGS_FIELDS.map((field) => field.key));
  for (const key of ['bank', 'profile', 'vip', 'wallet']) assert.ok(keys.has(key), `${key} field must remain`);
  assert.equal(ICON_SETTINGS_DEFAULTS.bank, '◈');
  assert.equal(ICON_SETTINGS_DEFAULTS.profile, '👤');
  assert.equal(ICON_SETTINGS_DEFAULTS.vip, '♛');
  assert.equal(ICON_SETTINGS_DEFAULTS.wallet, '฿');
});
