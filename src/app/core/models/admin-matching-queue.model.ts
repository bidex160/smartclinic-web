import { BookingStatus } from './admin-provider-assignment.model';
import { ProviderOfferStatus } from './provider-offer.model';

export type MatchingQueueReadiness =
  | 'READY'
  | 'FUNDING_INCOMPLETE'
  | 'INCOMPLETE_SCHEDULING'
  | 'ACTIVE_OFFER'
  | 'ACCEPTED_AWAITING_CONFIRMATION'
  | 'UNFULFILLABLE'
  | 'ALREADY_ASSIGNED';

export type MatchingQueueFundingStatus =
  'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED' | 'SETTLED';

export interface AdminMatchingQueueItem {
  readonly bookingReference: string;
  readonly bookingStatus: BookingStatus;
  readonly package: { readonly code: string; readonly name: string };
  readonly fulfilmentMode: { readonly code: string; readonly name: string };
  readonly participant: { readonly givenName: string; readonly familyName: string };
  readonly preferredDate: string | null;
  readonly preferredTimeFrom: string | null;
  readonly preferredTimeTo: string | null;
  readonly preferredTimezone: string | null;
  readonly fundingStatus: MatchingQueueFundingStatus | null;
  readonly quotedAmount: string | null;
  readonly quotedCurrency: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly currentAssignmentStatus: ProviderOfferStatus | null;
  readonly currentProviderName: string | null;
  readonly readiness: MatchingQueueReadiness;
}

export interface AdminMatchingQueueResponse {
  readonly items: AdminMatchingQueueItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface AdminMatchingQueueFilters {
  readonly bookingStatus?: BookingStatus;
  readonly packageId?: string;
  readonly fulfilmentModeId?: string;
  readonly preferredDate?: string;
  readonly providerAssignmentStatus?: ProviderOfferStatus;
  readonly bookingReference?: string;
  readonly page: number;
  readonly limit: number;
}
