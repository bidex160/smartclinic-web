export type PublicBookingRelationship = 'SELF' | 'FAMILY' | 'OTHER';

export interface PublicBookingRequest {
  readonly booker: {
    readonly givenName: string;
    readonly familyName: string;
    readonly email?: string;
    readonly phone: string;
  };
  readonly participant: {
    readonly relationship: PublicBookingRelationship;
    readonly givenName: string;
    readonly familyName: string;
    readonly dateOfBirth?: string;
    readonly phone?: string;
    readonly email?: string;
  };
  readonly booking: {
    readonly healthCheckPackageId: string;
    readonly fulfilmentModeId: string;
    readonly preferredDate?: string;
    readonly preferredTimeFrom?: string;
    readonly preferredTimeTo?: string;
    readonly locationNote?: string;
  };
}

export interface PublicBookingResponse {
  readonly bookingReference: string;
  readonly status: string;
  readonly healthCheckPackage: { readonly code: string; readonly name: string };
  readonly fulfilmentMode: { readonly code: string; readonly name: string };
  readonly participant: { readonly givenName: string; readonly familyName: string };
  readonly quotedAmount: string | null;
  readonly quotedCurrency: string | null;
  readonly preferredDate: string | null;
  readonly preferredTimeWindowStart: string | null;
  readonly preferredTimeWindowEnd: string | null;
  readonly preferredTimezone: string | null;
  readonly locationNote: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type PublicBookingFundingStatus =
  'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED' | 'SETTLED';

export type PublicBookingFundingAttemptStatus =
  | 'CREATED'
  | 'AWAITING_CUSTOMER_ACTION'
  | 'PENDING_CONFIRMATION'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface PublicBookingFundingResult {
  readonly bookingReference: string;
  readonly fundingStatus: PublicBookingFundingStatus;
  readonly attemptId: string | null;
  readonly attemptStatus: PublicBookingFundingAttemptStatus | null;
  readonly amount: string;
  readonly currency: string;
  readonly paymentReference: string | null;
}

export interface PublicBookingPaymentInitiationResult {
  readonly bookingReference: string;
  readonly paymentAttemptReference: string;
  readonly status: PublicBookingFundingAttemptStatus;
  readonly amount: string;
  readonly currency: string;
  readonly checkoutUrl: string | null;
  readonly accessCode: string | null;
}

export interface PublicBookingPaymentStatus {
  readonly bookingReference: string;
  readonly bookingStatus: string;
  readonly fundingStatus: PublicBookingFundingStatus | null;
  readonly paymentStatus: PublicBookingFundingAttemptStatus | null;
  readonly paymentAttemptReference: string | null;
  readonly amount: string | null;
  readonly currency: string | null;
  readonly paidAt: string | null;
}
