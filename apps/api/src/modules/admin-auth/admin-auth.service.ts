import { Injectable } from '@nestjs/common';
import { AdminLoginService, type AdminLoginMeta } from './admin-login.service';
import { AdminRefreshSessionService } from './admin-refresh-session.service';
import { AdminSessionCommandService } from './admin-session-command.service';
import { AdminSessionsQueryService } from './admin-sessions-query.service';
import { AdminTwoFactorCommandService } from './admin-two-factor-command.service';
import { AdminSignInDto } from './dto/admin-sign-in.dto';
import { VerifyAdminTwoFactorDto } from './dto/verify-admin-2fa.dto';

/**
 * Backwards-compatible facade for non-controller consumers.
 * Runtime routes use the focused services directly. Keep this class thin so
 * legacy imports do not retain duplicate authentication or crypto logic.
 */
@Injectable()
export class AdminAuthService {
  constructor(
    private readonly login: AdminLoginService,
    private readonly refreshSessions: AdminRefreshSessionService,
    private readonly sessionQueries: AdminSessionsQueryService,
    private readonly sessionCommands: AdminSessionCommandService,
    private readonly twoFactor: AdminTwoFactorCommandService,
  ) {}

  signIn(dto: AdminSignInDto, meta: AdminLoginMeta = {}) {
    return this.login.signIn(dto, meta);
  }

  verifyTwoFactor(dto: VerifyAdminTwoFactorDto, meta: AdminLoginMeta = {}) {
    return this.login.verifyTwoFactor(dto, meta);
  }

  refreshSession(refreshToken: string, meta: AdminLoginMeta = {}) {
    return this.refreshSessions.refresh(refreshToken, meta);
  }

  assertStepUp(adminUserId: string, code: string, meta: AdminLoginMeta = {}) {
    return this.login.assertStepUp(adminUserId, code, meta);
  }

  setupTwoFactor(adminUserId: string, meta: AdminLoginMeta = {}) {
    return this.twoFactor.setup(adminUserId, meta);
  }

  enableTwoFactor(adminUserId: string, code: string, meta: AdminLoginMeta = {}) {
    return this.twoFactor.enable(adminUserId, code, meta);
  }

  disableTwoFactor(adminUserId: string, code: string, meta: AdminLoginMeta = {}) {
    return this.twoFactor.disable(adminUserId, code, meta);
  }

  regenerateRecoveryCodes(adminUserId: string, code: string, meta: AdminLoginMeta = {}) {
    return this.twoFactor.regenerateRecoveryCodes(adminUserId, code, meta);
  }

  signOut(sessionId: string, adminUserId: string, meta: AdminLoginMeta = {}) {
    return this.sessionCommands.signOut(sessionId, adminUserId, meta);
  }

  listSessions(adminUserId: string, currentSessionId: string) {
    return this.sessionQueries.listSessions(adminUserId, currentSessionId);
  }

  revokeSession(adminUserId: string, currentSessionId: string, sessionId: string, meta: AdminLoginMeta = {}) {
    return this.sessionCommands.revokeSession(adminUserId, currentSessionId, sessionId, meta);
  }

  revokeOtherSessions(adminUserId: string, currentSessionId: string, meta: AdminLoginMeta = {}) {
    return this.sessionCommands.revokeOtherSessions(adminUserId, currentSessionId, meta);
  }

  revokeAllSessions(adminUserId: string, meta: AdminLoginMeta = {}) {
    return this.sessionCommands.revokeAllSessions(adminUserId, meta);
  }
}
