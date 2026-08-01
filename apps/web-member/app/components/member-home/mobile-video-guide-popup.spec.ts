import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const controller = readFileSync(new URL('./usage-guide-controller.tsx', import.meta.url), 'utf8');
const popup = readFileSync(new URL('./mobile-video-guide-popup.tsx', import.meta.url), 'utf8');
const mobileHome = readFileSync(new URL('../mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');

test('guest and authenticated video guide triggers reuse the single global owner', () => {
  assert.match(mobileHome, /data-mobile-member-popup=\{icon === 'video' \? 'video' : undefined\}/);
  assert.match(controller, /VIDEO_TRIGGER_SELECTOR = '\[data-mobile-member-popup="video"\]'/);
  assert.match(controller, /VIDEO_TRIGGER_LABELS = \['วีดีโอแนะนำ', 'วิดีโอแนะนำ'\]/);
  assert.match(controller, /function isVideoGuideTrigger\(target: Element\)/);
  assert.match(controller, /target\.closest<HTMLElement>\('a,button,\[role="button"\]'\)/);
  assert.match(controller, /VIDEO_TRIGGER_LABELS\.some\(\(value\) => label\.includes\(value\)\)/);
  assert.match(controller, /window\.addEventListener\('click', handleVideoClick, true\)/);
  assert.match(controller, /event\.stopImmediatePropagation\(\)/);
  assert.match(controller, /detail\?\.kind !== 'video'/);
  assert.equal((controller.match(/<MobileVideoGuidePopup\b/g) ?? []).length, 1);
});

test('video popup matches the supplied source assets and geometry owner', () => {
  assert.match(popup, /tutorial_640\.webm/);
  assert.match(popup, /guide_2\.webp/);
  assert.match(popup, /resolveLocalAssetOrSource\(GUIDE_VIDEO_SOURCE, 'pc'\)/);
  assert.match(popup, /resolveLocalAssetOrSource\(GUIDE_ART_SOURCE, 'pc'\)/);
  assert.match(popup, /data-ui-owner="mobile-video-guide-popup"/);
  assert.match(popup, /autoPlay loop muted playsInline/);
  assert.doesNotMatch(popup, /\bcontrols\b/);
});
