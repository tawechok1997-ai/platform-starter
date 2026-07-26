# Member Frontend Clone Matrix

Source of truth: `https://noah345.shop/home` plus supplied screenshots and DOM snippets.

## Delivery rule

1. Build every screen and interaction with local mock state first.
2. Do not call the production API from clone-preview.
3. Missing exact image assets must display `MISSING ASSET`; never substitute an unrelated image.
4. After visual acceptance, migrate each approved screen into its real route and connect the API separately.
5. A screen is not complete merely because it builds. It must be checked at desktop and mobile sizes, with every visible control exercised.

## Preview entry

- Route: `/clone-preview`
- Direct screen: `/clone-preview?screen=<key>`
- Public access: enabled in `member-routes.ts`

## Screen inventory

| Key | Screen | Frontend mock | Real route migration | Backend connection |
|---|---|---:|---:|---:|
| `home` | Home/lobby | ✅ | 🔄 | ⏳ |
| `login` | Login | ✅ | ⏳ | ⏳ |
| `register` | Registration | ✅ | ⏳ | ⏳ |
| `games` | Game lobby and category filter | ✅ | ⏳ | ⏳ |
| `promotions` | Promotion list | ✅ | ⏳ | ⏳ |
| `activity` | Activity list | ✅ | ⏳ | ⏳ |
| `news` | News list | ✅ | ⏳ | ⏳ |
| `deposit` | Bank, QR, decimal, TrueWallet deposit flows | ✅ | ⏳ | ⏳ |
| `withdraw` | Withdrawal form and balance error | ✅ | ⏳ | ⏳ |
| `transactions` | Transaction table and filters | ✅ | ⏳ | ⏳ |
| `bonus` | Bonus list and claim state | ✅ | ⏳ | ⏳ |
| `affiliate` | Referral summary and link copy | ✅ | ⏳ | ⏳ |
| `bank` | Bank account list/add form | ✅ | ⏳ | ⏳ |
| `profile` | Personal/security/withdraw PIN/device tabs | ✅ | ⏳ | ⏳ |
| `notifications` | Read/unread notification list | ✅ | ⏳ | ⏳ |
| `support` | Ticket form and help navigation | ✅ | ⏳ | ⏳ |
| `guide` | FAQ accordion | ✅ | ⏳ | ⏳ |
| `contact` | LINE, live chat and ticket contact cards | ✅ | ⏳ | ⏳ |

## Interaction inventory

| Interaction | Mock state |
|---|---:|
| Header login/register | ✅ |
| Simulated login/logout | ✅ |
| Member-only route guard | ✅ |
| Wallet balance | ✅ |
| Deposit amount presets | ✅ |
| Deposit success | ✅ |
| Withdrawal success/error | ✅ |
| Game launch modal | ✅ |
| Promotion detail modal | ✅ |
| Mini-game modal | ✅ |
| Category filters | ✅ |
| Profile tabs | ✅ |
| Notification read state feedback | ✅ |
| Copy referral link feedback | ✅ |
| Bank save feedback | ✅ |
| Support ticket feedback | ✅ |
| Responsive navigation drawer | ✅ |
| Missing asset indicator | ✅ |

## Visual acceptance still required

The preview establishes complete frontend navigation and behavior, but exact visual parity still requires reference captures for pages that are not publicly visible. For each private/authenticated page, add a desktop and mobile screenshot or DOM capture before marking visual parity complete.

Required QA sizes:

- Desktop reference: 1920 × 1080
- Desktop full page: 1455 px content shell
- Tablet: 1024 px
- Mobile: 390 × 844

## Migration order

1. Header and common shell
2. Login/register
3. Game lobby and game modal
4. Promotions/activity/news
5. Deposit and withdrawal
6. Transaction history and bonus
7. Affiliate and bank account
8. Profile/security/notifications
9. Support/guide/contact
10. Final responsive and interaction regression pass
