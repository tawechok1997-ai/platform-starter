# Work Status Reporting

## Canonical source

All remaining-work counts must come from `docs/master-project-worklist.md`.

Do not derive project status from temporary cleanup plans, ad-hoc priority groups, chat summaries, issue counts, or newly created maintenance documents. Those may describe work, but they are not the project backlog unless their items are added to the master worklist.

## Required reporting fields

Every status report must distinguish:

- repository code work remaining in P0-P5;
- external verification and UAT remaining in P6;
- blocked prerequisites such as credentials, deployed URLs, production access, vendor contracts, or approvals;
- commits completed in the current batch;
- CI and deployment evidence available for those commits.

Use:

```bash
pnpm audit:master-worklist
pnpm audit:master-worklist:json
```

The JSON command is the machine-readable source for dashboards, automation, or assistant summaries.

## Current interpretation

A P6 checkbox is not repository implementation debt when the worklist marks it as external verification. Do not claim it was completed merely because a script, template, policy, or readiness check exists. Close it only after the required external execution and retained evidence exist.

Likewise, repository maintenance work created outside the master worklist must not silently increase the official remaining-work count.

## Updating counts

When closing or adding a worklist checkbox:

1. Update the owning checkbox and evidence in `docs/master-project-worklist.md`.
2. Update the declared totals at the bottom of the file.
3. Run `pnpm audit:master-worklist`.
4. Retain the relevant commit, run, artifact, or external evidence.

A count that cannot be reproduced by the audit must not be reported as authoritative.
