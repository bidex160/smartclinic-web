import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { ProviderCredentialsApiService } from '../../core/services/provider-credentials-api.service';
import { FacilityOutreachApiService } from '../../core/services/facility-outreach-api.service';
import { ProviderRegisterPageComponent } from './provider-register-page.component';

describe('ProviderRegisterPageComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('validates and submits only the public provider registration contract without authenticating', async () => {
    const { component, api } = await setup();
    component.form.setValue({
      displayName: 'Ada Clinic',
      email: 'ADA@example.test',
      phone: '+2348000000000',
      password: 'a-secure-password',
      professionalReference: '',
      regulator: '',
      licenceNumber: '',
      providerType: 'CLINIC',
      countryCode: 'ng',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
    });
    component.register();
    expect(api.register).toHaveBeenCalledWith({
      displayName: 'Ada Clinic',
      email: 'ada@example.test',
      phone: '+2348000000000',
      password: 'a-secure-password',
      providerType: 'CLINIC',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
    });
    expect(component.result()?.onboardingStatus).toBe('SUBMITTED');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
  it('prevents duplicate submission and sanitizes duplicate conflicts', async () => {
    const pending = new Subject<any>();
    const first = await setup(() => pending);
    first.component.form.setValue(valid());
    first.component.chosenSpecialties.set(['GENERAL_PRACTICE']);
    first.component.register();
    first.component.register();
    expect(first.api.register).toHaveBeenCalledOnce();
    TestBed.resetTestingModule();
    const conflict = await setup(() =>
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'raw identity' } })),
    );
    conflict.component.form.setValue(valid());
    conflict.component.chosenSpecialties.set(['GENERAL_PRACTICE']);
    conflict.component.register();
    expect(conflict.component.error()).toContain('already exists');
    expect(conflict.component.error()).not.toContain('raw identity');
  });
  it.each(['CLINIC', 'LABORATORY', 'PHARMACY'] as const)('captures %s referral intent without overriding provider selection', async (type) => {
    const { component, api } = await setup(() => of(profile()), { ref: 'SC-ABC123', type }); component.form.setValue({ ...valid(), providerType: type === 'LABORATORY' ? 'DIAGNOSTIC_CENTRE' : type }); component.register();
    const providerType = type === 'LABORATORY' ? 'DIAGNOSTIC_CENTRE' : type;
    expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ referralCode: 'SC-ABC123', intendedReferralType: type, providerType }));
  });
  it('keeps ISO state selection out of the provider registration payload', async () => {
    const { component, api } = await setup();
    component.onRegisterCountryChange('NG');
    component.onRegisterStateChange('OY');
    component.form.patchValue({ ...valid(), countryCode: 'NG', city: 'Kisi' });
    component.form.controls.stateOrRegion.setValue('Oyo');
    component.chosenSpecialties.set(['GENERAL_PRACTICE']);
    expect(component.registrationStateCode.value).toBe('OY');
    component.register();
    expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Kisi' }));
    component.onRegisterCountryChange('GH');
    expect(component.registrationStateCode.value).toBe('');
    expect(component.form.getRawValue()).toMatchObject({ stateOrRegion: '', city: '' });
  });
  it('asks a doctor for a specialty, then sends specialties, licence and the invite token', async () => {
    const { component, api, credentials } = await setup(() => of(profile()), { invite: 'growth-token-1' });
    expect(credentials.regulators).toHaveBeenCalledWith('NG', 'INDIVIDUAL');
    component.form.setValue(valid());
    component.register();
    expect(api.register).not.toHaveBeenCalled();
    expect(component.specialtyError()).toBe(true);
    component.chosenSpecialties.set(['PEDIATRICS', 'GENERAL_PRACTICE']);
    component.primarySpecialty.set('PEDIATRICS');
    component.form.patchValue({ regulator: 'MDCN', licenceNumber: ' MDCN/R/123 ' });
    component.register();
    expect(api.register).toHaveBeenCalledWith(expect.objectContaining({
      specialtyCodes: ['PEDIATRICS', 'GENERAL_PRACTICE'], primarySpecialty: 'PEDIATRICS', regulator: 'MDCN', licenceNumber: 'MDCN/R/123', inviteToken: 'growth-token-1',
    }));
  });
  it('fills in a claimed facility and sends the claim token', async () => {
    const outreach = { preview: vi.fn(() => of({ displayName: 'Garki Hospital', facilityType: 'HOSPITAL', providerType: 'HOSPITAL', countryCode: 'NG', stateOrRegion: 'Federal Capital Territory', city: 'Garki', interestedPatients: 3, claimed: false })) };
    TestBed.overrideProvider(FacilityOutreachApiService, { useValue: outreach });
    const { component, api } = await setup(() => of(profile()), { claim: 'tok_abcdefghijklmnopqrstuv', type: 'HOSPITAL' });
    await new Promise((r) => setTimeout(r, 0));
    expect(component.claiming()).toEqual({ displayName: 'Garki Hospital', interestedPatients: 3 });
    expect(component.form.getRawValue()).toMatchObject({ displayName: 'Garki Hospital', providerType: 'HOSPITAL', countryCode: 'NG' });
    component.form.patchValue({ email: 'garki@example.test', phone: '+2348031234567', password: 'a-secure-password', stateOrRegion: 'Federal Capital Territory', city: 'Garki' });
    component.register();
    expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ claimToken: 'tok_abcdefghijklmnopqrstuv', displayName: 'Garki Hospital' }));
  });
  it('shows the server message when a licence is already used', async () => {
    const { component } = await setup(() => throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'This licence number is already linked to another SmartClinic account. Contact support if this is yours.' } })));
    component.form.setValue({ ...valid(), regulator: 'MDCN', licenceNumber: 'MDCN/R/1' });
    component.chosenSpecialties.set(['GENERAL_PRACTICE']);
    component.register();
    expect(component.error()).toContain('licence number is already linked');
  });
  it('defaults Rwanda provider onboarding and preserves market context through navigation', async () => {
    const { component, fixture } = await setup(() => of(profile()), { market: 'RW', lang: 'rw' });
    expect(component.form.controls.countryCode.value).toBe('RW');
    expect(component.phonePlaceholder).toContain('+250');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('header a').getAttribute('href')).toBe('/rw');
    component.result.set(profile() as any);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href^="/login"]').getAttribute('href')).toBe('/login?market=RW&lang=rw');
    expect(component.registerStates.map((state) => state.name)).toEqual([
      'City of Kigali', 'Eastern Province', 'Northern Province', 'Southern Province', 'Western Province',
    ]);
  });
  async function setup(register = () => of(profile()), query: Record<string,string> = {}) {
    const api = { register: vi.fn(register) };
    const credentials = {
      specialties: vi.fn(() => of([{ code: 'GENERAL_PRACTICE', name: 'General Practice / Family Medicine', group: 'Primary care' }, { code: 'PEDIATRICS', name: 'Pediatrics', group: 'Children' }])),
      regulators: vi.fn(() => of([{ code: 'MDCN', name: 'Medical and Dental Council of Nigeria' }, { code: 'OTHER', name: 'Another regulator' }])),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderRegisterPageComponent],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } }, { provide: ProviderOnboardingApiService, useValue: api }, { provide: ProviderCredentialsApiService, useValue: credentials }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderRegisterPageComponent);
    return {
      fixture,
      component: fixture.componentInstance,
      api,
      credentials,
    };
  }
});
function valid() {
  return {
    displayName: 'Ada',
    email: 'ada@example.test',
    phone: '+2348000000000',
    password: 'a-secure-password',
    professionalReference: '',
    regulator: '',
    licenceNumber: '',
    providerType: 'INDIVIDUAL' as const,
    countryCode: 'NG',
    stateOrRegion: 'Lagos',
    city: 'Ikeja',
  };
}
function profile() {
  return {
    ...valid(),
    professionalReference: null,
    status: 'ACTIVE',
    onboardingStatus: 'SUBMITTED',
    submittedAt: '2026-08-22',
    reviewedAt: null,
    reviewNote: null,
  };
}
