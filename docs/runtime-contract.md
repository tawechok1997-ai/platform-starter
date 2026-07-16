# Runtime Contract

The repository uses one supported local and CI runtime contract:

- Node.js `22.x`
- pnpm `11.13.0`
- Corepack enabled

## Sources of truth

- `package.json#packageManager`
- `package.json#engines`
- `.node-version`
- `.nvmrc`
- `.tool-versions`
- `mise.toml`

These files must remain aligned. Do not update only one runtime declaration.

## Setup

```bash
corepack enable
corepack prepare pnpm@11.13.0 --activate
node --version
pnpm --version
pnpm check:runtime
```

## Policy

- CI and deployed builds must use Node 22.
- Dependency installation must use the pinned pnpm version through Corepack.
- Runtime upgrades require updating every source-of-truth file in the same change.
- Runtime upgrades must pass API, Admin, Member, lint, typecheck and build checks.
- Do not weaken the version range to make an unsupported machine pass.

## Troubleshooting

When `pnpm check:runtime` fails, activate the pinned package manager again:

```bash
corepack enable
corepack prepare pnpm@11.13.0 --activate
```

Then switch to Node 22 using the version manager already installed on the machine.
