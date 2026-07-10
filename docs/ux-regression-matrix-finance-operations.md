# UX regression matrix: finance, operations and public auth

## Viewports

- 360x800
- 390x844
- 430x932
- 768x1024
- 1024x768
- 1440x900

## Current implementation status

- ✅ Deposit full responsive refactor implemented
- ✅ Withdraw full responsive refactor implemented
- ✅ Deposit and withdraw builds confirmed
- ✅ Admin top-up queue responsive refactor implemented and build confirmed
- ✅ Admin withdrawal queue responsive refactor implemented and build confirmed
- ✅ Admin members responsive refactor implemented
- ✅ Admin wallet-ledger responsive refactor implemented
- ✅ Login field-level validation and error association implemented
- ✅ Register field-level validation, backend-aligned password hints and error association implemented
- ✅ Shared public maintenance, session-expired and legal pages implemented
- ✅ Admin confirmation dialog focus trap, Escape close, focus return and scroll lock implemented
- ✅ Member finance confirmation dialog focus trap, Escape close, focus return and scroll lock implemented
- 🧪 Full six-viewport visual regression pending
- 🧪 Deployed route and assistive-technology regression pending

## A. Deposit / Withdraw

Validate on mobile and desktop:

- Deposit select, transfer, confirmation and waiting states
- Withdraw account, amount, confirmation and waiting states
- Loading, error, empty and success states
- Slip upload, preview and confirmation modal
- Mobile keyboard does not cover primary action
- Sticky mobile action respects safe area
- Desktop form width remains readable
- Long bank names and account numbers wrap safely
- Bonus-blocked withdrawal remains understandable
- Tab and Shift+Tab remain inside an open confirmation dialog
- Escape closes a non-loading dialog
- Closing a dialog returns focus to the control that opened it
- A loading confirmation dialog cannot be dismissed accidentally

## B. Transactions / Bank Accounts

- Transaction list, empty state and status filters
- Mobile card readability
- Desktop table or wide-list readability
- Long notes and admin notes wrap
- Bank account add/edit/primary/disabled states
- Masked account numbers remain distinguishable
- No horizontal page overflow

## C. Admin Top-up / Withdrawal Queue

- Queue filters and pagination
- Claim/release/approve/reject actions
- Confirmation dialogs
- Slip/proof image sizing
- Admin note textarea
- Mobile actions stack without clipping
- Desktop details remain visible without excessive scrolling
- Empty/loading/error/success states
- Withdrawal account verification and risk summary
- Complete action only after real payout
- Reject action returns locked balance
- Tab and Shift+Tab remain inside an open confirmation dialog
- Escape closes a non-loading dialog
- Closing returns focus to the originating queue action
- Body scroll is restored after close

## D. Admin Members / Wallet Ledgers

- Member search/filter/pagination
- Mobile member cards remain readable
- Desktop member summary and actions remain scannable
- Long usernames, phones, emails, ids and amounts wrap safely
- Status quick actions preserve existing endpoint and payload
- Wallet-ledger search and direction filter
- Before/amount/after values remain readable
- Reference and idempotency values wrap without page overflow
- Metadata details remain keyboard accessible
- Detail links preserve 44px targets

## E. Public/Auth final polish

- Login and register at every viewport
- Autofill and password managers
- Visible focus states
- Error summary announced with `role=alert`
- Field errors connected with `aria-describedby`
- Invalid fields expose `aria-invalid=true`
- Disabled and loading submit states
- Password reveal has an accessible label
- Register password hint matches backend minimum of six characters
- Maintenance and feature-disabled states
- `/maintenance`, `/session-expired`, `/legal` and existing `/contact` routes
- Long Thai labels and 200% zoom
- Reduced-motion mode

## F. Smoke test

- Member login -> home
- Register -> home
- Deposit complete submission
- Withdraw complete submission
- Transactions visible
- Bank accounts visible
- Admin login -> dashboard
- Open top-up queue and withdrawal queue
- Open members and wallet ledgers
- Member search and status update
- Wallet-ledger search, direction filter and detail link
- Open and close member finance confirmation dialog with mouse and keyboard
- Open and close admin queue confirmation dialog with mouse and keyboard
- Open maintenance, session-expired, legal and contact routes
- Build, lint and type-check
- Verify deployed mobile and desktop screenshots

## Acceptance rule

A route is not complete until default, loading, empty, error, disabled and success states have been checked where applicable. Record the viewport and route for every failure instead of using the traditional engineering diagnosis of “it looks a bit weird on my phone.”