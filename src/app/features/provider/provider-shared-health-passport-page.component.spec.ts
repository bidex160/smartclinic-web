import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { ProviderSharedHealthPassportPageComponent } from './provider-shared-health-passport-page.component';

describe('ProviderSharedHealthPassportPageComponent', () => {
  const source = { provenance: 'REPORTED_BY_YOU', sourceDomain: 'GUIDED_SELF_CHECK', sourceReference: 'SC-GSC-1' } as const;
  const passport = {
    patient: { patientReference: 'SCP-AB12-CD34', displayName: 'Ada Okafor', dateOfBirth: '1990-01-01' },
    authorization: { includesHealthPassport: true, includesFinalizedClinicalRecords: false },
    guidedSelfChecks: [{ ...source, eventKey: 'SELF:1', type: 'SELF_CHECK_COMPLETED', occurredAt: '2026-09-01T10:00:00Z', title: 'Guided Self-Check completed', description: 'Questionnaire completed.', context: { classificationStatus: 'CLASSIFIED', classification: 'ROUTINE', patientMessageKey: null, nextAction: null, professionalReview: { required: false, status: null, completedAt: null } } }],
    reportedHealthHistory: [{ key: 'allergy_details', label: 'Allergies', answerState: 'KNOWN', value: ['Penicillin'], provenance: 'REPORTED_BY_YOU', sourceReference: 'SC-GSC-1', reportedAt: '2026-09-01T10:00:00Z' }],
    reportedMeasurements: [{ ...source, type: 'BLOOD_GLUCOSE', value: { value: 98 }, unit: 'mg/dL', recordedAt: '2026-09-01T10:00:00Z' }],
    healthChecks: [{ reference: 'SCB-1', package: { code: 'CUSTOM_PACKAGE', name: 'Custom Wellness' }, completedAt: '2026-09-02T10:00:00Z', provider: { providerReference: 'SCPR-1', displayName: 'Prime' }, fulfilmentMode: { code: 'PROVIDER_LOCATION', name: 'Provider location' }, clinicalWork: [{ code: 'A', name: 'Cholesterol', category: 'LAB', resultType: 'SINGLE_NUMERIC', unit: 'mg/dL', source: 'SELECTED_ADDON', requiresRecordedResult: true }, { code: 'BP', name: 'Blood pressure', category: 'VITALS', resultType: 'BLOOD_PRESSURE', unit: 'mmHg', source: 'INCLUDED_PACKAGE_CONTENT', requiresRecordedResult: true }, { code: 'REVIEW', name: 'Clinical review', category: 'SERVICE', resultType: 'NONE', unit: null, source: 'INCLUDED_PACKAGE_CONTENT', requiresRecordedResult: false }], results: [{ code: 'A', name: 'Cholesterol', category: 'LAB', resultType: 'SINGLE_NUMERIC', value: { value: 180 }, unit: 'mg/dL', recordedAt: '2026-09-02T10:00:00Z', provenance: 'CHECKED_BY_PROVIDER', sourceDomain: 'HEALTH_CHECK', sourceReference: 'SCB-1' }, { code: 'BP', name: 'Blood pressure', category: 'VITALS', resultType: 'BLOOD_PRESSURE', value: { systolic: 118, diastolic: 78 }, unit: 'mmHg', recordedAt: '2026-09-02T10:00:00Z', provenance: 'CHECKED_BY_PROVIDER', sourceDomain: 'HEALTH_CHECK', sourceReference: 'SCB-1' }] }],
    clinicalRecords: [],
  } as const;
  const route = { snapshot: { paramMap: convertToParamMap({ patientReference: 'SCP-AB12-CD34' }) } };

  it('renders dynamic Passport sections and does not imply standalone record access', async () => {
    const api = { getSharedHealthPassport: vi.fn(() => of(passport)) };
    await TestBed.configureTestingModule({ imports: [ProviderSharedHealthPassportPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: route }, { provide: ClinicalRecordsApiService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderSharedHealthPassportPageComponent); fixture.detectChanges(); const text = fixture.nativeElement.textContent;
    expect(api.getSharedHealthPassport).toHaveBeenCalledWith('SCP-AB12-CD34'); expect(text).toContain('Ada Okafor'); expect(text).toContain('Guided Self-Check completed'); expect(text).toContain('Patient reported'); expect(text).toContain('98 mg/dL'); expect(text).toContain('Custom Wellness'); expect(text).toContain('180 mg/dL'); expect(text).toContain('118/78 mmHg'); expect(text).toContain('Clinical work item; no numeric result.'); expect(text).toContain('standalone clinical records are not included'); expect(text).not.toContain('ESSENTIAL');
  });

  it('renders a safe error state', async () => {
    await TestBed.configureTestingModule({ imports: [ProviderSharedHealthPassportPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: route }, { provide: ClinicalRecordsApiService, useValue: { getSharedHealthPassport: () => throwError(() => new Error('denied')) } }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderSharedHealthPassportPageComponent); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Health Passport unavailable');
  });
});
