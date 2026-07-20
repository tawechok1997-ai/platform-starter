import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/**
 * Shared JWT infrastructure for feature modules that only need JwtService.
 *
 * Token policy, secrets and domain-specific session behavior remain owned by
 * the member/admin authentication domains. This module only removes repeated
 * empty JwtModule registrations from feature modules.
 */
@Module({
  imports: [JwtModule.register({})],
  exports: [JwtModule],
})
export class JwtAuthModule {}
