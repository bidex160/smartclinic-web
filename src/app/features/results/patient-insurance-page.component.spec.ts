import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { HmoApiService } from '../../core/services/hmo-api.service';
import { PatientInsurancePageComponent } from './patient-insurance-page.component';

describe('PatientInsurancePageComponent', () => {
  it('records enrollment interest without presenting it as active coverage', async () => {
    const createEnrollmentLead = vi.fn(() => of({ id: 'lead-1', status: 'NEW' as const }));
    await TestBed.configureTestingModule({
      imports: [PatientInsurancePageComponent],
      providers: [
        {
          provide: HealthCheckResultsApiService,
          useValue: {
            getMyProfile: () => of({ patient: { patientReference: 'SCP-123' } }),
          },
        },
        {
          provide: HmoApiService,
          useValue: { listHmos: () => of([]), listPlans: () => of([]), createEnrollmentLead },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientInsurancePageComponent);
    const component = fixture.componentInstance;
    component.enrollmentConsent.set(true);

    component.submitInterest('hmo-1', '', '  Acme Ltd  ', '  Call after 4pm  ');

    expect(createEnrollmentLead).toHaveBeenCalledWith('SCP-123', {
      consentAcknowledged: true,
      preferredHmoId: 'hmo-1',
      employerOrganisation: 'Acme Ltd',
      notes: 'Call after 4pm',
    });
    expect(component.feedback()).toContain('no payment was taken');
  });
});
