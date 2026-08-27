import { PublicBookingFundingStatus } from './public-booking.model';

export type HealthCheckRewardRedemptionStatus = 'RESERVED' | 'SETTLED' | 'RELEASED' | 'CANCELLED';

export interface ActiveHealthCheckRewardRedemption {
  readonly pointsReserved: number;
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
}

export interface AppliedHealthCheckRewardRedemption {
  readonly bookingReference: string;
  readonly bookingTotal: string;
  readonly pointsReserved: number;
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
