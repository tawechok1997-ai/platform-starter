import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRESENTATION_CMS_ANNOUNCEMENTS,
  PRESENTATION_CMS_ASSETS,
  PRESENTATION_LEADERBOARD,
  PRESENTATION_PROMOTION_CAMPAIGNS,
  PRESENTATION_TOURNAMENTS,
  mergePresentationCmsContent,
  mergePresentationPromotions,
  presentationDemoEnabled,
} from './member-presentation-defaults';

test('presentation mode is enabled unless explicitly disabled', () => {
  assert.equal(presentationDemoEnabled({}), true);
  assert.equal(presentationDemoEnabled({ presentation_demo_enabled: true }), true);
  assert.equal(presentationDemoEnabled({ presentation_demo_enabled: false }), false);
});

test('presentation records are populated and use masked identities', () => {
  assert.ok(PRESENTATION_TOURNAMENTS.length >= 2);
  assert.ok(PRESENTATION_LEADERBOARD.length >= 5);
  assert.ok(PRESENTATION_PROMOTION_CAMPAIGNS.length >= 3);
  assert.ok(PRESENTATION_CMS_ANNOUNCEMENTS.some((item) => item.kind === 'promotion'));
  assert.ok(PRESENTATION_TOURNAMENTS.flatMap((item) => item.players).every((player) => player.name.includes('***')));
});

test('shared presentation assets cover the common member navigation and homepage surfaces', () => {
  const ids = new Set(PRESENTATION_CMS_ASSETS.map((item) => item.id));
  for (const id of [
    'member.ui.home',
    'member.ui.casino',
    'member.ui.slot',
    'member.ui.fishing',
    'member.ui.sport',
    'member.ui.card',
    'member.ui.lottery',
    'member.ui.tournament',
    'member.ui.leaderboard',
    'member.presentation.tournament',
    'member.presentation.jackpot',
  ]) assert.equal(ids.has(id), true, id);
});

test('configured CMS and promotions override presentation records with the same id', () => {
  const baseContent = {
    assets: [],
    banners: [],
    popup: {
      title: '', message: '', ctaLabel: '', href: '', enabled: false,
      imageUrl: '', desktopImageUrl: '', mobileImageUrl: '',
      assetId: '', desktopAssetId: '', mobileAssetId: '',
    },
    announcements: [{
      id: 'presentation-news-new-games',
      kind: 'news' as const,
      title: 'กำหนดเอง',
      message: 'กำหนดเอง',
      enabled: true,
    }],
    faqs: [],
  };
  const mergedContent = mergePresentationCmsContent(baseContent);
  assert.equal(mergedContent.announcements.find((item) => item.id === 'presentation-news-new-games')?.title, 'กำหนดเอง');

  const mergedPromotions = mergePresentationPromotions([{ ...PRESENTATION_PROMOTION_CAMPAIGNS[0]!, title: 'โปรโมชันกำหนดเอง' }]);
  assert.equal(mergedPromotions.find((item) => item.id === PRESENTATION_PROMOTION_CAMPAIGNS[0]!.id)?.title, 'โปรโมชันกำหนดเอง');
});
