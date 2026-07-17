# Repository Cleanup Evidence Template

Use one record per cleanup batch. Discovery is not deletion approval. A suspicious filename is merely suspicious, rather like most things humans name `final-final-2`.

## Batch metadata

- Date:
- Owner:
- Scope:
- Inventory command:
- Baseline version:
- Commit SHA:

## Candidate decisions

| Path | Classification | Disposition | Reference search | Reason | Evidence |
|---|---|---|---|---|---|
| | active / scoped / historical / unused / generated | keep / move / delete / ignore | command or query | | |

## Mandatory checks before deletion

- [ ] No source import or runtime reference exists.
- [ ] No workflow, script, test, documentation, migration, or retained evidence references the file.
- [ ] The file is not classified as active, scoped, or historical in the tool registry or owning documentation.
- [ ] Generated output can be reproduced from a documented command.
- [ ] Rollback is possible from Git history.

## Verification after changes

- [ ] `pnpm check:repository`
- [ ] Relevant lint and typecheck commands
- [ ] Relevant tests
- [ ] Relevant build commands
- [ ] Deployment status checked when the change reaches `main`

## Result

- Files deleted:
- Files moved:
- Files retained:
- Remaining candidates:
- Remaining risk:
- Rollback commit:
