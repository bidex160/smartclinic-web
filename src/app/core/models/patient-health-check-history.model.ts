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
  readonly providerDisplayName: string | null;
  readonly encounterStatus: PatientEncounterStatus | null;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly hasCompletedResult: boolean;
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
