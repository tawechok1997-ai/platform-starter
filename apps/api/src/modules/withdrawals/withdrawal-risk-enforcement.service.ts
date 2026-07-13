import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RiskEnforcementService, RiskSubject } from '../risk-alerts/risk-enforcement.service';

@Injectable()
export class WithdrawalRiskEnforcementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskEnforcementService,
  ) {}

  async enforceBeforeApproval(
    requestId: string,
    adminUserId: string,
    overrideReason?: string,
  ) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        accountNumber: true,
        user: { select: { phone: true, email: true } },
      },
    });
    if (!request) throw new NotFoundException('Withdrawal request not found');

    const subjects: RiskSubject[] = [
      { subjectType: 'MEMBER', subjectValue: request.userId },
      { subjectType: 'PHONE', subjectValue: request.user?.phone ?? '' },
      { subjectType: 'EMAIL', subjectValue: request.user?.email ?? '' },
      { subjectType: 'BANK_ACCOUNT', subjectValue: request.accountNumber ?? '' },
    ];

    return this.risk.enforce({
      subjects,
      context: 'WITHDRAWAL_APPROVAL',
      memberId: request.userId,
      referenceType: 'withdrawal_request',
      referenceId: request.id,
      actorId: adminUserId,
      overrideReason,
    });
  }
}
