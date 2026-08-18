import { MatchingQueueFundingStatus, MatchingQueueReadiness } from './admin-matching-queue.model';
import { BookingStatus } from './admin-provider-assignment.model';
import { PublicBookingFundingAttemptStatus } from './public-booking.model';
import { ProviderOfferStatus } from './provider-offer.model';

export type AdminBookingFundingType = 'SELF' | 'FAMILY' | 'SPONSOR' | 'ORGANISATION' | 'OTHER';

export interface AdminBookingDetail {
  readonly bookingReference: string;
  readonly status: BookingStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly package: { readonly code: string; readonly name: string };
  readonly fulfilmentMode: { readonly code: string; readonly name: string };
  readonly participant: { readonly givenName: string; readonly familyName: string };
  readonly bookerContact: {
    readonly givenName: string | null;
    readonly familyName: string | null;
    readonly email: string | null;
    readonly phone: string | null;
  };
  readonly preferredDate: string | null;
  readonly preferredTimeFrom: string | null;
  readonly preferredTimeTo: string | null;
  readonly preferredTimezone: string | null;
  readonly locationNote: string | null;
  readonly quotedAmount: string | null;
  readonly quotedCurrency: string | null;
  readonly funding: {
    readonly fundingStatus: MatchingQueueFundingStatus | null;
    readonly fundingType: AdminBookingFundingType | null;
    readonly amount: string | null;
    readonly currency: string | null;
  };
  readonly payment: {
    readonly status: PublicBookingFundingAttemptStatus | null;
    readonly paymentReference: string | null;
    readonly paidAt: string | null;
  };
  readonly assignment: {
    readonly assignmentId: string | null;
    readonly assignmentStatus: ProviderOfferStatus | null;
    readonly providerName: string | null;
    readonly offeredAt: string | null;
    readonly acceptedAt: string | null;
    readonly confirmedAt: string | null;
    readonly expiresAt: string | null;
  };
  readonly readiness: MatchingQueueReadiness;
}
