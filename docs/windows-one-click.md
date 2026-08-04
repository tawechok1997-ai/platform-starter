# Windows one-click setup

Updated: **2026-08-05**  
Owner: **Platform Engineering**  
Status: **Supported for local development on Windows 10/11**

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

The installer requests Windows Administrator permission only for Windows features and machine-wide applications. Project commands continue in the normal user session.

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

## Later use

- Double-click `Start-Windows.cmd` to start the complete stack.
- Double-click `Stop-Windows.cmd` to stop the applications, PostgreSQL, and Redis.
- Database and Redis volumes are preserved when the stack stops.

## Local isolation and secrets

The setup creates `.env.windows.local`. It does not overwrite `.env` or `.env.local`.

The Windows environment uses:

- PostgreSQL on `127.0.0.1:55432`
- Redis on `127.0.0.1:56379`
- generated per-machine database and application secrets
- local private storage under `.local/`

Both `.env.windows.local` and `.local/` are excluded from Git. Never copy these generated local secrets into a deployed environment.

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
