export type PatientBookingStatus =
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

export type PatientEncounterStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PatientPortalCategory =
  'AWAITING_PAYMENT' | 'UPCOMING_ACTIVE' | 'COMPLETED_HISTORY' | 'NEEDS_ATTENTION' | 'CLOSED';

export interface PatientHealthCheckHistoryItem {
  readonly bookingReference: string;
  readonly bookingStatus: PatientBookingStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly healthCheckPackage: { readonly code: string; readonly name: string };
  readonly fulfilmentMode: { readonly code: string; readonly name: string };
  readonly preferredDate: string | null;
  readonly preferredTimeFrom: string | null;
  readonly preferredTimeTo: string | null;
  readonly preferredTimezone: string | null;
  readonly confirmedSchedule: import('./booking-schedule.model').ConfirmedScheduleSummary | null;
  readonly visitAddressSummary: import('./public-booking.model').BookingVisitAddressSummary | null;
  readonly providerDisplayName: string | null;
  readonly encounterStatus: PatientEncounterStatus | null;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly hasCompletedResult: boolean;
  readonly portalCategory: PatientPortalCategory;
  readonly fundingStatus: import('./public-booking.model').PublicBookingFundingStatus | null;
  readonly checkoutOption: import('./public-booking.model').PublicBookingCheckoutOption | null;
  readonly paymentStatus: import('./public-booking.model').PublicBookingFundingAttemptStatus | null;
}

export interface PatientHealthCheckDetail extends PatientHealthCheckHistoryItem {
  readonly visitAddress: import('./public-booking.model').OperationalVisitAddress | null;
  readonly commercialConfiguration:
    import('./health-check-package.model').HealthCheckConfigurationQuote | null;
}

export interface PatientPortalProfile {
  readonly user: { readonly displayName: string; readonly email: string | null };
  readonly patient: {
    readonly patientReference: string;
    readonly givenName: string;
    readonly familyName: string;
    readonly phone: string | null;
    readonly dateOfBirth: string | null;
  };
}

export interface CreateSelfHealthCheckRequest {
  readonly configurationReference?: string;
  readonly healthCheckPackageId?: string;
  readonly fulfilmentModeId?: string;
  readonly preferredDate: string;
  readonly preferredTimeWindowStart: string;
  readonly preferredTimezone: string;
  readonly preferredLocationNote?: string;
  readonly visitAddress?: import('./public-booking.model').BookingVisitAddressInput;
}

export interface PatientHealthCheckHistoryResponse {
  readonly items: readonly PatientHealthCheckHistoryItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PatientHealthCheckHistoryFilters {
  readonly bookingStatus?: PatientBookingStatus;
  readonly encounterStatus?: PatientEncounterStatus;
  readonly page: number;
  readonly limit: number;
}
