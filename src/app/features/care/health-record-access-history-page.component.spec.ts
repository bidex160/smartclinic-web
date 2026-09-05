import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { HealthRecordAccessHistoryPageComponent } from './health-record-access-history-page.component';

describe('HealthRecordAccessHistoryPageComponent', () => {
  it('renders actual provider access without manufacturing grant lifecycle events', async () => {
    const item = { provider: { providerReference: 'SCPR-1', displayName: 'Prime Clinic', providerType: 'CLINIC' }, sourceDomain: 'CLINICAL_RECORD', sourceReference: 'SC-CLR-1', clinicalRecord: { reference: 'SC-CLR-1', title: 'Lab result', recordType: 'LAB_RESULT' }, action: 'VIEW', createdAt: '2026-09-04T10:00:00Z' };
    await TestBed.configureTestingModule({ imports: [HealthRecordAccessHistoryPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listAccessAudit: () => of({ items: [item], totalPages: 1 }) } }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordAccessHistoryPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Prime Clinic'); expect(fixture.nativeElement.textContent).toContain('Viewed record'); expect(fixture.nativeElement.textContent).not.toContain('Access granted to');
  });

  it('renders a Passport VIEW with a nullable clinical record', async () => {
    const item = { provider: { providerReference: 'SCPR-1', displayName: 'Prime Clinic', providerType: 'CLINIC' }, sourceDomain: 'HEALTH_PASSPORT', sourceReference: 'SCP-AB12-CD34', clinicalRecord: null, action: 'VIEW', createdAt: '2026-09-04T10:00:00Z' };
    await TestBed.configureTestingModule({ imports: [HealthRecordAccessHistoryPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listAccessAudit: () => of({ items: [item], totalPages: 1 }) } }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordAccessHistoryPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Health Passport viewed'); expect(fixture.nativeElement.textContent).toContain('SCP-AB12-CD34');
  });

  it('renders a truthful empty-access state', async () => {
    await TestBed.configureTestingModule({ imports: [HealthRecordAccessHistoryPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listAccessAudit: () => of({ items: [], totalPages: 0 }) } }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordAccessHistoryPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No provider access has been recorded yet.');
  });
});
