export type ReferralTargetType = 'PATIENT' | 'CLINIC' | 'LABORATORY' | 'PHARMACY';
export type ReferralStatus = 'REGISTERED' | 'QUALIFIED' | 'REJECTED' | 'CANCELLED';
export interface ReferralProgress { readonly qualified: number; readonly required: number }
export interface ReferralSummary {
  readonly referralCode: string;
  readonly links: Record<ReferralTargetType, string>;
  readonly availablePoints: number;
  readonly reservedPoints: number;
  readonly lifetimeEarnedPoints: number;
  readonly lifetimeRedeemedPoints: number;
  readonly currentLevel: { readonly code: string; readonly name: string } | null;
  readonly nextLevel: { readonly code: string; readonly name: string } | null;
  readonly progress: { readonly patients: ReferralProgress; readonly clinics: ReferralProgress; readonly laboratories: ReferralProgress; readonly pharmacies: ReferralProgress };
  readonly completed: boolean;
  readonly registeredDirectReferrals: number;
  readonly qualifiedDirectReferrals: number;
}
export interface ReferralHistoryItem { readonly targetType: ReferralTargetType; readonly status: ReferralStatus; readonly registeredAt: string; readonly qualifiedAt: string | null; readonly pointsEarned?: number }
export interface ReferralHistoryResponse { readonly items: ReferralHistoryItem[]; readonly page: number; readonly limit: number; readonly total: number; readonly totalPages: number }
export interface ReferralHistoryFilters { readonly page: number; readonly limit: number; readonly targetType?: ReferralTargetType; readonly status?: ReferralStatus; readonly referrerEmail?: string; readonly qualifiedFrom?: string; readonly qualifiedTo?: string }
