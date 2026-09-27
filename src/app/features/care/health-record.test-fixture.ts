import { ClinicalRecord } from '../../core/models/clinical-record.model';

export function clinicalRecordFixture(): ClinicalRecord {
  return {
    reference: 'SC-CLR-ABC',
    recordType: 'CONSULTATION',
    title: 'Consultation outcome',
    summary: 'Summary',
    status: 'FINALIZED',
    occurredAt: '2026-08-29T08:00:00Z',
    finalizedAt: '2026-08-29T09:00:00Z',
    provider: {
      providerReference: 'SCPR-1',
      displayName: 'Example Clinic',
      providerType: 'CLINIC',
    },
    careRequestReference: 'SC-CARE-1',
    careAppointmentReference: 'SC-APT-1',
    service: { code: 'GENERAL_CONSULTATION', name: 'General Consultation' },
    consultation: {
      presentingComplaint: 'Pain',
      historyOfPresentingComplaint: null,
      observations: null,
      assessment: 'Stable',
      diagnosis: 'Example',
      plan: 'Rest',
      followUpInstructions: 'Return if worse',
    },
    documentation: null,
    structuredData: null,
    attachments: [],
    createdAt: '2026-08-29T08:00:00Z',
    updatedAt: '2026-08-29T09:00:00Z',
  };
}
