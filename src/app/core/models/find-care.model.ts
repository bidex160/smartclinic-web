export interface CareServiceDefinition {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly providerCount: number;
}
export interface PublicProviderCareService {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly priceMinor: number | null;
  readonly currency: string | null;
  readonly priceOnRequest: boolean;
  readonly supportsAppointmentRequests: boolean;
  readonly supportsFastTrack: boolean;
  readonly fastTrackFeeMinor: number | null;
  readonly fastTrackCurrency: string | null;
}
export interface PublicFindCareProvider {
  readonly providerReference: string;
  readonly displayName: string;
  readonly providerType: string;
  readonly location: {
    readonly city: string | null;
    readonly stateOrRegion: string | null;
    readonly countryCode: string | null;
  };
  readonly locations: readonly {
    readonly name: string;
    readonly addressLine1: string;
    readonly addressLine2: string | null;
    readonly city: string;
    readonly stateOrRegion: string;
    readonly postalCode: string | null;
    readonly countryCode: string;
  }[];
  readonly services: readonly PublicProviderCareService[];
}
export interface PublicFindCareProviderPage {
  readonly items: readonly PublicFindCareProvider[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}
export interface FindCareProviderFilters {
  readonly serviceCode?: string;
  readonly countryCode?: string;
  readonly stateOrRegion?: string;
  readonly city?: string;
  readonly page?: number;
  readonly limit?: number;
}

export type CareRequestStatus =
  | 'SUBMITTED'
  | 'MATCHING'
  | 'PROVIDER_SELECTED'
  | 'AWAITING_PROVIDER_RESPONSE'
  | 'PROVIDER_ACCEPTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DECLINED'
  | 'UNFULFILLABLE';
export type CareRequestContactMethod = 'EMAIL' | 'PHONE' | 'WHATSAPP';
export interface CreateCareRequest {
  readonly serviceCode: string;
  readonly preferredProviderReference?: string;
  readonly countryCode: string;
  readonly stateOrRegion: string;
  readonly city: string;
  readonly preferredDate?: string;
  readonly preferredTime?: string;
  readonly contactMethod: CareRequestContactMethod;
  readonly notes?: string;
}
export interface CareRequestProviderSummary {
  readonly providerReference: string;
  readonly displayName: string;
  readonly providerType: string;
  readonly location: {
    readonly city: string | null;
    readonly stateOrRegion: string | null;
    readonly countryCode: string | null;
  };
}
export interface CareRequest {
  readonly reference: string;
  readonly status: CareRequestStatus;
  readonly service: { readonly code: string; readonly name: string };
  readonly geography: {
    readonly countryCode: string;
    readonly stateOrRegion: string;
    readonly city: string;
  };
  readonly preferredProvider: CareRequestProviderSummary | null;
  readonly assignedProvider: CareRequestProviderSummary | null;
  readonly preferredDate: string | null;
  readonly preferredTime: string | null;
  readonly contactMethod: CareRequestContactMethod;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CareRequestPage {
  readonly items: readonly CareRequest[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export type FastTrackStatus =
  | 'SUBMITTED'
  | 'VERIFYING'
  | 'READY_FOR_PAYMENT'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';
export type FastTrackSource = 'SMARTCLINIC_CARE_REQUEST' | 'EXTERNAL_APPOINTMENT';
export interface CreateExternalFastTrack {
  readonly providerReference: string;
  readonly serviceCode: string;
  readonly externalAppointmentReference: string;
  readonly appointmentDate: string;
  readonly appointmentTime?: string;
  readonly department?: string;
  readonly doctorName?: string;
  readonly notes?: string;
}
export interface FastTrackRequest {
  readonly reference: string;
  readonly source: FastTrackSource;
  readonly status: FastTrackStatus;
  readonly provider: {
    readonly providerReference: string;
    readonly displayName: string;
    readonly providerType: string;
  };
  readonly service: { readonly code: string; readonly name: string };
  readonly careRequestReference: string | null;
  readonly externalAppointment: {
    readonly reference: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string | null;
    readonly department: string | null;
    readonly doctorName: string | null;
  } | null;
  readonly notes: string | null;
  readonly feeMinor: number;
  readonly currency: string;
  readonly paymentReady: boolean;
  readonly verifiedAt: string | null;
  readonly paidAt: string | null;
  readonly confirmedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface FastTrackRequestPage {
  readonly items: readonly FastTrackRequest[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}
export interface FastTrackPaymentStatus {
  readonly fastTrackReference: string;
  readonly fastTrackStatus: FastTrackStatus;
  readonly feeMinor: number;
  readonly amount: string;
  readonly currency: string;
  readonly paymentReady: boolean;
  readonly paymentAttemptStatus: string | null;
  readonly paymentReference: string | null;
  readonly checkoutUrl: string | null;
  readonly accessCode: string | null;
  readonly paidAt: string | null;
}
