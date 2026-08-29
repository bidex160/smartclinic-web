export type ClinicalRecordType =
  | 'CONSULTATION'
  | 'LAB_RESULT'
  | 'IMAGING_RESULT'
  | 'PROCEDURE'
  | 'PHARMACY'
  | 'FOLLOW_UP'
  | 'OTHER';

export type ClinicalRecordStatus = 'DRAFT' | 'FINALIZED';

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
}

export type UpdateClinicalRecordRequest = Partial<CreateClinicalRecordRequest>;

