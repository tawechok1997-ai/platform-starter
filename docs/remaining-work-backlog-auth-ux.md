# Authentication UX Backlog

This document is the authoritative latest backlog for login, member registration, admin invitation activation, password setup, and authentication-page presentation across `web-member` and `web-admin`.

When this document overlaps with older login, register, invitation, authentication layout, or onboarding requirements, this document supersedes the older wording. Security controls from `remaining-work-backlog-security-admin-access.md` still apply and must not be weakened for visual simplicity.

## Product goal

Create calm, focused authentication screens with only the content required to complete the task. Both websites should place a compact authentication panel in the center of the screen with the site logo above it. Avoid marketing banners, dashboard previews, oversized illustrations, decorative side panels, testimonial blocks, feature lists, and unrelated promotional content.

## Shared visual direction for both websites

- [ ] Center the authentication panel vertically and horizontally within the safe viewport.
- [ ] Show the configured site logo above the form.
- [ ] Keep the page background restrained and visually quiet.
- [ ] Use one compact card or borderless panel with clear spacing and strong contrast.
- [ ] Keep form width comfortable on desktop and full-width with safe margins on mobile.
- [ ] Use shared authentication design tokens for spacing, typography, input height, radius, border, focus, error, loading, and disabled states.
- [ ] Keep the primary action visually dominant and secondary actions minimal.
- [ ] Add a small Thai/English language switcher without competing with the form.
- [ ] Use natural Thai and concise English copy.
- [ ] Remove unnecessary helper text, slogans, statistics, promotional imagery, and duplicated navigation.
- [ ] Support loading, offline, timeout, invalid-session, rate-limit, CAPTCHA, maintenance, and retry states without changing the clean layout.
- [ ] Use accessible labels, visible focus, password reveal controls, autocomplete attributes, and keyboard submission.
- [ ] Preserve form values after recoverable validation errors.

## Web Member login

- [ ] Show logo, page title, username/email/phone field according to enabled login methods, password field, remember-me option where policy allows, primary login button, forgot-password link, and register link.
- [ ] Keep CAPTCHA hidden until policy or risk scoring requires it when adaptive mode is enabled.
- [ ] Show account lock, incorrect credentials, suspended account, unverified account, and service-unavailable messages in human language.
- [ ] Never reveal whether a specific account exists when security policy forbids it.
- [ ] Preserve the intended return route after successful login.
- [ ] Prevent duplicate submission and show a clear in-button loading state.

## Web Member multi-step registration

Registration must be split into short, understandable steps instead of one long form.

### Step 1: Account details

- [ ] Collect the configured primary identifier such as phone, email, or username.
- [ ] Collect password and password confirmation.
- [ ] Show password requirements before submission.
- [ ] Check availability without exposing sensitive account information.

### Step 2: Identity and contact verification

- [ ] Verify phone or email using a short-lived one-time code when enabled.
- [ ] Add resend cooldown, expiry display, attempt limits, and change-contact action.
- [ ] Apply CAPTCHA or anti-bot challenge according to Admin security settings.

### Step 3: Personal and financial setup

- [ ] Collect only required profile fields.
- [ ] Collect bank-account details only when required at registration; otherwise defer to the bank-account flow after login.
- [ ] Validate duplicate bank, name mismatch, and unsupported bank rules when backend support exists.
- [ ] Clearly mark optional fields.

### Step 4: Review and consent

- [ ] Show a concise review summary.
- [ ] Require acceptance of the current Terms, Privacy Policy, and other mandatory legal documents.
- [ ] Link to readable document pages without losing registration progress.
- [ ] Show referral or promotion code only when enabled.

### Step 5: Success

- [ ] Show a simple confirmation state with the next required action.
- [ ] Redirect safely to login, verification, onboarding, or Member Home according to account state.
- [ ] Do not expose internal IDs, raw statuses, or backend payloads.

### Multi-step behavior

- [ ] Show a compact step indicator with current step and total steps.
- [ ] Allow back navigation without losing valid form data.
- [ ] Validate the current step before moving forward.
- [ ] Store unfinished progress only when privacy and security policy allow it.
- [ ] Expire sensitive registration state after a configured period.
- [ ] Prevent skipping required steps by editing the URL or client state.
- [ ] Enforce every step and verification state on the API.

## Web Admin login

- [ ] Show only logo, admin sign-in title, identifier, password, primary login button, forgot-password link where enabled, language switcher, and security challenge when required.
- [ ] Do not show a public admin registration link.
- [ ] Require 2FA after valid primary credentials for Owner and privileged roles.
- [ ] Support TOTP first and reserve passkey/WebAuthn presentation for later activation.
- [ ] Show environment name subtly when needed to prevent production/staging confusion.
- [ ] Show suspicious-login, locked-account, disabled-account, expired-invite, and session-expired messages safely.
- [ ] Preserve strict anti-enumeration behavior.

## Web Admin invitation and account activation wizard

Admin accounts are created or invited only by the Owner or an explicitly delegated admin. The public Admin site must not offer self-registration.

### Step 1: Validate invitation

- [ ] Validate the one-time invitation token, expiry, revocation state, intended email, inviter, assigned role, and approval state.
- [ ] Reject reused, expired, revoked, malformed, or mismatched invitations safely.

### Step 2: Confirm identity

- [ ] Confirm invited email and collect required profile details.
- [ ] Require email verification when policy requires it.
- [ ] Prevent changing the invited identity unless a separately authorized workflow permits it.

### Step 3: Create password

- [ ] Require the configured Admin password policy.
- [ ] Check breached-password rules when a supported service is configured.
- [ ] Prevent reuse according to password-history policy.

### Step 4: Set up 2FA

- [ ] Require TOTP enrollment for Owner and privileged roles before account activation.
- [ ] Show QR setup, manual key fallback, verification code, and one-time recovery codes.
- [ ] Require explicit confirmation that recovery codes were stored.

### Step 5: Review access

- [ ] Show assigned roles, effective permissions, scopes, delegation expiry, and security requirements in human-readable Thai and English.
- [ ] Do not allow the invited admin to grant themselves additional permissions.

### Step 6: Activate account

- [ ] Activate only after every required security step succeeds.
- [ ] Record inviter, approver, activation time, device/IP summary, and audit event.
- [ ] Revoke the invitation token immediately after successful activation.

## Password reset and account recovery

- [ ] Use the same clean centered layout on both websites.
- [ ] Split reset into request, verification, new password, and success states where required.
- [ ] Use short-lived, single-use reset tokens.
- [ ] Add anti-bot checks, resend limits, progressive throttling, and audit events.
- [ ] Do not reveal whether an account exists.
- [ ] Revoke affected sessions after successful Admin password reset and according to Member policy.
- [ ] Require stronger recovery and Owner-specific procedures for privileged Admin accounts.

## Responsive requirements

### Desktop

- [ ] Keep the panel centered with a restrained maximum width.
- [ ] Avoid split-screen marketing layouts.
- [ ] Keep the logo and form visible without unnecessary scrolling at common laptop heights.

### Tablet

- [ ] Keep the centered layout with touch-friendly spacing.
- [ ] Prevent the on-screen keyboard from hiding the active field or primary action.

### Mobile

- [ ] Use a single-column layout with safe-area padding.
- [ ] Keep controls at least 44px high.
- [ ] Keep the primary action reachable above or alongside the on-screen keyboard.
- [ ] Use full-screen step pages or a compact card without horizontal scrolling.
- [ ] Preserve registration progress when the device rotates or the keyboard changes viewport height.

## Bilingual requirements

- [ ] Every title, field, helper message, validation message, security warning, step label, CAPTCHA explanation, success state, and recovery message must support Thai and English.
- [ ] Thai must read naturally and avoid literal machine translation.
- [ ] English must be concise and operationally clear.
- [ ] Switching language must not clear entered form data.
- [ ] Long English labels must not break mobile layouts.

## Security and anti-bot requirements

- [ ] Apply configurable CAPTCHA and anti-bot policy from Admin settings per route.
- [ ] Verify CAPTCHA tokens on the backend.
- [ ] Add rate limiting by route, account, IP, and device signals where available.
- [ ] Add progressive lockout, credential-stuffing detection, password-spraying detection, replay prevention, honeypots where appropriate, and suspicious-login alerts.
- [ ] Keep Member and Admin authentication endpoints, cookies/tokens, sessions, and recovery flows strictly separated.
- [ ] Never place secrets, tokens, invite contents, or raw security errors in client logs.

## Acceptance criteria

- [ ] Both Web Member and Web Admin login pages are visually minimal, centered, logo-led, and free from unrelated content.
- [ ] Member registration uses a secure multi-step flow.
- [ ] Admin has no public registration; account activation uses a secure invitation-based multi-step flow.
- [ ] Thai and English are complete across all authentication states.
- [ ] Desktop, Tablet, and Mobile pass visual regression and keyboard/accessibility checks.
- [ ] Direct API calls cannot skip registration, invitation, verification, 2FA, CAPTCHA, or permission requirements.
- [ ] Existing auth, session, permission, and money-operation security behavior is not weakened by the redesign.

## Recommended delivery order

1. Shared clean authentication shell and bilingual copy foundation.
2. Web Member login redesign.
3. Web Admin login redesign with 2FA state handling.
4. Member multi-step registration.
5. Admin invitation and activation wizard.
6. Password reset and recovery flows.
7. CAPTCHA, rate-limit, security-state, responsive, accessibility, and visual-regression QA.
