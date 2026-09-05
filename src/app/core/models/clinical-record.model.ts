export type ClinicalRecordType =
  | 'CONSULTATION'
  | 'LAB_RESULT'
  | 'IMAGING_RESULT'
  | 'PROCEDURE'
  | 'PHARMACY'
  | 'FOLLOW_UP'
  | 'OTHER';

export type ClinicalRecordStatus = 'DRAFT' | 'FINALIZED';

export type ClinicalDocumentationFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'BOOLEAN';
export type ClinicalDocumentationTemplateMode = 'STANDARD' | 'DEFAULT' | 'CUSTOM';
export type ClinicalDocumentationSnapshotSource = 'SYSTEM_DEFAULT' | 'PROVIDER_CUSTOM';
export type ClinicalStructuredValue = string | number | boolean | readonly string[] | null;
export type ClinicalStructuredData = Readonly<Record<string, ClinicalStructuredValue>>;

export interface ClinicalDocumentationField {
  readonly key: string;
  readonly label: string;
  readonly type: ClinicalDocumentationFieldType;
  readonly required: boolean;
  readonly core: boolean;
  readonly options?: readonly string[];
  readonly placeholder?: string;
  readonly sortOrder: number;
}

export interface ProviderCareServiceClinicalDocumentation {
  readonly clinicalRecordType: ClinicalRecordType;
  readonly templateMode: ClinicalDocumentationTemplateMode;
  readonly templateVersion: number | null;
  readonly fields: readonly ClinicalDocumentationField[];
}

export interface ClinicalRecordDocumentationSnapshot {
  readonly schemaVersion: 1;
  readonly source: ClinicalDocumentationSnapshotSource;
  readonly providerTemplateVersion: number | null;
  readonly fields: readonly ClinicalDocumentationField[];
}

export interface ClinicalRecordAttachment {
  readonly reference: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly resourceType: 'IMAGE' | 'DOCUMENT';
  readonly createdAt: string;
}

export interface ClinicalRecordAttachmentAccess {
  readonly url: string;
  readonly expiresAt: string;
}

export interface ClinicalConsultationDetail {
  readonly presentingComplaint: string | null;
  readonly historyOfPresentingComplaint: string | null;
  readonly observations: string | null;
  readonly assessment: string | null;
  readonly diagnosis: string | null;
  readonly plan: string | null;
  readonly followUpInstructions: string | null;
}

export interface ClinicalRecord {
  readonly reference: string;
  readonly recordType: ClinicalRecordType;
  readonly title: string;
  readonly summary: string | null;
  readonly status: ClinicalRecordStatus;
  readonly occurredAt: string;
  readonly finalizedAt: string | null;
  readonly provider: {
    readonly providerReference: string;
    readonly displayName: string;
    readonly providerType: string;
  };
  readonly careRequestReference: string | null;
  readonly careAppointmentReference: string | null;
  readonly service: { readonly code: string; readonly name: string } | null;
  readonly consultation: ClinicalConsultationDetail | null;
  readonly documentation: ClinicalRecordDocumentationSnapshot | null;
  readonly structuredData: ClinicalStructuredData | null;
  readonly attachments: readonly ClinicalRecordAttachment[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ClinicalRecordPage {
  readonly items: readonly ClinicalRecord[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export type ClinicalRecordAccessScope = 'ALL_RECORDS' | 'RECORD_TYPE' | 'SINGLE_RECORD';
export type ClinicalRecordAccessGrantStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type ClinicalRecordAccessAction = 'VIEW' | 'ATTACHMENT_ACCESS';
export type ClinicalRecordAccessRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED';
export type ClinicalRecordAccessConnectionStatus =
  | 'AWAITING_FUNDING' | 'SUBMITTED' | 'UNABLE_TO_VERIFY' | 'CONNECTED' | 'REJECTED' | 'CANCELLED';

export interface ClinicalRecordProviderSummary {
  readonly providerReference: string;
  readonly displayName: string;
  readonly providerType: string;
}

export interface ClinicalRecordAccessProvider {
  readonly providerReference: string;
  readonly displayName: string;
  readonly providerType: string;
  readonly location: {
    readonly city: string | null;
    readonly stateOrRegion: string | null;
    readonly countryCode: string | null;
  };
}

export interface ClinicalRecordAccessGrant {
  readonly reference: string;
  readonly provider: ClinicalRecordProviderSummary;
  readonly scope: ClinicalRecordAccessScope;
  readonly recordType: ClinicalRecordType | null;
  readonly clinicalRecord: Pick<ClinicalRecord, 'reference' | 'title' | 'recordType'> | null;
  readonly grantedAt: string;
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
  readonly status: ClinicalRecordAccessGrantStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateClinicalRecordAccessGrantRequest {
  readonly providerReference: string;
  readonly scope: ClinicalRecordAccessScope;
  readonly recordType?: ClinicalRecordType;
  readonly clinicalRecordReference?: string;
  readonly expiresAt?: string | null;
}

export interface CreateClinicalRecordAccessRequest {
  readonly patientReference: string;
  readonly scope: ClinicalRecordAccessScope;
  readonly recordType?: ClinicalRecordType;
  readonly clinicalRecordReference?: string;
  readonly reason: string;
  readonly requestedExpiresAt?: string | null;
}

export interface ClinicalRecordAccessRequest {
  readonly reference: string;
  readonly patient: { readonly patientReference: string };
  readonly provider: ClinicalRecordProviderSummary;
  readonly scope: ClinicalRecordAccessScope;
  readonly recordType: ClinicalRecordType | null;
  readonly clinicalRecordReference: string | null;
  readonly reason: string;
  readonly requestedExpiresAt: string | null;
  readonly status: ClinicalRecordAccessRequestStatus;
  readonly expiresAt: string;
  readonly respondedAt: string | null;
  readonly approvedGrantReference: string | null;
  readonly connection?: {
    readonly eligible: boolean;
    readonly reference: string | null;
    readonly status: ClinicalRecordAccessConnectionStatus | null;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ClinicalRecordAccessAudit {
  readonly provider: ClinicalRecordProviderSummary;
  readonly clinicalRecord: Pick<ClinicalRecord, 'reference' | 'title' | 'recordType'>;
  readonly action: ClinicalRecordAccessAction;
  readonly createdAt: string;
}

export interface ClinicalRecordAccessPage<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface SharedClinicalRecordSummary {
  readonly reference: string;
  readonly recordType: ClinicalRecordType;
  readonly title: string;
  readonly summary: string | null;
  readonly occurredAt: string;
  readonly finalizedAt: string;
  readonly provider: ClinicalRecordProviderSummary;
  readonly patient: { readonly displayName: string };
  readonly service: { readonly code: string; readonly name: string } | null;
}

export type SharedClinicalRecord = ClinicalRecord & {
  readonly patient: { readonly displayName: string };
};

export interface ClinicalConsultationDetailRequest {
  readonly presentingComplaint?: string | null;
  readonly historyOfPresentingComplaint?: string | null;
  readonly observations?: string | null;
  readonly assessment?: string | null;
  readonly diagnosis?: string | null;
  readonly plan?: string | null;
  readonly followUpInstructions?: string | null;
}

export interface CreateClinicalRecordRequest {
  readonly recordType: ClinicalRecordType;
  readonly title: string;
  readonly summary?: string | null;
  readonly consultation?: ClinicalConsultationDetailRequest;
  readonly structuredData?: ClinicalStructuredData | null;
}

export type UpdateClinicalRecordRequest = Partial<CreateClinicalRecordRequest>;
