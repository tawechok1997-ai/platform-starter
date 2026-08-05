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
- Database and Redis volumes are preserved when the stack stops.

The launcher records each PowerShell process ID together with its exact start time. Start and stop operations verify both values before reusing or terminating a process. A stale record or a Windows-reused PID is ignored instead of risking termination of an unrelated program.

If startup opens only part of the application stack or a process tree cannot be stopped, the launcher surfaces the native failure instead of reporting success. Partially opened application terminals are cleaned up before the startup command exits.

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

The `Windows One-Click Smoke` GitHub Actions workflow runs on `windows-latest` whenever the installer, launchers, Windows scripts, Compose file, environment template, ignore rules, documentation, or their contracts change. It verifies:

- the Node contract suite for the complete one-click surface
- Windows PowerShell 5.1 parsing for every script under `scripts/windows/`
- root `.cmd` wrappers pointing to the maintained PowerShell owners
- generated environment keys and the local Admin credential recovery instructions

This native smoke gate catches syntax and launcher regressions, but it does not replace the required clean-machine test for UAC, WSL enablement, reboot continuation, Docker Desktop first boot, image pulls, and the complete three-application startup.

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

Do not delete the Docker volume unless local database data can be discarded.

## Windows Server

This package intentionally rejects Windows Server because Docker Desktop does not support Windows Server, while the local PostgreSQL and Redis services use Linux containers. Deploy the project through the supported Linux container path or a dedicated Linux VM/WSL environment on server hosts instead of forcing a half-supported desktop stack onto a server operating system.
