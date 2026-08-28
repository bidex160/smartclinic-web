export type CareDeliveryMode = 'IN_PERSON' | 'VIRTUAL' | 'HOME_VISIT';

export interface CareServiceDefinition {
  readonly id?: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly providerCount: number;
}
export interface ProviderCareServiceDefinition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
}
export interface ProviderCareServiceOffering {
  readonly id: string;
  readonly careServiceDefinitionId: string;
  readonly definition: ProviderCareServiceDefinition;
  readonly descriptionOverride: string | null;
  readonly supportsAppointmentRequests: boolean;
  readonly deliveryOptions: readonly ProviderCareServiceStoredDeliveryOption[];
  readonly supportsFastTrack: boolean;
  readonly fastTrackFeeMinor: string | null;
  readonly fastTrackCurrency: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface ProviderCareServiceDeliveryOption {
  readonly deliveryMode: CareDeliveryMode;
  readonly priceMinor: number;
  readonly currency: string;
}
export interface ProviderCareServiceStoredDeliveryOption {
  readonly deliveryMode: CareDeliveryMode;
  readonly priceMinor: string;
  readonly currency: string;
}
export interface CreateProviderCareServiceOffering {
  readonly careServiceDefinitionId: string;
  readonly description?: string | null;
  readonly supportsAppointmentRequests?: boolean;
  readonly deliveryOptions: readonly ProviderCareServiceDeliveryOption[];
  readonly supportsFastTrack?: boolean;
  readonly fastTrackFeeMinor?: number | null;
  readonly fastTrackCurrency?: string | null;
}
export type UpdateProviderCareServiceOffering = Omit<
  CreateProviderCareServiceOffering,
  'careServiceDefinitionId'
>;
export interface PublicProviderCareService {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly supportsAppointmentRequests: boolean;
  readonly deliveryOptions: readonly ProviderCareServiceDeliveryOption[];
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
  readonly deliveryMode?: CareDeliveryMode;
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
  readonly deliveryMode: CareDeliveryMode;
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
  readonly service: {
    readonly code: string;
    readonly name: string;
    readonly price: { readonly priceMinor: number; readonly currency: string } | null;
  };
  readonly deliveryMode: CareDeliveryMode;
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
  readonly appointment: CareRequestAppointmentSummary | null;
}
export interface CareRequestAppointmentSummary {
  readonly reference: string;
  readonly status: CareAppointmentStatus;
  readonly deliveryMode: CareDeliveryMode;
  readonly hasMeetingLink: boolean;
  readonly scheduledDate?: string;
  readonly scheduledTimeFrom?: string;
  readonly scheduledTimeTo?: string;
  readonly timezone?: string;
  readonly providerLocation?: CareAppointmentLocation | null;
}
export interface CareRequestPage {
  readonly items: readonly CareRequest[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export type CareChatScope = 'patient' | 'provider';
export type CareChatSenderType = 'PATIENT' | 'PROVIDER';
export interface CareChatParticipant {
  readonly displayName: string;
  readonly participantType?: CareChatSenderType;
}
export interface CareChatAppointmentSummary {
  readonly reference: string;
  readonly scheduledDate: string;
  readonly scheduledTimeFrom: string;
  readonly scheduledTimeTo: string;
  readonly timezone: string;
  readonly deliveryMode: CareDeliveryMode;
}
export interface CareChatDetail {
  readonly reference: string;
  readonly careRequestReference: string;
  readonly canSendMessages: boolean;
  readonly unreadCount: number;
  readonly participant: CareChatParticipant;
  readonly service: { readonly code: string; readonly name: string };
  readonly appointment: CareChatAppointmentSummary | null;
}
export interface CareChatMessage {
  readonly senderType: CareChatSenderType;
  readonly body: string;
  readonly createdAt: string;
  readonly readAt: string | null;
}
export interface CareChatMessagesPage {
  readonly items: readonly CareChatMessage[];
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

export type CareAppointmentStatus =
  'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export interface ScheduleCareAppointmentRequest {
  readonly scheduledDate: string;
  readonly scheduledTimeFrom: string;
  readonly scheduledTimeTo: string;
  readonly timezone: string;
  readonly providerLocationReference?: string;
  readonly notes?: string;
}
export interface CareAppointmentLocation {
  readonly locationReference: string;
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly stateOrRegion: string;
  readonly postalCode: string | null;
  readonly countryCode: string;
}
export interface CareAppointment {
  readonly appointmentReference: string;
  readonly careRequestReference: string;
  readonly status: CareAppointmentStatus;
  readonly deliveryMode: CareDeliveryMode;
  readonly service: { readonly code: string; readonly name: string };
  readonly provider: {
    readonly providerReference: string;
    readonly displayName: string;
    readonly providerType: string;
  };
  readonly providerLocation: CareAppointmentLocation | null;
  readonly scheduledDate: string;
  readonly scheduledTimeFrom: string;
  readonly scheduledTimeTo: string;
  readonly timezone: string;
  readonly notes: string | null;
  readonly meetingUrl: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CareAppointmentPage {
  readonly items: readonly CareAppointment[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}
export interface ProviderLocationOption {
  readonly locationReference: string;
  readonly name: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string | null;
  readonly countryCode: string;
  readonly isActive: boolean;
}
