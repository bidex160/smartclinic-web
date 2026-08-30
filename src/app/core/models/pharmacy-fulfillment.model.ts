export type ClinicalOrderType =
  'PRESCRIPTION' | 'LABORATORY' | 'IMAGING' | 'REFERRAL' | 'PROCEDURE';
export type ClinicalOrderStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';
export type ClinicalOrderFulfillmentStatus = 'PROPOSED' | 'SELECTED' | 'ACCEPTED' | 'CANCELLED';
export type PharmacyQuoteStatus =
  'DRAFT' | 'SUBMITTED' | 'ACCEPTED_BY_PATIENT' | 'EXPIRED' | 'CANCELLED';
export type PharmacyQuoteItemAvailability = 'AVAILABLE' | 'UNAVAILABLE';
export type PharmacyFundingStatus =
  'PENDING' | 'PAID' | 'SATISFIED_FREE' | 'CANCELLED' | 'REQUIRES_REFUND_REVIEW';
export type PharmacyDispensingStatus =
  | 'READY_TO_DISPENSE'
  | 'DISPENSING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REQUIRES_REFUND_REVIEW';
export type ProviderServiceUnitType =
  'GENERAL' | 'PHARMACY' | 'LABORATORY' | 'RADIOLOGY' | 'PROCEDURE' | 'SPECIALIST' | 'OTHER';

export interface PrescriptionItem {
  readonly medicationName: string;
  readonly strength: string | null;
  readonly dosage: string;
  readonly frequency: string;
  readonly duration: string | null;
  readonly quantity: string | null;
  readonly route: string | null;
  readonly instructions: string | null;
  readonly sortOrder: number;
}
export interface PrescriptionDetail {
  readonly notes: string | null;
  readonly items: readonly PrescriptionItem[];
}
export interface ClinicalOrder {
  readonly reference: string;
  readonly type: ClinicalOrderType;
  readonly status: ClinicalOrderStatus;
  readonly clinicalNote: string | null;
  readonly orderingProvider: {
    readonly providerReference: string;
    readonly displayName: string;
    readonly providerType?: string;
  };
  readonly careRequestReference: string;
  readonly careAppointmentReference: string;
  readonly clinicalRecordReference?: string;
  readonly issuedAt: string | null;
  readonly cancelledAt: string | null;
  readonly cancellationReason: string | null;
  readonly prescription: PrescriptionDetail | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface ClinicalOrderPage {
  readonly items: readonly ClinicalOrder[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}
export interface UpsertPrescriptionRequest {
  readonly clinicalNote?: string | null;
  readonly notes?: string | null;
  readonly items: readonly Omit<PrescriptionItem, 'sortOrder'>[];
}

export interface FulfillmentDirectoryItem {
  readonly providerReference: string;
  readonly displayName: string;
  readonly providerType: string;
  readonly providerServiceUnitReference: string;
  readonly unitName: string;
  readonly capabilityType: 'PHARMACY';
  readonly location: {
    readonly city: string;
    readonly stateOrRegion: string;
    readonly countryCode: string;
  };
}
export interface FulfillmentDirectoryPage {
  readonly items: readonly FulfillmentDirectoryItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}
export interface ProviderOrderFulfillment {
  readonly reference: string;
  readonly status: ClinicalOrderFulfillmentStatus;
  readonly clinicalOrder: {
    readonly reference: string;
    readonly type: ClinicalOrderType;
    readonly issuedAt: string;
    readonly clinicalNote: string | null;
    readonly orderingProvider: { readonly providerReference: string; readonly displayName: string };
    readonly prescription: PrescriptionDetail | null;
  };
  readonly patient: {
    readonly patientReference: string;
    readonly givenName: string;
    readonly familyName: string;
  };
  readonly fulfiller: {
    readonly providerReference: string;
    readonly displayName: string;
    readonly serviceUnitReference: string;
    readonly serviceUnitName: string;
  };
  readonly recommendedServiceUnit: { readonly reference: string; readonly name: string } | null;
  readonly acceptedAt: string | null;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface ProviderOrderFulfillmentPage {
  readonly items: readonly ProviderOrderFulfillment[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PharmacyQuoteItem {
  readonly prescriptionItem: {
    readonly medicationName: string;
    readonly strength: string | null;
    readonly dosage: string;
    readonly frequency: string;
    readonly route: string | null;
    readonly instructions: string | null;
    readonly sortOrder: number;
  };
  readonly availability: PharmacyQuoteItemAvailability;
  readonly quotedMedicationLabel: string;
  readonly quantitySupplied: number;
  readonly unitPriceMinor: number;
  readonly lineTotalMinor: number;
  readonly note: string | null;
}
export interface PharmacyQuote {
  readonly reference: string;
  readonly status: PharmacyQuoteStatus;
  readonly totalMinor: number;
  readonly currency: string;
  readonly expiresAt: string;
  readonly submittedAt: string | null;
  readonly acceptedAt: string | null;
  readonly pharmacy: {
    readonly providerReference: string;
    readonly displayName: string;
    readonly serviceUnitReference: string;
    readonly serviceUnitName: string;
  };
  readonly items: readonly PharmacyQuoteItem[];
}
export interface UpsertPharmacyQuoteRequest {
  readonly currency: string;
  readonly expiresAt: string;
  readonly items: readonly {
    readonly sortOrder: number;
    readonly availability: PharmacyQuoteItemAvailability;
    readonly quantitySupplied: number;
    readonly unitPriceMinor: number;
    readonly note?: string | null;
  }[];
}
export interface PatientOrderFulfillment {
  readonly reference: string;
  readonly status: ClinicalOrderFulfillmentStatus;
  readonly clinicalOrder: {
    readonly reference: string;
    readonly type: ClinicalOrderType;
    readonly status: ClinicalOrderStatus;
    readonly prescription: PrescriptionDetail | null;
  };
  readonly pharmacy: {
    readonly providerReference: string;
    readonly displayName: string;
    readonly serviceUnitReference: string;
    readonly serviceUnitName: string;
  };
  readonly quote: PharmacyQuote | null;
  readonly funding: {
    readonly status: PharmacyFundingStatus;
    readonly amountMinor: number;
    readonly currency: string;
    readonly satisfied: boolean;
  } | null;
  readonly dispensing: {
    readonly status: PharmacyDispensingStatus;
    readonly fulfillmentMethod: 'PICKUP';
    readonly startedAt: string | null;
    readonly readyAt: string | null;
    readonly completedAt: string | null;
  } | null;
}
export interface PharmacyFundingResponse {
  readonly quoteReference: string;
  readonly fundingRequired: boolean;
  readonly amountMinor: number;
  readonly currency: string;
  readonly fundingStatus: PharmacyFundingStatus;
  readonly paid: boolean;
  readonly attemptStatus: string | null;
  readonly checkoutUrl: string | null;
  readonly accessCode: string | null;
}

export interface ProviderServiceUnit {
  readonly reference: string;
  readonly code: string;
  readonly name: string;
  readonly type: ProviderServiceUnitType;
  readonly description: string | null;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly location: {
    readonly locationReference: string;
    readonly name: string;
    readonly city: string;
    readonly stateOrRegion: string;
    readonly countryCode: string;
  } | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface ProviderServiceUnitPage {
  readonly items: readonly ProviderServiceUnit[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}
export interface UpsertProviderServiceUnitRequest {
  readonly code: string;
  readonly name: string;
  readonly type: ProviderServiceUnitType;
  readonly description?: string | null;
  readonly providerLocationReference?: string | null;
}
