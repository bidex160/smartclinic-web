import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { HealthRecordSharingDetailPageComponent } from './health-record-sharing-detail-page.component';

describe('HealthRecordSharingDetailPageComponent', () => {
  it.each([
    ['ACTIVE', null, null, 'can access your all finalized health records'],
    ['REVOKED', null, '2026-09-03T10:00:00Z', 'This access was revoked'],
    ['EXPIRED', '2026-09-03T10:00:00Z', null, 'This access expired'],
  ])('renders authoritative %s access messaging', async (status, expiresAt, revokedAt, expected) => {
    const grant = { reference: 'SC-CRG-1', provider: { providerReference: 'SCPR-1', displayName: 'Prime Clinic', providerType: 'CLINIC' }, scope: 'ALL_RECORDS', recordType: null, clinicalRecord: null, grantedAt: '2026-09-01T10:00:00Z', expiresAt, revokedAt, status, createdAt: '', updatedAt: '' };
    await TestBed.configureTestingModule({ imports: [HealthRecordSharingDetailPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ reference: grant.reference }) } } }, { provide: ClinicalRecordsApiService, useValue: { getAccessGrant: vi.fn(() => of(grant)) } }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordSharingDetailPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(expected);
  });
});
