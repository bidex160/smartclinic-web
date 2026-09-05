import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { HealthRecordAccessRequestsPageComponent } from './health-record-access-requests-page.component';

describe('HealthRecordAccessRequestsPageComponent', () => {
  it('explains Passport-only access and preserves the backend connection gate', async () => {
    const request = { reference: 'SC-CRA-1', patient: { patientReference: 'SCP-AB12-CD34' }, provider: { providerReference: 'SCPR-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', displayName: 'Lab Two', providerType: 'LABORATORY' }, scope: 'HEALTH_PASSPORT', recordType: null, clinicalRecordReference: null, reason: 'Coordinate care', requestedExpiresAt: null, status: 'PENDING', expiresAt: '', respondedAt: null, approvedGrantReference: null, connection: { eligible: false, reference: null, status: null }, createdAt: '2026-09-01T10:00:00Z', updatedAt: '' } as const;
    const approveAccessRequest = vi.fn();
    await TestBed.configureTestingModule({ imports: [HealthRecordAccessRequestsPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listPatientAccessRequests: () => of({ items: [request] }), approveAccessRequest } }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordAccessRequestsPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('clinically relevant information from your Health Passport'); expect(fixture.nativeElement.textContent).toContain('Connect with provider'); expect(fixture.nativeElement.textContent).not.toContain('Approve access');
    fixture.componentInstance.approve(request); expect(approveAccessRequest).not.toHaveBeenCalled();
  });
});
