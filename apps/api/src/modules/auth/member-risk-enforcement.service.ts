import { Injectable } from '@nestjs/common';
import { RiskEnforcementService, RiskSubject } from '../risk-alerts/risk-enforcement.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';

@Injectable()
export class MemberRiskEnforcementService {
  constructor(private readonly risk: RiskEnforcementService) {}

  enforceRegistration(dto: RegisterDto, ipAddress?: string, deviceId?: string) {
    const subjects: RiskSubject[] = [
      { subjectType: 'PHONE', subjectValue: dto.phone ?? '' },
      { subjectType: 'EMAIL', subjectValue: dto.email ?? '' },
      { subjectType: 'BANK_ACCOUNT', subjectValue: dto.bankAccountNumber },
      { subjectType: 'IP', subjectValue: ipAddress ?? '' },
      { subjectType: 'DEVICE', subjectValue: deviceId ?? dto.deviceId ?? '' },
    ];
    return this.risk.enforce({
      subjects,
      context: 'MEMBER_REGISTRATION',
      referenceType: 'member_registration',
      referenceId: dto.username,
    });
  }

  enforceProfileUpdate(memberId: string, dto: UpdateMemberProfileDto) {
    const subjects: RiskSubject[] = [
      { subjectType: 'MEMBER', subjectValue: memberId },
      { subjectType: 'PHONE', subjectValue: dto.phone ?? '' },
      { subjectType: 'EMAIL', subjectValue: dto.email ?? '' },
    ];
    return this.risk.enforce({
      subjects,
      context: 'MEMBER_PROFILE_UPDATE',
      memberId,
      referenceType: 'user',
      referenceId: memberId,
    });
  }
}
