export type RewardWithdrawalStatus = 'REQUESTED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface RewardWithdrawal {
  readonly withdrawalReference: string;
  readonly points: number;
  readonly amount: string;
  readonly currency: string;
  readonly status: RewardWithdrawalStatus;
  readonly bankName: string;
  readonly maskedAccountNumber: string;
  readonly accountName: string;
  readonly requestedAt: string;
  readonly processingAt: string | null;
  readonly paidAt: string | null;
  readonly failedAt: string | null;
  readonly cancelledAt: string | null;
  readonly adminNote: string | null;
}

export interface AdminRewardWithdrawal extends Omit<RewardWithdrawal, 'maskedAccountNumber'> {
  readonly user?: { readonly displayName: string; readonly email: string };
  readonly accountNumber: string;
  readonly conversionRate: { readonly points: number; readonly amount: string };
  readonly externalReference: string | null;
}

export interface RewardWithdrawalHistoryEvent {
  readonly fromStatus: RewardWithdrawalStatus | null;
  readonly toStatus: RewardWithdrawalStatus;
  readonly reasonCode: string;
  readonly reasonNote: string | null;
  readonly createdAt: string;
}

export interface AdminRewardWithdrawalDetail extends AdminRewardWithdrawal {
  readonly history: RewardWithdrawalHistoryEvent[];
}

export interface RewardWithdrawalPage<T = RewardWithdrawal> {
  readonly items: T[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface CreateRewardWithdrawalRequest {
  readonly points: number;
  readonly bankName: string;
  readonly accountNumber: string;
  readonly accountName: string;
}

export interface AdminRewardWithdrawalFilters {
  readonly page: number;
  readonly limit: number;
  readonly status?: RewardWithdrawalStatus;
  readonly userEmail?: string;
  readonly reference?: string;
  readonly requestedFrom?: string;
  readonly requestedTo?: string;
}
