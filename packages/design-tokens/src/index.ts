export const color = {
  background: '#090b10',
  surface: '#121620',
  card: '#171c27',
  cardRaised: '#242b3a',
  text: '#f4f6fa',
  textMuted: '#b1b8c5',
  brand: '#7c5cff',
  success: '#38c98b',
  warning: '#f0b64f',
  danger: '#ef6473',
} as const;

export const radius = {
  small: '12px',
  medium: '16px',
  large: '24px',
  pill: '999px',
} as const;

export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
} as const;

export const shadow = {
  surface: '0 18px 60px rgba(0, 0, 0, 0.32)',
  overlay: '0 24px 90px rgba(0, 0, 0, 0.48)',
} as const;

export const motion = {
  fast: '160ms',
  normal: '220ms',
  slow: '340ms',
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
} as const;

export const typography = {
  sans: "Inter, 'Noto Sans Thai', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
} as const;

export const tokens = { color, radius, space, shadow, motion, typography } as const;
export type PlatformTokens = typeof tokens;
