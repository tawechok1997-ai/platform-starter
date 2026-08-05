# Windows one-click setup

Updated: **2026-08-05**  
Owner: **Platform Engineering**  
Status: **Supported for local development on Windows 10/11 after a real clean-machine smoke test**

## What it installs

Double-clicking `Setup-Windows.cmd` prepares the complete local development stack:

- Git for Windows
- Node.js 22
- Corepack and pnpm 11.18.0
- WSL 2 Windows features
- Docker Desktop with the WSL 2 backend
- PostgreSQL 16 in a local Docker container
- Redis 7 in a local Docker container
- repository dependencies, Prisma client, migrations, and local seed data
- API, Member Web, and Admin Web development processes

The installer requests Windows Administrator permission for Windows features, machine-wide applications, and the Corepack pnpm shim. Project dependency installation, database initialization, and application startup continue in the normal user session.

## First run

1. Extract or clone the repository to a normal writable folder.
2. Double-click `Setup-Windows.cmd`.
3. Accept the Windows UAC prompt.
4. Keep an internet connection available while tools and container images are downloaded.

When WSL 2 must be enabled, Windows schedules this installer to continue after sign-in and restarts the computer. The restart warning includes the Windows command for cancelling it.

After setup, these URLs open automatically:

| Service | URL |
| --- | --- |
| Member Web | `http://localhost:3000` |
| Admin Web | `http://localhost:3001` |
| API health | `http://localhost:4000/health` |

## First local Admin sign-in

The local bootstrap Admin username and email come from `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_EMAIL` in `.env.windows.local`. The setup replaces the maintained password placeholder with a random per-machine value.

From the repository folder, run this command only in your own local terminal to display the generated password:

```powershell
powershell.exe -NoProfile -Command "(Select-String -LiteralPath '.env.windows.local' -Pattern '^BOOTSTRAP_ADMIN_PASSWORD=').Line -replace '^BOOTSTRAP_ADMIN_PASSWORD=', ''"
```

Do not paste the generated password into chat, tickets, logs, screenshots, or a deployed environment. If `.env.windows.local` already existed before setup, the installer preserves its existing local credentials.

## Later use

- Double-click `Start-Windows.cmd` to start the complete stack.
- Double-click `Stop-Windows.cmd` to stop the applications, PostgreSQL, and Redis.
- Double-click `Verify-Windows.cmd` after setup to verify the real machine and generate evidence.
- Database and Redis volumes are preserved when the stack stops.

The launcher records each PowerShell process ID together with its exact start time. Start and stop operations verify both values before reusing or terminating a process. A stale record or a Windows-reused PID is ignored instead of risking termination of an unrelated program.

Process records are normalized before use because Windows PowerShell 5.1 may deserialize a JSON array as a nested object array. PID values must contain exactly one valid integer before the launcher can inspect or terminate the recorded process.

If startup opens only part of the application stack or a process tree cannot be stopped, the launcher surfaces the native failure instead of reporting success. Partially opened application terminals are cleaned up before the startup command exits.

## Clean-machine verification evidence

After the setup completes and all three applications are running, double-click:

```text
Verify-Windows.cmd
```

The verifier checks the actual machine rather than relying on the CI simulation. It validates:

- Windows 10/11 client edition and WSL status
- Git, Node.js 22, pnpm 11.18.0, Docker CLI, and Docker Desktop
- the generated Windows environment and required non-placeholder keys
- Docker engine readiness and Compose configuration
- running PostgreSQL and Redis services
- `pg_isready` and Redis `PONG`
- Prisma migration status against the local database
- API, Member, and Admin process records
- API, Member, and Admin HTTP endpoints

The result is written to:

```text
.local/evidence/windows-clean-machine-verification.json
```

The report contains check names, pass/fail status, machine name, username, timestamps, and safe diagnostic text. It does **not** include generated passwords, database URLs, tokens, encryption keys, or other environment values. The `.local/` directory is excluded from Git.

A non-zero exit code means at least one required check failed. Correct the failed item, run `Start-Windows.cmd` if necessary, then run `Verify-Windows.cmd` again. Keep the JSON report as the acceptance evidence for the real clean-machine test.

## Local isolation and secrets

The setup creates `.env.windows.local`. It does not overwrite `.env` or `.env.local`.

The Windows environment uses:

- PostgreSQL on `127.0.0.1:55432`
- Redis on `127.0.0.1:56379`
- generated per-machine database and application secrets
- a generated bootstrap Admin password instead of the maintained placeholder
- local private storage under `.local/`

Both `.env.windows.local` and `.local/` are excluded from Git. Never copy these generated local secrets into a deployed environment.

## Automated verification

The `Windows One-Click Smoke` GitHub Actions workflow runs on `windows-latest` whenever the installer, launchers, Windows scripts, Compose file, environment template, ignore rules, documentation, smoke helpers, or their contracts change.

The static and native checks verify:

- 18 Node contracts for the complete one-click surface, verifier, and lifecycle ownership
- Windows PowerShell 5.1 parsing for every script under `scripts/windows/`
- root `.cmd` wrappers pointing to the maintained PowerShell owners
- generated environment keys and the local Admin credential recovery instructions
- PowerShell 5.1-safe process-record normalization
- the maintained `start.ps1` and `stop.ps1` owners running on a native Windows runner
- first startup of API, Member, and Admin loopback smoke services
- a second healthy start reusing the same three recorded terminal processes
- recovery after the Member child service is terminated
- replacement of the complete recorded stack after one service becomes unhealthy
- complete stop cleanup and removal of the process record
- stale PID protection without terminating an unrelated process
- the clean-machine verifier owner and redacted evidence contract

The lifecycle integration uses isolated loopback smoke services and a fake Docker command. It proves launcher behavior on Windows PowerShell 5.1 without installing Docker Desktop or exposing network services outside the runner.

This native gate does not replace the remaining clean-machine checks for Windows 10/11 client UAC, WSL feature enablement, reboot continuation, Docker Desktop first boot, real container image pulls, real database initialization, the complete application stack, or bootstrap Admin sign-in. `Verify-Windows.cmd` turns those checks into one redacted machine report after the real setup is run.

## Logs and recovery

Setup failures are written to:

```text
.local/logs/windows-setup.log
```

Each application runs in its own PowerShell window so startup and runtime errors remain visible.

Safe recovery order:

1. Run `Stop-Windows.cmd`.
2. Start Docker Desktop and wait until its engine is ready.
3. Run `Setup-Windows.cmd` again. The setup is idempotent and preserves the generated Windows environment.
4. Run `Verify-Windows.cmd` and review the failed checks in the evidence report.

Do not delete the Docker volume unless local database data can be discarded.

## Windows Server

This package intentionally rejects Windows Server because Docker Desktop does not support Windows Server, while the local PostgreSQL and Redis services use Linux containers. Deploy the project through the supported Linux container path or a dedicated Linux VM/WSL environment on server hosts instead of forcing a half-supported desktop stack onto a server operating system.
