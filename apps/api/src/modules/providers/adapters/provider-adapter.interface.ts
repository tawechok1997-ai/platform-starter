export interface ProviderAdapter {
  createUser(userId: string): Promise<unknown>;
  launchGame(userId: string, gameCode: string): Promise<string>;
  getBalance(userId: string): Promise<number>;
  transfer(userId: string, amount: number): Promise<unknown>;
  rollback(transactionId: string): Promise<unknown>;
}
