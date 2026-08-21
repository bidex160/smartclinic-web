export interface ConfirmedScheduleSummary {
  readonly date: string;
  readonly timeFrom: string;
  readonly timeTo: string;
  readonly timezone: string;
  readonly providerLocationName: string | null;
}

export interface AdminConfirmedSchedule {
  readonly date: string;
  readonly timeFrom: string;
  readonly timeTo: string;
  readonly timezone: string;
  readonly scheduledAt: string;
  readonly providerLocation: {
    readonly id: string;
    readonly name: string;
    readonly addressLine1: string;
    readonly addressLine2: string | null;
    readonly city: string;
    readonly state: string;
    readonly countryCode: string;
  } | null;
}

export interface ScheduleBookingRequest {
  readonly date: string;
  readonly timeFrom: string;
  readonly timeTo: string;
  readonly timezone: string;
  readonly providerLocationId?: string;
}

export interface ScheduleBookingResponse {
  readonly bookingReference: string;
  readonly bookingStatus: 'SCHEDULED';
  readonly scheduledDate: string;
  readonly scheduledTimeFrom: string;
  readonly scheduledTimeTo: string;
  readonly scheduledTimezone: string;
  readonly provider: { readonly displayName: string };
  readonly providerLocation: AdminConfirmedSchedule['providerLocation'];
  readonly assignmentStatus: 'CONFIRMED';
}

export interface AdminProviderCapability {
  readonly id: string;
  readonly providerId: string;
  readonly healthCheckPackageId: string;
  readonly fulfilmentModeId: string;
  readonly isActive: boolean;
  readonly providerLocationIds: readonly string[];
}

export interface AdminProviderLocation {
  readonly id: string;
  readonly providerId: string;
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly state: string;
  readonly countryCode: string;
  readonly isActive: boolean;
}
