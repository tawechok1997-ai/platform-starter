import { Injectable } from '@nestjs/common';
import { BonusLifecycleCommandService } from './bonus-lifecycle-command.service';
import { PromotionClaimCommandService } from './promotion-claim-command.service';
import { PromotionsQueryService } from './promotions-query.service';

type Actor = { id: string };
type ClaimInput = { campaignId?: string; note?: string; topupId?: string; depositAmount?: number };
type ReviewInput = { status?: 'APPROVED' | 'REJECTED'; adminNote?: string };
type TurnoverInput = { amount?: number | string; note?: string };
type BonusLifecycleInput = { action?: 'RELEASE' | 'RETRY' | 'REVERSE' | 'EXPIRE' | 'REVOKE'; note?: string };

/**
 * Backwards-compatible facade for legacy consumers.
 * Controllers use focused query and command services directly.
 */
@Injectable()
export class PromotionsService {
  constructor(
    private readonly queries: PromotionsQueryService,
    private readonly claims: PromotionClaimCommandService,
    private readonly bonusLifecycle: BonusLifecycleCommandService,
  ) {}

  listPublicCampaigns() {
    return this.queries.listPublicCampaigns();
  }

  listMemberClaims(user: Actor) {
    return this.queries.listMemberClaims(user.id);
  }

  listAdminClaims(query: { status?: string }) {
    return this.queries.listAdminClaims(query.status);
  }

  listMemberBonusLedgers(user: Actor) {
    return this.queries.listMemberBonusLedgers(user.id);
  }

  listAdminBonusLedgers(query: { status?: string }) {
    return this.queries.listAdminBonusLedgers(query.status);
  }

  createClaim(user: Actor, input: ClaimInput) {
    return this.claims.createClaim(user, input);
  }

  reviewClaim(admin: Actor, id: string, input: ReviewInput) {
    return this.claims.reviewClaim(admin, id, input);
  }

  addTurnoverProgress(admin: Actor, id: string, input: TurnoverInput) {
    return this.bonusLifecycle.addTurnoverProgress(admin, id, input);
  }

  updateBonusLifecycle(admin: Actor, id: string, input: BonusLifecycleInput) {
    return this.bonusLifecycle.updateBonusLifecycle(admin, id, input);
  }
}
