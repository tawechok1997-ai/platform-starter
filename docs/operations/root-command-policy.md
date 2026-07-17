# Root Command Policy

Root `package.json` scripts are the supported operator and CI interface for the monorepo. They should make common work discoverable without duplicating implementation details across workflows and documentation.

## Command layers

### Entry points

Use these for normal work:

- `pnpm help:commands`
- `pnpm check:repository`
- `pnpm check:quick`
- `pnpm check:full`
- `pnpm test:full-system:auto`

### Scope commands

Use these when changing one workspace or domain:

- `lint:*`
- `typecheck:*`
- `build:*`
- `audit:shared-api-client`
- `audit:finance-workflows`
- `verify:p6:*`

### Historical evidence

Commands containing closure identifiers such as `r1`, `r7`, `r14`, `p4`, or `p5` are retained for historical verification. They must not become the recommended daily entry point unless a new requirement explicitly reactivates that scope.

## Naming rules

- `check:*` combines safe checks intended for repeated developer use.
- `audit:*` inspects repository policy or architecture.
- `test:*` executes behavioral or regression tests.
- `verify:*` validates a deployment, environment, seeded workflow, or milestone.
- `build:*` and `start:*` target deployable workspaces.
- `help:*` prints guidance and must not mutate the repository.

## Ownership rules

Every root command must satisfy at least one condition:

1. it is a documented operator entry point;
2. it is used by CI or deployment;
3. it is referenced by another documented root command;
4. it is retained historical evidence with a clear closure identifier.

A command should be removed or deprecated when it is an exact alias with no compatibility value, references a deleted file, or points to a workflow that is no longer supported.

## Composition rules

- Put implementation logic in `tools/`, `scripts/`, or workspace scripts, not long shell fragments in multiple YAML files.
- Prefer one root alias that composes existing commands over repeating command bodies.
- Keep credentialed production verification separate from safe local checks.
- Do not make `check:quick` require production secrets, external services, or destructive database operations.
- `check:full` may take longer but must remain deterministic in a correctly prepared development environment.

## Change checklist

Before adding or renaming a root script:

- confirm an existing command cannot cover the use case;
- choose the correct prefix;
- add or update command documentation;
- update workflows that invoke the old name;
- run `pnpm audit:tool-registry` when a tool file is involved;
- preserve compatibility aliases only when an external workflow still depends on them.

## Supported discovery

Run:

```bash
pnpm help:commands
```

For exact verification command selection, see `docs/operations/verification-commands.md`.
