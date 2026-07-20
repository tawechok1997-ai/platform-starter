import { Injectable } from '@nestjs/common';
import { ProviderSimulatorPersistenceRepository } from './provider-simulator-persistence.repository';

export type SimulatorManualReviewInput = {
  providerCode: string;
  userId: string;
  roundId: string;
  gameCode: string;
  operation: string;
  providerTransactionId: string;
  originalProviderTransactionId?: string | null;
  amount: string;
  currency: string;
  reason: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class ProviderSimulatorManualReviewService {
  constructor(private readonly repository: ProviderSimulatorPersistenceRepository) {}

  create(input: SimulatorManualReviewInput) {
    return this.repository.createManualReview(input);
  }
}
