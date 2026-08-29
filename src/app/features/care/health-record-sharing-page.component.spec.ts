import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { HealthRecordSharingPageComponent } from './health-record-sharing-page.component';

describe('HealthRecordSharingPageComponent', () => {
  it('renders authoritative scope/state labels and only allows active grants to be revoked', async () => {
    const grants = [
      { reference: 'SC-CRG-1', provider: { providerReference: 'SCPR-1', displayName: 'Prime Clinic', providerType: 'CLINIC' }, scope: 'ALL_RECORDS', recordType: null, clinicalRecord: null, grantedAt: '2026-08-01T10:00:00Z', expiresAt: null, revokedAt: null, status: 'ACTIVE', createdAt: '', updatedAt: '' },
      { reference: 'SC-CRG-2', provider: { providerReference: 'SCPR-2', displayName: 'Old Clinic', providerType: 'CLINIC' }, scope: 'RECORD_TYPE', recordType: 'CONSULTATION', clinicalRecord: null, grantedAt: '2026-07-01T10:00:00Z', expiresAt: '2026-07-02T10:00:00Z', revokedAt: null, status: 'EXPIRED', createdAt: '', updatedAt: '' },
    ];
    await TestBed.configureTestingModule({ imports: [HealthRecordSharingPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listAccessGrants: () => of({ items: grants }) } }] }).compileComponents();
    const fixture: ComponentFixture<HealthRecordSharingPageComponent> = TestBed.createComponent(HealthRecordSharingPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('All finalized health records'); expect(fixture.nativeElement.textContent).toContain('Consultation records'); expect(fixture.nativeElement.textContent).toContain('Expired');
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
  });
});
