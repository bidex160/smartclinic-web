import { PublicBookingFundingStatus } from './public-booking.model';

export type HealthCheckRewardRedemptionStatus = 'RESERVED' | 'SETTLED' | 'RELEASED' | 'CANCELLED';

/** REFERRAL points are cash-backed; WELLNESS points are earned for healthy habits and only reduce a Health Check. */
export type RewardPointSource = 'REFERRAL' | 'WELLNESS';

export interface WellnessPointsPreview {
  readonly availablePoints: number;
  readonly minimumPoints: number;
  /** 0 when the patient doesn't yet have enough to use. */
  readonly maximumRedeemablePoints: number;
  /** Money value of one point, e.g. "5.00". */
  readonly valuePerPoint: string;
  readonly maxPercent: number;
}

export interface ActiveHealthCheckRewardRedemption {
  readonly pointsReserved: number;
  readonly pointSource?: RewardPointSource;
  readonly pointsAmount: string;
  readonly remainingExternalAmount: string;
  readonly currency: string;
  readonly status: HealthCheckRewardRedemptionStatus;
}

export interface HealthCheckRewardPreview {
  readonly availablePoints: number;
  readonly maximumRedeemablePoints: number;
  readonly bookingOutstandingAmount: string;
  readonly currency: string;
  readonly activeRedemption: ActiveHealthCheckRewardRedemption | null;
  readonly referralConfigured?: boolean;
  readonly wellness?: WellnessPointsPreview | null;
}

export interface AppliedHealthCheckRewardRedemption {
  readonly bookingReference: string;
  readonly bookingTotal: string;
  readonly pointsReserved: number;
  readonly pointSource?: RewardPointSource;
  readonly pointsAmount: string;
  readonly remainingExternalAmount: string;
  readonly currency: string;
  readonly redemptionStatus: HealthCheckRewardRedemptionStatus;
  readonly fundingStatus: PublicBookingFundingStatus;
  readonly requiresExternalPayment: boolean;
}

export interface ReleasedHealthCheckRewardRedemption {
  readonly bookingReference: string;
  readonly redemptionStatus: 'RELEASED';
  readonly releasedPoints: number;
}
