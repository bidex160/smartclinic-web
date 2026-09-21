import { ReferralStatus, ReferralTargetType } from './referral.model';

export interface BuilderReferralLevel {
  readonly code: string;
  readonly name: string;
  readonly ordinal: number;
}

export interface BuilderProgressItem {
  readonly category: ReferralTargetType;
  readonly qualified: number;
  readonly required: number;
  readonly remaining: number;
  readonly completed: boolean;
}

export interface BuilderRecentReferral {
  readonly reference: string;
  readonly name: string;
  readonly type: ReferralTargetType;
  readonly status: ReferralStatus;
  readonly createdAt: string;
}

export interface BuilderDashboard {
  readonly referralCode: string;
  readonly referralUrl: string;
  readonly currentLevel: BuilderReferralLevel | null;
  readonly nextLevel: BuilderReferralLevel | null;
  readonly progress: BuilderProgressItem[];
  readonly qualifiedPatients: number;
  readonly qualifiedClinics: number;
  readonly qualifiedLaboratories: number;
  readonly qualifiedPharmacies: number;
  readonly recentReferrals: BuilderRecentReferral[];
}
