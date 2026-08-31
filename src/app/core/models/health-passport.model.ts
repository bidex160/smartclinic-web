import { GuidedSelfCheckNextAction } from './guided-self-check.model';
export type HealthPassportProvenance =
  'REPORTED_BY_YOU' | 'CHECKED_BY_PROVIDER' | 'CONFIRMED_BY_LABORATORY';
export type HealthPassportTimelineType =
  | 'SELF_CHECK_COMPLETED'
  | 'HEALTH_CHECK_COMPLETED'
  | 'GENERAL_CARE_COMPLETED'
  | 'CLINICAL_RECORD_FINALIZED'
  | 'PRESCRIPTION_ISSUED'
  | 'MEDICATION_DISPENSED';
export interface HealthPassportMeasurement {
  type: string;
  value: Record<string, unknown>;
  unit: string;
  recordedAt: string;
  provenance: HealthPassportProvenance;
  sourceDomain: string;
  sourceReference: string;
  provider?: { providerReference: string; displayName: string };
}
export interface HealthPassportTimelineItem {
  eventKey: string;
  type: HealthPassportTimelineType;
  occurredAt: string;
  title: string;
  description: string;
  sourceDomain: string;
  sourceReference: string;
  provenance?: HealthPassportProvenance;
  context?: Record<string, unknown>;
}
export interface HealthPassportOverview {
  patient: {
    patientReference: string;
    givenName: string;
    familyName: string;
    displayName: string;
    dateOfBirth: string | null;
  };
  summary: {
    completedSelfChecks: number;
    completedHealthChecks: number;
    completedGeneralCareEncounters: number;
    finalizedClinicalRecords: number;
    issuedPrescriptions: number;
    completedDispensings: number;
  };
  latestMeasurements: readonly HealthPassportMeasurement[];
  reportedHealthHistory: readonly {
    key: string;
    label: string;
    answerState: string;
    value: unknown;
    provenance: HealthPassportProvenance;
    sourceReference: string;
    reportedAt: string;
  }[];
  recentChecks: {
    selfChecks: readonly Record<string, unknown>[];
    healthChecks: readonly Record<string, unknown>[];
  };
  recentMedicationContext: readonly {
    orderReference: string;
    issuedAt: string;
    context: string;
    provider: { providerReference: string; displayName: string };
    medicines: readonly {
      name: string;
      strength: string | null;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
  }[];
  currentNextAction: GuidedSelfCheckNextAction | null;
  recentActivity: readonly HealthPassportTimelineItem[];
}
export interface HealthPassportTimeline {
  items: readonly HealthPassportTimelineItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
