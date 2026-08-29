import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { ProviderSharedHealthRecordDetailPageComponent } from './provider-shared-health-record-detail-page.component';

describe('ProviderSharedHealthRecordDetailPageComponent', () => {
  it('renders consultation read-only and uses dedicated shared attachment access', async () => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
    const access = vi.fn(() => of({ url: 'https://files.example/result.pdf', expiresAt: '2026-08-29T12:00:00Z' }));
    const record = { reference: 'SC-CLR-1', title: 'Consultation', recordType: 'CONSULTATION', summary: null, status: 'FINALIZED', occurredAt: '2026-08-29T10:00:00Z', finalizedAt: '2026-08-29T11:00:00Z', provider: { providerReference: 'SCPR-ORIGIN', displayName: 'Origin Clinic', providerType: 'CLINIC' }, patient: { displayName: 'Ada O.' }, service: { code: 'GENERAL', name: 'General Consultation' }, consultation: { presentingComplaint: 'Headache', historyOfPresentingComplaint: null, observations: null, assessment: null, diagnosis: null, plan: null, followUpInstructions: null }, attachments: [{ reference: 'SC-CLA-1', originalName: 'result.pdf', mimeType: 'application/pdf', sizeBytes: 1000, resourceType: 'DOCUMENT', createdAt: '' },], careRequestReference: null, careAppointmentReference: null, createdAt: '', updatedAt: '' };
    await TestBed.configureTestingModule({ imports: [ProviderSharedHealthRecordDetailPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ reference: 'SC-CLR-1' }) } } }, { provide: ClinicalRecordsApiService, useValue: { getShared: () => of(record), getSharedAttachmentAccess: access } }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderSharedHealthRecordDetailPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Headache'); expect(fixture.nativeElement.textContent).toContain('Record created by'); expect(fixture.nativeElement.textContent).not.toContain('Edit'); expect(fixture.nativeElement.textContent).not.toContain('Finalize');
    fixture.componentInstance.open(record.attachments[0] as never); expect(access).toHaveBeenCalledWith('SC-CLR-1', 'SC-CLA-1');
  });
});
