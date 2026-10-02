import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { HealthBasicsApiService } from '../../core/services/health-basics-api.service';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { ServiceCatalogueApiService } from '../../core/services/service-catalogue-api.service';
import { PatientProfilePageComponent } from './patient-profile-page.component';

describe('PatientProfilePageComponent', () => {
  const profile = (email: string | null) => ({
    user: { displayName: 'Ada Okafor', email },
    patient: { patientReference: 'SCP-8K4M-27QD', givenName: 'Ada', familyName: 'Okafor', phone: '+2348012345678', dateOfBirth: null },
  });

  const emptyBasics = {
    bloodGroup: null, genotype: null, allergies: null, conditions: null,
    emergencyContactName: null, emergencyContactPhone: null, emergencyContactRelationship: null,
    source: 'SELF_REPORTED' as const, updatedAt: null,
  };

  const labTests = [
    { code: 'LAB_BLOOD_GROUP', standardPriceMinor: 250000, currency: 'NGN' },
    { code: 'LAB_GENOTYPE', standardPriceMinor: 300000, currency: 'NGN' },
    { code: 'LAB_FBC', standardPriceMinor: 900000, currency: 'NGN' },
  ];

  async function setup(email: string | null) {
    const dashboardApi = { updateProfile: vi.fn((body: Record<string, unknown>) => of({ ...profile(email), patient: { ...profile(email).patient, ...body } })) };
    const basicsApi = {
      get: vi.fn(() => of(emptyBasics)),
      update: vi.fn((body: Record<string, unknown>) => of({ ...emptyBasics, ...body, updatedAt: '2026-10-01T10:00:00Z' })),
    };
    await TestBed.configureTestingModule({
      imports: [PatientProfilePageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckResultsApiService, useValue: { getMyProfile: () => of(profile(email)) } },
        { provide: PatientDashboardApiService, useValue: dashboardApi },
        { provide: HealthBasicsApiService, useValue: basicsApi },
        { provide: ServiceCatalogueApiService, useValue: { list: () => of(labTests) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientProfilePageComponent);
    fixture.detectChanges();
    return { fixture, dashboardApi, basicsApi };
  }

  async function render(email: string | null) {
    const { fixture } = await setup(email);
    return fixture.nativeElement.textContent as string;
  }

  const click = (root: HTMLElement, text: string) =>
    ([...root.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => b.textContent?.trim() === text)!.click();

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

  it('gathers family, impact, insurance and notifications under Me', async () => {
    const text = await render('ada@example.test');
    expect(text).toContain('More for you');
    for (const label of ['Family & dependants', 'My Impact & referrals', 'Health Insurance / HMO', 'Notifications']) {
      expect(text).toContain(label);
    }
  });

  it('lets the patient edit their own details and saves through the profile API', async () => {
    const { fixture, dashboardApi } = await setup('ada@example.test');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).not.toContain('Profile editing is not available yet');

    click(element.querySelector('[aria-labelledby="profile-details-heading"]')!, 'Edit');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.patchValue({ givenName: '  Adaeze ', phone: '', dateOfBirth: '1992-04-12' });
    (element.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(dashboardApi.updateProfile).toHaveBeenCalledWith({ givenName: 'Adaeze', familyName: 'Okafor', phone: null, dateOfBirth: '1992-04-12' });
    expect(element.textContent).toContain('Adaeze');
    expect(element.textContent).toContain('12 April 1992');
  });

  it('adds health basics, sending blanks as cleared values', async () => {
    const { fixture, basicsApi } = await setup('ada@example.test');
    const element: HTMLElement = fixture.nativeElement;
    const card = element.querySelector('app-health-basics-card') as HTMLElement;
    expect(card.textContent).toContain('not clinically verified');
    click(card, 'Add details');
    fixture.detectChanges();

    const form = card.querySelector('form') as HTMLFormElement;
    (form.querySelector('select[formcontrolname="genotype"]') as HTMLSelectElement).value = 'AS';
    form.querySelector('select[formcontrolname="genotype"]')!.dispatchEvent(new Event('change'));
    const allergies = form.querySelector('input[formcontrolname="allergies"]') as HTMLInputElement;
    allergies.value = 'Penicillin';
    allergies.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(basicsApi.update).toHaveBeenCalledWith({
      bloodGroup: null, genotype: 'AS', allergies: 'Penicillin', conditions: null,
      emergencyContactName: null, emergencyContactPhone: null, emergencyContactRelationship: null,
    });
    expect(card.querySelector('[data-health-basics]')!.textContent).toContain('AS');
  });

  it('shows how to get tested when blood group or genotype is unknown, with no health details in the link', async () => {
    const { fixture } = await setup('ada@example.test');
    const panel = (fixture.nativeElement as HTMLElement).querySelector('[data-know-your-numbers]') as HTMLElement;
    expect(panel.textContent).toContain('Don’t know your blood group and genotype?');
    expect(panel.textContent).toContain("₦5,500.00 for both");
    const home = panel.querySelector('[data-test-at-home]') as HTMLAnchorElement;
    const lab = panel.querySelector('[data-test-at-lab]') as HTMLAnchorElement;
    expect(home.getAttribute('href')).toBe('/me/request-care?serviceCode=LAB_REQUEST&topic=blood-group-genotype&mode=HOME_VISIT');
    expect(lab.getAttribute('href')).toContain('mode=IN_PERSON');
    expect(panel.querySelector('app-help-options')).not.toBeNull();
  });

  it('links to the SmartClinic card', async () => {
    const { fixture } = await setup(null);
    expect(fixture.nativeElement.querySelector('[data-card-link]').getAttribute('href')).toBe('/me/card');
  });
});
