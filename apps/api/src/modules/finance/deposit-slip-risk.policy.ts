type DuplicateSlipReason =
  | 'TRANSACTION_REFERENCE'
  | 'FILE_HASH'
  | 'PERCEPTUAL_HASH'
  | 'TRANSACTION_FINGERPRINT';

export type DuplicateSlipMatch = {
  reason: DuplicateSlipReason;
  originalRequestId: string;
  score: number;
};

type DuplicateAttemptRisk = {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  shouldAlert: boolean;
  shouldTemporarilyBlockDeposits: boolean;
};

export function duplicateAttemptRisk(attemptsIn7Days: number, attemptsIn30Days: number): DuplicateAttemptRisk {
  if (attemptsIn30Days >= 5) {
    return { severity: 'CRITICAL', shouldAlert: true, shouldTemporarilyBlockDeposits: true };
  }
  if (attemptsIn30Days >= 3) {
    return { severity: 'HIGH', shouldAlert: true, shouldTemporarilyBlockDeposits: false };
  }
  if (attemptsIn7Days >= 2) {
    return { severity: 'MEDIUM', shouldAlert: true, shouldTemporarilyBlockDeposits: false };
  }
  return { severity: 'LOW', shouldAlert: false, shouldTemporarilyBlockDeposits: false };
}

export function chooseStrongestDuplicateMatch(matches: DuplicateSlipMatch[]): DuplicateSlipMatch | null {
  if (matches.length === 0) return null;
  const priority: Record<DuplicateSlipReason, number> = {
    TRANSACTION_REFERENCE: 4,
    FILE_HASH: 3,
    TRANSACTION_FINGERPRINT: 2,
    PERCEPTUAL_HASH: 1,
  };

  return [...matches].sort((a, b) => {
    const priorityDifference = priority[b.reason] - priority[a.reason];
    return priorityDifference !== 0 ? priorityDifference : b.score - a.score;
  })[0];
}

export function duplicateMemberMessage(match: DuplicateSlipMatch): string {
  switch (match.reason) {
    case 'TRANSACTION_REFERENCE':
      return 'สลิปนี้ถูกใช้แล้ว เนื่องจากเลขอ้างอิงธุรกรรมซ้ำ';
    case 'FILE_HASH':
      return 'สลิปนี้ถูกใช้แล้ว เนื่องจากเป็นไฟล์เดียวกับรายการก่อนหน้า';
    case 'TRANSACTION_FINGERPRINT':
      return 'สลิปนี้มีข้อมูลธุรกรรมซ้ำกับรายการก่อนหน้า';
    case 'PERCEPTUAL_HASH':
      return 'สลิปนี้มีลักษณะเหมือนสลิปที่เคยใช้ ระบบยกเลิกรายการเพื่อรอตรวจสอบ';
  }
}
