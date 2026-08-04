export type P8PersonaId =
  | 'finance'
  | 'deposit-withdrawal'
  | 'marketing'
  | 'manager'
  | 'system-admin'
  | 'multi-role'
  | 'explicit-deny';

export type P8Browser = 'chromium' | 'firefox' | 'webkit';
export type P8Viewport = 'desktop' | 'tablet' | 'mobile';
export type P8RouteTier = 0 | 1 | 2;

export type P8MatrixCase = {
  route: string;
  tier: P8RouteTier;
  persona: P8PersonaId;
  browser: P8Browser;
  viewport: P8Viewport;
  expectation: 'allow-or-domain-deny' | 'explicit-deny';
};

export const P8_PERSONAS = [
  'finance',
  'deposit-withdrawal',
  'marketing',
  'manager',
  'system-admin',
  'multi-role',
  'explicit-deny',
] as const satisfies readonly P8PersonaId[];

export const P8_TIER_0_ROUTES = [
  '/security',
  '/admin-accounts',
  '/admin-roles',
  '/admin-invitations',
  '/access',
  '/audit',
  '/operations',
  '/topups',
  '/withdrawals',
  '/bulk-queue-operations',
  '/wallets',
  '/reconciliation-center',
  '/risk-alerts',
  '/provider-credentials',
  '/system-settings',
] as const;

export function p8MatrixCaseKey(item: P8MatrixCase) {
  return [item.tier, item.route, item.persona, item.browser, item.viewport].join(':');
}

export function buildP8Tier0Matrix(): readonly P8MatrixCase[] {
  const cases: P8MatrixCase[] = [];

  for (const route of P8_TIER_0_ROUTES) {
    for (const persona of P8_PERSONAS) {
      cases.push(matrixCase(route, persona, 'chromium', 'desktop'));
    }

    for (const persona of ['system-admin', 'explicit-deny'] as const) {
      cases.push(matrixCase(route, persona, 'chromium', 'tablet'));
      cases.push(matrixCase(route, persona, 'chromium', 'mobile'));
      cases.push(matrixCase(route, persona, 'firefox', 'desktop'));
      cases.push(matrixCase(route, persona, 'webkit', 'desktop'));
    }
  }

  return Object.freeze(deduplicateCases(cases));
}

export function shardP8Matrix(
  cases: readonly P8MatrixCase[],
  shardIndex: number,
  shardTotal: number,
): readonly P8MatrixCase[] {
  if (!Number.isInteger(shardTotal) || shardTotal < 1) throw new Error('shardTotal must be a positive integer');
  if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardTotal) {
    throw new Error('shardIndex must be within the shard range');
  }

  return Object.freeze([...cases]
    .sort((left, right) => p8MatrixCaseKey(left).localeCompare(p8MatrixCaseKey(right)))
    .filter((_, index) => index % shardTotal === shardIndex));
}

export function validateP8Tier0Matrix(cases: readonly P8MatrixCase[]) {
  const findings: string[] = [];
  const keys = cases.map(p8MatrixCaseKey);
  if (new Set(keys).size !== keys.length) findings.push('duplicate-matrix-case');

  for (const route of P8_TIER_0_ROUTES) {
    const routeCases = cases.filter((item) => item.route === route);
    for (const persona of P8_PERSONAS) {
      if (!routeCases.some((item) => item.persona === persona && item.browser === 'chromium' && item.viewport === 'desktop')) {
        findings.push(`missing-desktop-persona:${route}:${persona}`);
      }
    }
    for (const persona of ['system-admin', 'explicit-deny'] as const) {
      for (const viewport of ['tablet', 'mobile'] as const) {
        if (!routeCases.some((item) => item.persona === persona && item.browser === 'chromium' && item.viewport === viewport)) {
          findings.push(`missing-responsive-case:${route}:${persona}:${viewport}`);
        }
      }
      for (const browser of ['firefox', 'webkit'] as const) {
        if (!routeCases.some((item) => item.persona === persona && item.browser === browser && item.viewport === 'desktop')) {
          findings.push(`missing-cross-browser-case:${route}:${persona}:${browser}`);
        }
      }
    }
  }

  return Object.freeze(findings);
}

function matrixCase(
  route: string,
  persona: P8PersonaId,
  browser: P8Browser,
  viewport: P8Viewport,
): P8MatrixCase {
  return Object.freeze({
    route,
    tier: 0,
    persona,
    browser,
    viewport,
    expectation: persona === 'explicit-deny' ? 'explicit-deny' : 'allow-or-domain-deny',
  });
}

function deduplicateCases(cases: readonly P8MatrixCase[]) {
  return [...new Map(cases.map((item) => [p8MatrixCaseKey(item), item])).values()];
}
