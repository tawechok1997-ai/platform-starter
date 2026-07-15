import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = ['/login', '/register', '/contact', '/legal', '/maintenance', '/session-expired'];

for (const route of publicRoutes) {
  test(`${route} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
}

function formatViolations(violations: Array<{ id: string; help: string; nodes: Array<{ target: unknown }> }>) {
  return violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.help}\n${violation.nodes.map((node) => `  ${JSON.stringify(node.target)}`).join('\n')}`,
    )
    .join('\n\n');
}
