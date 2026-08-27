export type ReferralTargetType = 'PATIENT' | 'CLINIC' | 'LABORATORY' | 'PHARMACY';
export type ReferralStatus = 'REGISTERED' | 'QUALIFIED' | 'REJECTED' | 'CANCELLED';
export interface ReferralProgress {
  readonly qualified: number;
  readonly required: number;
}
export interface ReferralLevel {
  readonly code: string;
  readonly name: string;
  readonly ordinal: number;
}
export interface ReferralLevelRequirement {
  readonly targetType: ReferralTargetType;
  readonly qualified: number;
  readonly required: number;
  readonly remaining: number;
  readonly completed: boolean;
}
export interface MultiLevelReferralProgress {
  readonly currentLevel: ReferralLevel | null;
  readonly nextLevel: ReferralLevel | null;
  readonly highestLevelAchieved: number;
  readonly requirements: ReferralLevelRequirement[];
  readonly highestConfiguredLevelReached: boolean;
  readonly qualifiedCounts: Record<ReferralTargetType, number>;
}
export interface ReferralSummary {
  readonly referralCode: string;
  readonly links: Record<ReferralTargetType, string>;
  readonly availablePoints: number;
  readonly reservedPoints: number;
  readonly withdrawalReservedPoints: number;
  readonly healthCheckReservedPoints: number;
  readonly lifetimeEarnedPoints: number;
  readonly lifetimeRedeemedPoints: number;
  readonly levelProgress: MultiLevelReferralProgress;
  /** @deprecated Temporary backend rollout compatibility; use levelProgress. */
  readonly currentLevel: { readonly code: string; readonly name: string } | null;
  /** @deprecated Temporary backend rollout compatibility; use levelProgress. */
  readonly nextLevel: { readonly code: string; readonly name: string } | null;
  /** @deprecated Temporary backend rollout compatibility; use levelProgress. */
  readonly progress: {
    readonly patients: ReferralProgress;
    readonly clinics: ReferralProgress;
    readonly laboratories: ReferralProgress;
    readonly pharmacies: ReferralProgress;
  };
  readonly completed: boolean;
  readonly registeredDirectReferrals: number;
  readonly qualifiedDirectReferrals: number;
}
export interface ReferralHistoryItem {
  readonly targetType: ReferralTargetType;
  readonly status: ReferralStatus;
  readonly registeredAt: string;
  readonly qualifiedAt: string | null;
  readonly pointsEarned?: number;
}
export interface ReferralHistoryResponse {
  readonly items: ReferralHistoryItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}
export interface ReferralHistoryFilters {
  readonly page: number;
  readonly limit: number;
  readonly targetType?: ReferralTargetType;
  readonly status?: ReferralStatus;
  readonly referrerEmail?: string;
  readonly qualifiedFrom?: string;
  readonly qualifiedTo?: string;
}

export interface ReferralImpact {
  readonly referralCode: string;
  readonly balances: {
    readonly availablePoints: number;
    readonly reservedPoints: number;
    readonly lifetimeEarnedPoints: number;
    readonly lifetimeRedeemedPoints: number;
  };
  readonly levelProgress: MultiLevelReferralProgress;
  readonly qualifiedCounts: Record<ReferralTargetType, number>;
  readonly summary: {
    readonly registeredReferrals: number;
    readonly qualifiedReferrals: number;
    readonly pendingReferrals: number;
  };
  readonly inviteLinks: Record<ReferralTargetType, string>;
  readonly leaderboard: { readonly optedIn: boolean; readonly position: number | null };
}

export interface ReferralLeaderboardPreference {
  readonly publicLeaderboard: boolean;
}
