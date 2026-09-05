import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { ProviderHealthRecordAccessPageComponent } from './provider-health-record-access-page.component';

describe('ProviderHealthRecordAccessPageComponent', () => {
  it('submits Health Passport scope without record targeting fields', async () => {
    const createProviderAccessRequest = vi.fn((body) => of({ ...body, reference: 'SC-CRA-1', patient: { patientReference: body.patientReference }, provider: { providerReference: 'SCPR-1', displayName: 'Prime', providerType: 'CLINIC' }, recordType: null, clinicalRecordReference: null, requestedExpiresAt: null, status: 'PENDING', expiresAt: '', respondedAt: null, approvedGrantReference: null, createdAt: '', updatedAt: '' }));
    await TestBed.configureTestingModule({ imports: [ProviderHealthRecordAccessPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listProviderAccessRequests: () => of({ items: [] }), createProviderAccessRequest } }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderHealthRecordAccessPageComponent); const component = fixture.componentInstance; component.showForm.set(true); fixture.detectChanges();
    component.form.patchValue({ patientReference: 'SCP-AB12-CD34', scope: 'HEALTH_PASSPORT', recordType: 'LAB_RESULT', clinicalRecordReference: 'SC-CLR-OLD', reason: 'Coordinate care' }); component.submit();
    expect(createProviderAccessRequest).toHaveBeenCalledWith({ patientReference: 'SCP-AB12-CD34', scope: 'HEALTH_PASSPORT', reason: 'Coordinate care' });
    expect(fixture.nativeElement.textContent).toContain('Health Passport');
  });
});
