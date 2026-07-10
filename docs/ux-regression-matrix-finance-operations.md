# UX regression matrix: finance, operations and public auth

## Viewports

- 360x800
- 390x844
- 430x932
- 768x1024
- 1024x768
- 1440x900

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

## D. Admin Members / Transactions

- Search/filter/pagination
- Mobile controls remain reachable
- Desktop dense information remains scannable
- Long usernames, phones, ids and amounts wrap safely
- Table horizontal fallback does not break the page
- Detail links and row actions preserve 44px targets

## E. Public/Auth final polish

- Login and register at every viewport
- Autofill and password managers
- Visible focus states
- Error message announced and readable
- Disabled and loading submit states
- Password reveal has an accessible label
- Maintenance and feature-disabled states
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
- Open members and transactions
- Build, lint and type-check
- Verify deployed mobile and desktop screenshots

## Acceptance rule

A route is not complete until default, loading, empty, error, disabled and success states have been checked where applicable. Record the viewport and route for every failure instead of using the traditional engineering diagnosis of “it looks a bit weird on my phone.”
