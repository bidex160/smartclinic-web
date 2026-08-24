import { ProviderOfferStatus } from './provider-offer.model';

export type BookingStatus =
  | 'DRAFT'
  | 'AWAITING_FUNDING'
  | 'PENDING_PROVIDER_MATCH'
  | 'PROVIDER_ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'UNFULFILLABLE'
  | 'CANCELLED'
  | 'EXPIRED';

export interface AdminProviderAssignment {
  readonly assignmentId: string;
  readonly status: ProviderOfferStatus;
  readonly offeredAt: string;
  readonly expiresAt: string | null;
  readonly respondedAt: string | null;
  readonly acceptedAt: string | null;
  readonly confirmedAt: string | null;
  readonly bookingReference: string;
  readonly bookingStatus: BookingStatus;
  readonly healthCheckPackage: { readonly code: string; readonly name: string };
  readonly fulfilmentMode: { readonly code: string; readonly name: string };
  readonly participant: { readonly givenName: string; readonly familyName: string };
  readonly provider: { readonly id: string; readonly displayName: string };
  readonly preferredDate: string | null;
  readonly preferredTimeWindowStart: string | null;
  readonly preferredTimeWindowEnd: string | null;
  readonly preferredTimezone: string | null;
  readonly confirmedSchedule: import('./booking-schedule.model').ConfirmedScheduleSummary | null;
  readonly declineReason: string | null;
}

export interface AdminProviderAssignmentFilters {
  readonly bookingReference?: string;
  readonly providerId?: string;
  readonly status?: ProviderOfferStatus;
}

export interface MatchingResult {
  readonly bookingReference: string;
  readonly bookingStatus: BookingStatus;
  readonly outcome: 'OFFER_CREATED' | 'UNFULFILLABLE';
  readonly assignmentId: string | null;
  readonly assignmentStatus: ProviderOfferStatus | null;
  readonly offerExpiresAt: string | null;
}

export interface ExpireStaleOffersResult {
  readonly expiredCount: number;
  readonly continuedMatchingCount: number;
  readonly unfulfillableCount: number;
}

export interface ManualProviderAssignmentRequest {
  readonly providerId: string;
}

export interface OverrideProviderAssignmentRequest extends ManualProviderAssignmentRequest {
  readonly reason: string;
}

export interface ReassignProviderRequest {
  readonly reason: string;
  readonly providerId?: string;
}
