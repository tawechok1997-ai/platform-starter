# P2 Wallet Flow

Status: completed

## Scope

P2 covers website settings, member wallet foundation, top-up requests, withdrawal requests, ledger history, admin wallet views, short member ID search, and manual wallet adjustment.

## Completed feature list

### Website Settings

- Public site settings API
- Public theme, SEO, contact, and maintenance settings
- Admin website settings pages
- Branding settings
- Theme settings
- SEO settings
- Contact settings
- Maintenance settings
- Script settings
- Feature flag settings
- Legal page settings

### Member Wallet

- Member wallet card
- Balance display
- Locked balance display
- Available balance display
- Deposit button
- Withdraw button
- Transaction history button
- Member transaction history page at `/transactions`

### Top-up Flow

- Member top-up request page at `/deposit`
- Amount input
- Method selection
- Slip attachment
- Pending status
- Admin top-up review page at `/topups`
- Admin slip preview
- Admin approve top-up
- Admin reject top-up
- Wallet CREDIT ledger on approval
- Admin audit log for top-up review

### Withdrawal Flow

- Member withdrawal request page at `/withdraw`
- Bank/account details
- Available balance validation
- Locked balance on request
- Pending status
- Admin withdrawal review page at `/withdrawals`
- Admin complete withdrawal
- Admin reject withdrawal
- Wallet DEBIT ledger on completed withdrawal
- Locked balance release on complete/reject
- Admin audit log for withdrawal review

### Ledger and Wallet Admin

- Admin ledger explorer at `/ledgers`
- Filter ledger by username
- Filter ledger by short ID
- Filter ledger by full user ID
- Filter ledger by type
- Filter ledger by direction
- Admin wallet list at `/wallets`
- Search wallet by username
- Search wallet by short ID
- Search wallet by full user ID
- Show wallet balance
- Show locked balance
- Show available balance
- Show Short ID
- Copy full user ID
- Link wallet to user ledger

### Manual Wallet Adjustment

- Admin CREDIT adjustment
- Admin DEBIT adjustment
- Required reason
- Prevent zero or negative amount
- Prevent balance below zero
- Prevent balance below locked balance
- Create ADJUSTMENT ledger
- Create admin audit log
- Show adjustment immediately in ledger

## Deploy

When only API/UI code changes, deploy API, web-member, and web-admin. No database push is required.

When Prisma schema changes, deploy API and run:

```bash
pnpm db:push
```

## Member test checklist

1. Register/login member.
2. Open member home and confirm wallet balance, locked balance, deposit, withdraw, and transaction history links.
3. Create a top-up request from `/deposit` with slip attachment.
4. Create a withdrawal request from `/withdraw` with bank details.
5. Open `/transactions` and confirm DEPOSIT/CREDIT and WITHDRAWAL/DEBIT records show balance before and after.

## Admin test checklist

1. Open `/topups`, approve a pending top-up, and confirm wallet balance increases.
2. Open `/withdrawals`, complete a pending withdrawal, and confirm wallet balance decreases and locked balance clears.
3. Open `/ledgers` and filter by username, short ID, full user ID, type, and direction.
4. Open `/wallets`, search by username, short ID, or full user ID.
5. Use Manual Wallet Adjustment to CREDIT and DEBIT a wallet with a required reason.
6. Confirm every manual adjustment creates an ADJUSTMENT ledger and admin audit log.

## Safety rules

- Amount must be greater than zero.
- Manual adjustment requires a reason.
- DEBIT cannot make balance negative.
- DEBIT cannot reduce balance below locked balance.
- Reviewed top-up and withdrawal requests cannot be processed twice.

## P2 close criteria

P2 is complete when:

- Top-up flow works from member request to admin approval.
- Withdrawal flow works from member request to admin complete/reject.
- Member transaction history displays correct ledger records.
- Admin ledger and wallet pages display correct data.
- Admin can manually adjust wallet balance with ledger and audit tracking.
- The final regression test passes on Railway production services.

## Final result

P2 is closed and production-tested.
