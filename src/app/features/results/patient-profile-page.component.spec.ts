import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { PatientProfilePageComponent } from './patient-profile-page.component';

describe('PatientProfilePageComponent', () => {
  const profile = (email: string | null) => ({
    user: { displayName: 'Ada Okafor', email },
    patient: { patientReference: 'SCP-8K4M-27QD', givenName: 'Ada', familyName: 'Okafor', phone: '+2348012345678', dateOfBirth: null },
  });

  async function render(email: string | null) {
    await TestBed.configureTestingModule({
      imports: [PatientProfilePageComponent],
      providers: [{ provide: HealthCheckResultsApiService, useValue: { getMyProfile: () => of(profile(email)) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientProfilePageComponent);
    fixture.detectChanges();
    return fixture.nativeElement.textContent as string;
  }

  it('renders a purposeful fallback for a patient with no email', async () => {
    const text = await render(null);
    expect(text).toContain('Email');
    expect(text).toContain('Not provided');
    expect(text).not.toContain('null');
    expect(text).not.toContain('undefined');
  });

  it('renders an email-backed patient email unchanged', async () => {
    const text = await render('ada@example.test');
    expect(text).toContain('ada@example.test');
    expect(text).not.toContain('Not provided');
  });
});
