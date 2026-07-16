# Member Typography Contract

Updated: 2026-07-16  
Scope: Member UI only. Admin typography is out of scope for the current phase.

Typography is a role-based system, not a font applied by language alone. Every Member surface must preserve a calm Thai reading experience, crisp financial numbers, stable mixed-language metrics, and predictable responsive wrapping.

## Approved font roles

| Role             | Family                                     | Use                                                                                          |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `--font-thai`    | LINE Seed Sans TH, fallback Noto Sans Thai | Thai UI, navigation, buttons, labels, headings, descriptions, forms, statuses, notifications |
| `--font-latin`   | Inter, fallback system sans                | Short English titles, provider names, game names, compact English metadata                   |
| `--font-numeric` | Inter, fallback system sans                | Balance, amounts, dates, times, percentages, scores, ranking, countdown                      |
| `--font-mono`    | IBM Plex Mono, fallback system monospace   | Transaction IDs, references, technical identifiers, separated OTP cells only                 |

The default Member choice is LINE Seed Sans TH + Inter. IBM Plex Sans Thai + IBM Plex Sans is an approved alternative only when a route has a measured readability or financial-density reason. Do not mix alternatives within one surface without an explicit visual review.

## Loading and fallback

- Load only weights 400, 500, 600, and 700; prefer a variable WOFF2 when available.
- Use `font-display: swap`, preload only the primary Thai face, and keep fallback metrics close enough to prevent layout shift.
- Set `font-synthesis: none`; never rely on browser-synthesized Thai bold or italic.
- Keep `lang="th"` on the document root. Add `lang="en"` only to genuinely English passages.
- Use `font-variant-numeric: tabular-nums lining-nums` for numeric roles.

```css
:root {
  --font-thai: 'LINE Seed Sans TH', 'Noto Sans Thai', sans-serif;
  --font-latin: 'Inter', system-ui, sans-serif;
  --font-numeric: 'Inter', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;
}

html {
  font-family: var(--font-thai);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

.member-numeric {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums lining-nums;
}
```

## Role scale

| Role          | Desktop |  Mobile |  Weight | Thai line-height |
| ------------- | ------: | ------: | ------: | ---------------: |
| Hero title    | 40–48px | 28–32px |     700 |          1.2–1.3 |
| Page title    | 28–32px | 24–28px | 600–700 |          1.3–1.4 |
| Section title | 20–24px | 18–20px |     600 |          1.3–1.4 |
| Card title    | 15–18px | 14–16px |     600 |         1.35–1.5 |
| Body large    |    16px | 15–16px |     400 |         1.5–1.65 |
| Body          |    14px |    14px |     400 |         1.5–1.65 |
| Button        | 14–16px | 14–16px | 500–600 |        1.35–1.45 |
| Label         | 13–14px | 13–14px | 500–600 |          1.4–1.5 |
| Caption/badge | 12–13px |    12px | 400–600 |        1.45–1.55 |
| Balance       | 36–44px | 30–36px |     700 |                1 |

English display/heading line-height may be tighter (1.05–1.3). Do not force English tracking rules onto Thai text.

## Component rules

- Hero and headings use the Thai family for Thai copy. English display copy may use Inter, with modest negative tracking only for English.
- Navigation uses Thai 14px, weight 500; active state uses 600 plus color/background/icon indicator. Do not use weight alone because it shifts label width.
- Buttons use one locale and 1–4 action-first words. Do not combine Thai and English on one line unless the product requirement explicitly requires it.
- Balances and financial amounts use Inter, tabular figures, and separate visual sizing for currency and decimals. Use Arabic numerals for money, dates, time, OTP, references, percentages, scores, and countdowns.
- Game titles may use Inter when the title is genuinely English; provider/category metadata remains Thai-first. Clamp titles to two lines before ellipsizing.
- Transaction type, promotion copy, form labels, statuses, and notifications use the Thai family. Dates, times, amounts, and IDs use their numeric/code role.
- Use Mono only for transaction IDs, reference codes, technical identifiers, and separated OTP cells. Never use it for ordinary balances or names.

## Mixed Thai/English text

Use the Thai family as the default for sentences such as “รับ Cashback สูงสุด 10%” or “เข้าสู่ระบบด้วย Google”. Do not wrap every English word in an Inter span; reserve the Latin role for English-first components such as game titles and provider labels.

## Spacing and wrapping

- Thai body copy: letter-spacing 0; headings may use `-0.005em` to `-0.015em` only after visual review.
- English uppercase eyebrows may use tracking up to `0.08em`; never apply this to Thai text.
- Keep body copy near 60ch, card descriptions near 42ch, and hero descriptions near 36rem.
- Do not use synthetic italic for Thai. Communicate secondary emphasis with color, weight, soft background, or an icon.
- Test long Thai labels, mixed scripts, 200% zoom, mobile keyboards, and fallback-font loading before marking a route complete.

## QA gate

- [ ] Font family, role, weight, size, line-height, and numeric treatment are recorded for every new Member component.
- [ ] Only approved weights are requested and loaded; no browser-synthesized weight is visible.
- [ ] Desktop/mobile screenshots show no baseline jump, clipped Thai marks, unexpected wrapping, or layout shift after fonts load.
- [ ] Money, status, and reference text remain distinguishable without relying on color alone.
- [ ] Reduced-motion and accessibility checks are run with the same typography roles.
