import { ClinicalOrder, PrescriptionItem } from './pharmacy-fulfillment.model';

export type DirectOrderType = 'PRESCRIPTION' | 'LABORATORY' | 'IMAGING' | 'REFERRAL';

export interface DirectOrderPatient {
  readonly patientReference: string;
  /** First name and initial only, to confirm the right person. */
  readonly displayName: string;
}

export interface DirectDiagnosticItemInput {
  readonly name: string;
  readonly code?: string | null;
  readonly instructions?: string | null;
}

export interface CreateDirectOrderRequest {
  readonly patientReference: string;
  readonly type: DirectOrderType;
  readonly clinicalNote?: string | null;
  readonly prescriptionItems?: readonly Omit<PrescriptionItem, 'sortOrder'>[];
  readonly diagnosticItems?: readonly DirectDiagnosticItemInput[];
}

export type DirectOrder = ClinicalOrder;
