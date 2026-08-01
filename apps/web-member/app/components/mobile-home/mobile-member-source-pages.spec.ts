import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const historyRoute = readFileSync(new URL('../../mobile/member/history/page.tsx', import.meta.url), 'utf8');
const historyPage = readFileSync(new URL('./mobile-member-history-page.tsx', import.meta.url), 'utf8');
const notificationRoute = readFileSync(new URL('../../mobile/member/notifications/page.tsx', import.meta.url), 'utf8');
const notificationPage = readFileSync(new URL('./mobile-member-notifications-page.tsx', import.meta.url), 'utf8');
const guideController = readFileSync(new URL('../member-home/usage-guide-controller.tsx', import.meta.url), 'utf8');
const authenticatedPopupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');

test('mobile history has a dedicated source route and real ledger owner', () => {
  assert.match(historyRoute, /MobileMemberHistoryPage/);
  assert.match(historyRoute, /memberApiFetch\('\/member\/wallet\/ledger\?limit=100'/);
  assert.match(historyRoute, /auth=login&next=\/mobile\/member\/history/);
  assert.match(historyPage, /ประวัติการทำรายการ/);
  assert.match(historyPage, /ฝากเงิน/);
  assert.match(historyPage, /ถอนเงิน/);
  assert.match(historyPage, /โบนัสโปรโมชั่น/);
  assert.match(historyPage, /ค่าแนะนำเพื่อน/);
  assert.match(historyPage, /ค่าคอมมิชชั่น/);
  assert.match(historyPage, /MobileMemberEmptyState/);
});

test('mobile notifications has a dedicated source route and real notification owner', () => {
  assert.match(notificationRoute, /MobileMemberNotificationsPage/);
  assert.match(notificationRoute, /memberApiFetch\('\/member\/notifications\?limit=100'/);
  assert.match(notificationRoute, /auth=login&next=\/mobile\/member\/notifications/);
  assert.match(notificationPage, /การแจ้งเตือน/);
  assert.match(notificationPage, /ทั้งหมด/);
  assert.match(notificationPage, /สิทธิพิเศษ/);
  assert.match(notificationPage, /ข้อความ/);
  assert.match(notificationPage, /ไม่มีข้อความใหม่/);
  assert.match(notificationPage, /MobileMemberEmptyState/);
});

test('member video trigger reuses the same guest popup owner', () => {
  assert.match(guideController, /VIDEO_TRIGGER_LABELS = \['วีดีโอแนะนำ', 'วิดีโอแนะนำ'\]/);
  assert.match(guideController, /isVideoGuideTrigger/);
  assert.match(guideController, /window\.addEventListener\('click', handleVideoClick, true\)/);
  assert.match(guideController, /<MobileVideoGuidePopup open=\{videoOpen\}/);
  assert.match(authenticatedPopupRuntime, /if \(text\.includes\('วีดีโอแนะนำ'\) \|\| text\.includes\('วิดีโอแนะนำ'\)\) return 'video'/);
  assert.equal((guideController.match(/<MobileVideoGuidePopup\b/g) ?? []).length, 1);
});
