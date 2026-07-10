# Market UX and Operation Roadmap

This document tracks product improvements that make the platform easier to use for members, easier to operate for admins, and closer to real market workflows.

## Goals

- Make member flows obvious on mobile: deposit, withdraw, game lobby, play, transfer, history.
- Make admin flows action-first: what needs review, what failed, what is risky, what is offline.
- Keep money operations auditable: every balance change must be explainable through ledger, transfer, webhook, reconciliation, and audit logs.
- Keep provider integration safe: test adapters before real money, gate risky features, and avoid exposing secrets.
- Keep technical copy away from members. Members should see human Thai copy, not raw enum names or provider error codes.

## Product Principles

### Member side

- Mobile first. Most member flows should work comfortably on an iPhone-size viewport.
- One screen should have one primary action. Deposit, withdraw, play, and transfer should not fight each other visually.
- Money states must be easy to understand: available balance, pending amount, locked amount, and failed/rollback state.
- Every failed money action must explain whether money was changed, unchanged, or returned.
- Member copy should use existing Thai terms: ฝาก, ถอนเงิน, ประวัติ, ช่องทาง, หมายเหตุ, บัญชีธนาคาร, ยอดใช้ได้.

### Admin side

- Admin pages should be queue-based and action-based. The first view should show work that needs attention.
- Every sensitive action should require a reason/note and create an audit log.
- Every money item should link to its source: deposit, withdraw, game transfer, wallet ledger, webhook, reconciliation snapshot, and risk alert.
- Provider setup should guide admins step by step instead of exposing raw technical configuration first.
- Risk pages should use readiness states and clear next actions, not just raw JSON.

### Backend and safety

- Ledger is the source of balance movement history.
- Idempotency is mandatory for game transfers, webhook settlement, and ledger mutation.
- Raw provider secrets must never be returned to frontend or written to logs.
- Real-money gates must remain off until adapter, credential, webhook, reconciliation, and QA checks pass.
- Simulator and generic-transfer providers should be used to validate workflows before real provider integration.

## Phase 1: Usability and Operation Basics

### 1. Member Home

**Problem**

The member home should feel like a real mobile member app, not an internal dashboard. Members need to see their balance, pending states, and main actions without hunting through menus.

**Member UX**

- Show clear wallet summary at the top.
  - ยอดใช้ได้
  - รอดำเนินการ
  - ยอดทั้งหมด
- Show quick actions.
  - ฝาก
  - ถอนเงิน
  - เล่นเกม
  - ประวัติ
- Show pending cards only when there is something pending.
  - ฝากรอตรวจสอบ
  - ถอนเงินรอดำเนินการ
  - โยกเงินไม่สำเร็จและคืนยอดแล้ว
- Show recently played games.
- Show featured games and promotion/banner slots.
- Keep bottom navigation sticky on mobile.

**Backend/API needs**

- Member dashboard endpoint should return compact data:
  - wallet summary
  - pending deposit count/latest
  - pending withdraw count/latest
  - latest game transfers
  - recently played games
  - active game session if any
  - banner/promotion slots when CMS exists

**Suggested pages/components**

- `apps/web-member/app/page.tsx` or member dashboard page.
- `apps/web-member/app/wallet-card.tsx`.
- `apps/web-member/app/member-bottom-nav.tsx`.
- New components:
  - `member-dashboard-actions.tsx`
  - `member-pending-card.tsx`
  - `recently-played-games.tsx`
  - `member-promo-banner.tsx`

**Acceptance criteria**

- Member can see available balance within the first screen height.
- Member can reach deposit, withdraw, game lobby, and history with one tap.
- Pending states appear only when relevant.
- No technical enum text is visible to members.

**Risks**

- Showing too many summary cards can make the home page noisy.
- Pending/locked amounts must be correct, otherwise trust in balance is damaged.

---

### 2. Game Lobby

**Problem**

A real market-style game lobby needs discovery: categories, providers, search, favorites, and recently played games. A plain list is not enough.

**Member UX**

- Categories:
  - สล็อต
  - คาสิโน
  - กีฬา
  - ยิงปลา
  - เกมยอดนิยม
  - เกมใหม่
- Search by game name.
- Filter by provider.
- Favorites.
- Recently played.
- Maintenance/disabled state.
- Clear play button.
- Loading skeleton for mobile.

**Backend/API needs**

- Game list endpoint should support:
  - `category`
  - `providerId`
  - `search`
  - `status`
  - `featured`
  - `popular`
  - pagination
- Store or compute:
  - favorite games
  - recently played games
  - provider status
  - maintenance state

**Suggested pages/components**

- `apps/web-member/app/games/page.tsx`
- New components:
  - `game-category-tabs.tsx`
  - `game-provider-filter.tsx`
  - `game-search.tsx`
  - `game-card.tsx`
  - `recent-games-row.tsx`

**Acceptance criteria**

- Member can search and launch a game in under 3 taps from the lobby.
- Disabled games cannot be launched and show a friendly Thai reason.
- Provider filter works on mobile without layout overflow.

**Risks**

- Too many provider/category filters can slow mobile UX.
- Game images from providers may be missing or inconsistent, so fallback icons are needed.

---

### 3. Game Session and Transfer UX

**Problem**

Game transfer is money-sensitive. Members must understand exactly what happened when they transfer in/out, especially if a provider fails and the system rolls back.

**Member UX**

- Show current wallet balance.
- Show provider/game balance when adapter supports it.
- Amount input with quick buttons:
  - 100
  - 300
  - 500
  - 1000
  - ทั้งหมด
- Primary actions:
  - โยกเข้าเกม
  - โยกกลับวอเลต
- Show transfer status:
  - กำลังโยกเงิน
  - โยกเงินเข้าเกมสำเร็จ
  - โยกเงินกลับวอเลตสำเร็จ
  - โยกเงินไม่สำเร็จ ระบบคืนเงินเข้าวอเลตแล้ว
  - โยกเงินไม่สำเร็จ ยอดเงินไม่ถูกเปลี่ยน
- Show transfer history for the session.
- Add return-to-game button.
- Add close-session button when safe.

**Backend/API needs**

- Session detail endpoint should include:
  - session status
  - provider game info
  - current wallet balance
  - transfer history
  - provider session id
  - launch URL if still valid or relaunch action
- Transfer endpoints must return user-safe result copy.
- Rollback response must explicitly say wallet was restored.

**Suggested pages/components**

- `apps/web-member/app/games/demo-launch/page.tsx`
- Later rename from demo-specific page to a generic game session page:
  - `/games/session/[id]`
- New components:
  - `game-transfer-panel.tsx`
  - `game-transfer-status.tsx`
  - `game-transfer-history.tsx`

**Acceptance criteria**

- On provider transfer-in failure after debit, member sees rollback success message.
- On provider transfer-out failure, member sees that wallet was not changed.
- Session transfer history updates after each action.
- Member never sees raw provider error unless mapped to friendly text.

**Risks**

- Retry and refresh can duplicate requests if idempotency is not enforced.
- Provider balance may lag behind wallet balance, so copy must not overpromise real-time accuracy.

---

### 4. Deposit Flow

**Problem**

Deposit should be a guided flow. Members should know how much to transfer, where to transfer, what proof is required, and what status comes next.

**Member UX**

- Step 1: เลือกยอด
  - custom amount
  - quick amount buttons
  - min/max amount copy
- Step 2: เลือกช่องทาง
  - bank account
  - PromptPay/QR when available
- Step 3: โอนเงิน
  - bank name
  - account number
  - account name
  - copy button
  - QR display when available
- Step 4: แนบสลิป
  - image upload
  - preview
  - validation
- Step 5: รอตรวจสอบ
  - submitted amount
  - submitted time
  - expected review copy
  - status badge

**Backend/API needs**

- Deposit method/channel endpoint.
- Deposit create endpoint.
- Slip upload/storage.
- Deposit status endpoint.
- Optional expiration time for deposit instruction.

**Suggested pages/components**

- `apps/web-member/app/deposit/page.tsx`
- New components:
  - `deposit-stepper.tsx`
  - `deposit-amount-picker.tsx`
  - `deposit-channel-card.tsx`
  - `deposit-slip-upload.tsx`
  - `deposit-status-card.tsx`

**Acceptance criteria**

- Member can create deposit request and upload slip without leaving the flow.
- Copy buttons are available only where relevant.
- Pending status appears after submit.
- Failed validation uses Thai copy.

**Risks**

- Slip storage and preview must not expose private files publicly without access controls.
- If deposit expires, member should not accidentally transfer to an invalid instruction.

---

### 5. Withdraw Flow

**Problem**

Withdraw must be simple and confidence-building. It should not show deposit account/copy UI, because that confuses members.

**Member UX**

- Step 1: เลือกบัญชีธนาคาร
- Step 2: ใส่ยอดถอน
  - available balance
  - min/max
  - fee if any
- Step 3: ตรวจสอบข้อมูล
  - bank
  - account number masked
  - account name
  - amount
- Step 4: ยืนยัน
- Step 5: รอดำเนินการ

**Backend/API needs**

- Withdraw create endpoint with validation:
  - active member
  - verified/allowed bank account
  - sufficient balance
  - min/max amount
  - duplicate pending withdraw rules
- Withdraw status endpoint.

**Suggested pages/components**

- `apps/web-member/app/withdraw/page.tsx`
- New components:
  - `withdraw-stepper.tsx`
  - `withdraw-bank-selector.tsx`
  - `withdraw-review-card.tsx`

**Acceptance criteria**

- Withdraw page does not show platform deposit account information.
- Member sees available balance before submitting.
- Member cannot submit if bank account is missing or inactive.
- Member gets clear pending/rejected/approved status.

**Risks**

- Withdraw should lock or reserve funds correctly to avoid over-withdrawal.
- Rejected withdrawals must return funds if funds were reserved.

---

### 6. Unified Transaction History

**Problem**

Members should not need to know whether a transaction is a deposit, transfer, ledger, or adjustment. They need one readable history.

**Member UX**

- One history page with filters:
  - ทั้งหมด
  - ฝาก
  - ถอนเงิน
  - โยกเข้าเกม
  - โยกกลับวอเลต
  - โบนัส
  - ปรับยอด
- Time filters:
  - วันนี้
  - 7 วัน
  - 30 วัน
- Status filters:
  - รอดำเนินการ
  - สำเร็จ
  - ไม่สำเร็จ
- Detail drawer/card for each record.

**Backend/API needs**

- Unified history endpoint that maps internal records to user-safe history items.
- Source links internally, but do not expose sensitive internal IDs unnecessarily.

**Acceptance criteria**

- History items use Thai labels, not enum names.
- Amount direction is clear: เข้า/ออก.
- Failed transfer with rollback is understandable.

---

### 7. Admin Operation Dashboard

**Problem**

Admin home should show what needs action now. A dashboard full of generic numbers is less useful than a queue of problems.

**Admin UX**

Top cards:

- ฝากรอตรวจ
- ถอนเงินรอดำเนินการ
- โยกเงินล้มเหลว
- Risk Alert เปิดอยู่
- Webhook ผิดพลาด
- Provider Offline
- Reconciliation Mismatch

Action queues:

- Latest pending deposits.
- Latest pending withdrawals.
- Failed game transfers.
- High/critical risk alerts.
- Providers that need review.

Operational metrics:

- Deposit amount today.
- Withdraw amount today.
- Transfer-in/out amount today.
- New members today.
- Failed transfer rate.

**Backend/API needs**

- Admin operation summary endpoint.
- Query aggregations for pending/failed/risk/provider status.
- Links to relevant admin pages.

**Suggested page**

- `apps/web-admin/app/(admin)/operations/page.tsx` can become the real dashboard or link to `/dashboard`.

**Acceptance criteria**

- Admin can identify urgent work within 5 seconds.
- Every card links to a filtered queue.
- Empty states are useful and not scary.

**Risks**

- Heavy aggregation queries can slow dashboard. Add limits and indexes where needed.

---

### 8. Deposit and Withdraw Operation Queues

**Problem**

Money operation queues must be fast, safe, and auditable.

**Admin UX**

Deposit queue:

- List pending deposits.
- Show amount, member, channel, created time, slip thumbnail, age.
- Actions: approve, reject, add note.
- Detail: member history, wallet, previous deposits, slip full view.

Withdraw queue:

- List pending withdrawals.
- Show amount, member, bank account, created time, age.
- Actions: approve, reject, add note.
- Detail: member history, wallet, bank verification, previous withdrawals.

**Backend/API needs**

- Filtered list endpoints.
- Approve/reject endpoints with required admin note for rejection.
- Audit log on every approve/reject.
- Optional queue locking/claiming to prevent two admins processing the same item.

**Acceptance criteria**

- Admin can approve/reject without losing list position.
- Rejection requires note.
- Every action creates audit log.
- Balance changes are linked to wallet ledger.

---

## Phase 2: Provider and Money Safety

### 9. Adapter Test Harness

**Problem**

Before connecting real providers, admins/developers need to test each adapter method independently. Without this, debugging becomes guesswork.

**Admin UX**

Page: `/admin/provider-test`

Inputs:

- Provider selector.
- Method selector:
  - healthCheck
  - launchGame
  - getBalance
  - transferIn
  - transferOut
  - syncGames
  - validateWebhook
  - parseWebhook
- Test payload editor.
- Dry-run/test mode warning.

Result panel:

- Status: success/fail.
- Latency.
- Sanitized request.
- Sanitized response.
- Error code.
- Error message.
- Signature status.
- Provider transaction id if available.

**Backend/API needs**

- Admin-only test endpoint:
  - `POST /admin/game-providers/:providerId/test-adapter`
- Request body:
  - method
  - payload
  - headers for webhook tests
- Use existing adapter registry and decrypted credential context.
- Sanitize all raw request/response before returning.
- Audit each test call, especially transfer tests.
- Transfer tests should default to simulator/generic sandbox and require explicit confirmation if provider is real-money enabled.

**Acceptance criteria**

- Admin can test healthCheck without crafting raw requests.
- Admin can test launchGame with a selected test member/game/session.
- Admin can test transferIn/transferOut with simulator safely.
- Secrets never appear in test output.
- Failed adapter result is readable.

**Risks**

- A test harness can accidentally move real money if not gated.
- Payload editor can expose sensitive data if raw output is not sanitized.

---

### 10. Provider Setup Wizard v2

**Problem**

Provider setup currently works, but it should guide admins through a safe workflow and preview what will be created.

**Admin UX**

Step 1: Choose preset.

- Demo Provider.
- Simulator Provider.
- Generic Transfer Wallet.
- Generic Seamless Wallet.
- Real Provider Hardening.

Step 2: Provider profile.

- Provider name.
- Provider code.
- Wallet mode.
- Currency.
- Status.

Step 3: Endpoint setup.

- Base URL.
- Generated endpoint preview.
- Editable endpoint paths.
- Enable/disable optional endpoints.

Step 4: Credentials.

- API_KEY.
- SECRET_KEY.
- MERCHANT_ID.
- AGENT_ID.
- WEBHOOK_SECRET.
- Placeholder warning.

Step 5: Preview.

- Provider record.
- Endpoints to create.
- Credentials to create, masked only.
- Metadata gates.

Step 6: Create and preflight.

- Create provider.
- Redirect to provider readiness/preflight.
- Run optional health check.

**Backend/API needs**

- Existing `POST /admin/provider-presets/apply` can be reused.
- Add validation endpoint:
  - provider code availability
  - preset availability
  - endpoint URL validation
  - required credential validation
- Add preview endpoint if needed:
  - `POST /admin/provider-presets/preview`

**Acceptance criteria**

- Admin can complete provider setup without editing raw DB data.
- Duplicate provider code is blocked before submit.
- Preview shows exactly what will be created.
- Secrets are masked in preview.

---

### 11. Provider Preset Preview/Edit

**Problem**

Preset apply should not blindly create records. Admin should be able to inspect and adjust endpoints before applying.

**Admin UX**

- Preset card has actions:
  - Preview
  - Use preset
- Preview modal/page shows:
  - provider type
  - wallet mode
  - endpoints
  - credentials required
  - default metadata gates
- Admin can edit:
  - base URL
  - endpoint path
  - enabled/disabled endpoint
  - credential value
  - provider code/name

**Backend/API needs**

- Preset list endpoint should include endpoint templates and credential templates.
- Apply endpoint should accept overrides.
- Validate URLs and duplicate code.

**Acceptance criteria**

- Admin can see endpoint URLs before creation.
- Admin can disable optional endpoints.
- Apply creates only selected endpoints.
- Audit log records preset code and overrides summary.

---

### 12. Credential Management Production

**Problem**

Credentials are now encrypted/decrypted for adapters, but production operation needs lifecycle controls.

**Admin UX**

Credential list should show:

- Type.
- Masked value.
- Status.
- Last used at.
- Last rotated at.
- Created by.
- Updated by.

Actions:

- Rotate.
- Disable.
- Test.
- Copy masked identifier only, not secret.

Warnings:

- Placeholder secret.
- Expired/old credential.
- Missing webhook secret.
- Secret not used recently.

**Backend/API needs**

- Credential rotate endpoint.
- Credential disable endpoint.
- Update lastUsedAt when adapter context uses credential.
- Audit create/update/rotate/disable.
- Optional credential version table or metadata versioning.

**Acceptance criteria**

- Raw secret is accepted only on create/rotate.
- Raw secret is never returned.
- Adapter can still decrypt active credential.
- Disabled credential is not used by adapter.

**Risks**

- Rotating wrong credential can break provider connection.
- lastUsedAt updates should not add heavy writes on every request without considering performance.

---

### 13. Wallet Ledger Detail

**Problem**

Wallet ledger list is useful, but investigating money issues requires a detail view with related records.

**Admin UX**

Page: `/admin/wallet-ledgers/[id]`

Show:

- Ledger id.
- Member.
- Type: CREDIT/DEBIT/REVERSAL/ADJUSTMENT.
- Balance before.
- Amount.
- Balance after.
- Reference type.
- Reference id.
- Idempotency key.
- Metadata.
- Related game transfer.
- Related deposit/withdraw.
- Related risk alert.
- Audit timeline.

**Backend/API needs**

- `GET /admin/wallet-ledgers/:id`
- Include related records based on referenceType/referenceId.
- Return sanitized metadata.

**Acceptance criteria**

- Admin can explain why a balance changed from one page.
- Related records link correctly.
- Metadata is readable and formatted.

---

### 14. Game Transfer Retry/Reverse Workflow

**Problem**

Game transfers can fail at different points. Admins need safe recovery tools, not dangerous raw wallet edits.

**Admin UX**

On transfer detail:

- Retry transfer.
- Manual reverse.
- Force mark failed.
- Mark reviewed.
- Add admin note.
- Show debit ledger.
- Show credit ledger.
- Show rollback ledger.
- Show provider transaction id.
- Show idempotency key.

Safety confirmations:

- Require note.
- Show expected balance effect.
- Block action when wallet state is unsafe.
- Require higher permission for real-money provider.

**Backend/API needs**

- Retry endpoint with new idempotency key when safe.
- Manual reverse endpoint.
- Force failed endpoint.
- Review/note endpoint.
- Safety checks:
  - transfer status
  - ledger existence
  - rollback existence
  - provider mode
  - wallet balance
  - duplicate action

**Acceptance criteria**

- Admin cannot reverse the same transfer twice.
- Retry does not reuse unsafe idempotency key.
- Every action creates audit log.
- Related ledger is created for any balance-changing action.

**Risks**

- Poorly gated reverse/retry can create or lose money.
- Manual actions must be rare and heavily logged.

---

### 15. Reconciliation Detail Workflow

**Problem**

A mismatch alert is not enough. Admins need to compare provider balance, system transfer totals, ledger, and session data.

**Admin UX**

Page: `/admin/provider-wallet-snapshots/[id]` or reconciliation detail.

Show:

- Provider.
- Session.
- Provider balance.
- System balance.
- Difference.
- Status: MATCHED/MISMATCH/UNKNOWN.
- Related transfers.
- Related ledgers.
- Related webhook logs.
- Related risk alert.
- Timeline.
- Resolve button with note.

**Backend/API needs**

- Snapshot detail endpoint.
- Resolve endpoint.
- Link created RiskAlert to snapshot.
- Auto-resolve or suggest resolving related RiskAlert when snapshot is resolved.

**Acceptance criteria**

- Admin can identify which transfer caused mismatch.
- Resolve requires note.
- Related RiskAlert status updates or prompts admin.

---

### 16. Risk Alert Workflow

**Problem**

Risk alerts should behave like operational tickets.

**Admin UX**

- List filters:
  - status
  - severity
  - type
  - provider
  - date
- Detail page:
  - alert summary
  - reference data
  - related links
  - metadata
  - notes
  - timeline
- Actions:
  - assign
  - mark reviewing
  - resolve
  - dismiss
  - add note
  - bulk dismiss low-risk alerts only

**Backend/API needs**

- Risk alert note/timeline support.
- Assignee field or metadata.
- Status transition validation.
- Safe bulk action endpoint.

**Acceptance criteria**

- High/critical alerts cannot be bulk dismissed without permission.
- Resolve/dismiss requires note.
- Related records are easy to open.

---

## Phase 3: Webhook and Incident Operations

### 17. Webhook Center Test Mode

**Problem**

Webhook settlement is risky because external data can change money. Before real settlement, the platform needs parse, signature, duplicate, and replay tools.

**Admin UX**

Webhook Center should show:

- Webhook logs.
- Status filters.
- Signature valid/invalid.
- Duplicate events.
- Parsed event preview.
- Raw payload view.
- Settlement readiness.

Test tools:

- Generate mock webhook:
  - BET_SETTLED
  - WIN
  - ROLLBACK
  - duplicate
  - invalid signature
  - delayed webhook
- Parse payload without settlement.
- Validate signature.
- Replay in safe mode.

**Backend/API needs**

- Webhook parse test endpoint.
- Webhook signature test endpoint.
- Webhook replay endpoint with dry-run mode.
- Mock webhook generator endpoint for simulator.
- Settlement must remain gated:
  - webhookSettlementEnabled
  - walletSyncEnabled
  - realMoneyEnabled only when production ready

**Acceptance criteria**

- Admin can inspect why webhook failed.
- Duplicate webhook is recognized.
- Invalid signature never settles money.
- Replay defaults to dry-run.

**Risks**

- Replay can duplicate settlement if not idempotent.
- Raw payload may contain sensitive data and must be displayed carefully.

---

### 18. Monitoring and Alerts

**Problem**

Admins should not discover failures manually hours later.

**Alert conditions**

- Transfer failures exceed threshold.
- Webhook invalid signatures exceed threshold.
- Provider is offline or degraded.
- Reconciliation mismatch is created.
- Withdrawal is pending longer than threshold.
- Deposit is pending longer than threshold.
- Real-money gate is enabled.
- Credential is rotated or disabled.

**Delivery options**

- Admin dashboard banner.
- Risk alert creation.
- Email/Slack/LINE later if integration exists.

**Backend/API needs**

- Scheduled scan or admin-triggered scan.
- Alert deduplication.
- Severity rules.
- Audit log for gate changes.

**Acceptance criteria**

- Same issue does not create unlimited duplicate alerts.
- Critical issues are visible on admin dashboard.

---

### 19. Security and Permissions

**Problem**

Not every admin should have access to every money/provider action.

**Permissions to add**

- `deposit.approve`
- `withdraw.approve`
- `wallet.view`
- `wallet.adjust`
- `game.provider.manage`
- `game.transfer.retry`
- `game.transfer.reverse`
- `risk.resolve`
- `credential.rotate`
- `webhook.replay`
- `real_money.enable`

**Backend/API needs**

- Role/permission model or permission metadata.
- Guards for sensitive endpoints.
- UI hide/disable actions based on permission.
- Audit denied actions optionally.

**Acceptance criteria**

- Admin without permission cannot call sensitive API directly.
- UI does not show dangerous action buttons to unauthorized admins.
- Real-money enable requires explicit high-level permission.

---

### 20. Incident Playbooks

**Problem**

When money/provider incidents happen, operators need a checklist.

**Docs to add**

- Provider outage playbook.
- Wallet mismatch playbook.
- Credential leak playbook.
- Failed deployment rollback playbook.
- Database restore test playbook.
- Webhook duplicate/invalid signature playbook.

**Acceptance criteria**

- Each playbook has symptoms, immediate action, investigation steps, recovery steps, and post-incident checklist.

---

## Phase 4: Market-like Product Features

### 21. Promotion and Bonus

**Member UX**

- Promotion list.
- Claim bonus.
- Bonus status.
- Turnover progress.
- Bonus history.

**Admin UX**

- Create campaign.
- Set eligibility.
- Set bonus amount/rate.
- Set turnover requirement.
- Approve/reject claim.
- View campaign report.

**Backend/API needs**

- Bonus wallet or bonus ledger.
- Promotion campaign model.
- Bonus claim model.
- Turnover tracking.
- Expiry rules.

**Risks**

- Bonus and turnover rules can become complex quickly.
- Bonus wallet must not mix incorrectly with cash wallet.

---

### 22. Affiliate and Agent

**Member/Agent UX**

- Referral link.
- Agent code.
- Downline list.
- Commission summary.
- Settlement history.

**Admin UX**

- Agent management.
- Commission rules.
- Downline view.
- Agent report.
- Settlement approve/reject.

**Backend/API needs**

- Agent model.
- Referral tracking.
- Commission calculation.
- Settlement model.
- Report endpoints.

**Risks**

- Commission calculations need clear rules and auditability.
- Fraud/risk checks are needed for self-referral and duplicate accounts.

---

### 23. CMS and Content

**Member UX**

- Mobile banners.
- Announcements.
- Popup notices.
- Maintenance notices.
- Featured game ordering.

**Admin UX**

- Banner CRUD.
- Announcement CRUD.
- Popup CRUD.
- Maintenance notice CRUD.
- Category ordering.
- Featured games management.

**Backend/API needs**

- CMS content models.
- Image upload/storage.
- Publish/unpublish.
- Start/end time.
- Mobile/desktop targeting.

**Acceptance criteria**

- Admin can publish a banner without code deploy.
- Expired banners disappear automatically.

---

### 24. KYC and Risk

**Member UX**

- Phone verification.
- Bank account verification.
- Account status.

**Admin UX**

- Duplicate bank detection.
- Blacklist user.
- Risk status.
- Verification review.

**Backend/API needs**

- Phone OTP provider later.
- Bank verification workflow.
- Duplicate detection logic.
- Risk flags.
- Blacklist checks on deposit/withdraw/game transfer.

**Risks**

- KYC data is sensitive and needs strong access control.

---

### 25. Customer Support

**Member UX**

- Support ticket.
- LINE/live chat contact.
- FAQ.
- Deposit/withdraw issue templates.

**Admin UX**

- Ticket queue.
- Ticket status.
- Assign support admin.
- Reply/note timeline.
- Link ticket to deposit/withdraw/transfer.

**Backend/API needs**

- Support ticket model.
- Ticket messages.
- Attachment upload.
- Status transitions.
- Optional external chat link config.

**Acceptance criteria**

- Member can open a support case from a failed transaction.
- Admin can see related transaction from the ticket.

---

## Recommended Next Implementation Order

### Batch A: Make operations usable

1. Adapter Test Harness.
2. Admin Operation Dashboard.
3. Member Game Session UX polish.
4. Wallet Ledger Detail page.
5. Admin Sidebar Navigation.

### Batch B: Make provider setup safer

6. Provider Setup Wizard v2.
7. Provider Preset preview/edit before apply.
8. Credential Management production actions.
9. Provider Readiness traffic-light view.

### Batch C: Make money investigation strong

10. Game Transfer retry/reverse workflow.
11. Reconciliation detail workflow.
12. Risk Alert workflow expansion.
13. Idempotency dashboard.

### Batch D: Make webhook operations real

14. Webhook Center test mode.
15. Mock webhook generator.
16. Monitoring and threshold alerts.
17. Incident playbooks.

### Batch E: Market features

18. Promotion/Bonus.
19. Affiliate/Agent.
20. CMS Banner/Popup.
21. KYC/Bank verification.
22. Support Ticket/LINE contact.

## Definition of Done for Each Feature

Every feature in this roadmap should include:

- Mobile-friendly UI where relevant.
- Empty/loading/error states.
- Thai user-facing copy.
- Permission checks for admin-sensitive actions.
- Audit log for sensitive actions.
- Related-record links for money operations.
- Sanitized raw payload display where provider/webhook data is shown.
- Smoke or e2e coverage for critical happy path and failure path.
- Documentation update when behavior affects money, provider setup, credentials, or webhook settlement.

## Notes

- Work that requires real provider documents should stay outside this roadmap until the provider gives API docs, UAT endpoints, credentials, signature rules, webhook format, and IP whitelist requirements.
- Generic transfer wallet and simulator providers should be used to build and validate workflows before real-money integration.
- Real money, webhook settlement, manual reverse, and credential rotation must remain behind permission and audit controls.
- Avoid production database reset commands. Never use destructive Prisma reset commands against production data.
