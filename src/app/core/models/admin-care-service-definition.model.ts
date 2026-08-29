import { ClinicalRecordType } from './clinical-record.model';

export interface AdminCareServiceDefinition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly clinicalRecordType: ClinicalRecordType | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateAdminCareServiceDefinition {
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
  readonly clinicalRecordType?: ClinicalRecordType | null;
}

export interface UpdateAdminCareServiceDefinition {
  readonly code?: string;
  readonly name?: string;
  readonly description?: string | null;
  readonly clinicalRecordType?: ClinicalRecordType | null;
  readonly isActive?: boolean;
}
