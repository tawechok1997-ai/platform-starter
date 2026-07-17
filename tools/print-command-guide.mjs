const sections = [
  {
    title: 'Daily development',
    commands: [
      ['pnpm check:quick', 'Runtime, lint, and TypeScript checks'],
      ['pnpm check:full', 'Repository-wide validation before broad merges'],
      ['pnpm format:check', 'Formatting check for changed files'],
      ['pnpm test:full-system:auto', 'Automatic multi-workspace verification profile'],
    ],
  },
  {
    title: 'Workspace builds',
    commands: [
      ['pnpm build:api', 'Build the API'],
      ['pnpm build:web-admin', 'Build Admin Web'],
      ['pnpm build:web-member', 'Build Member Web'],
    ],
  },
  {
    title: 'Browser quality',
    commands: [
      ['pnpm test:e2e:smoke', 'Browser smoke tests'],
      ['pnpm test:e2e:a11y', 'Accessibility tests'],
      ['pnpm test:e2e:visual', 'Visual regression tests'],
    ],
  },
  {
    title: 'Security and architecture',
    commands: [
      ['pnpm check:architecture', 'Architecture and permission boundaries'],
      ['pnpm audit:dependency-security', 'Production dependency and secret checks'],
    ],
  },
];

console.log('Platform Starter command guide');
console.log('Detailed rules: docs/operations/verification-commands.md\n');

for (const section of sections) {
  console.log(section.title);
  for (const [command, description] of section.commands) {
    console.log(`  ${command.padEnd(34)} ${description}`);
  }
  console.log('');
}

console.log('Historical closure and P6 commands are intentionally omitted here.');
console.log('Use the documentation when reproducing evidence or running environment-specific verification.');
