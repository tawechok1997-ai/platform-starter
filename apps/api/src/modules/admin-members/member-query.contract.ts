import type { AdminMembersQueryDto } from './dto/admin-members-query.dto';

export const MEMBER_QUERY = Symbol('MEMBER_QUERY');

/**
 * Read-only member boundary for cross-module consumers.
 *
 * Permission checks remain at controllers or calling application services.
 * Mutations must use AdminMembersCommandService and are intentionally excluded.
 */
export interface MemberQueryContract {
  listMembers(query: AdminMembersQueryDto): Promise<unknown>;
  getMemberInsights(): Promise<unknown>;
  getMemberDetail(id: string): Promise<unknown>;
}
