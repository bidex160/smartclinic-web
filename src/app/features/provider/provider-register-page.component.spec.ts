import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { ProviderRegisterPageComponent } from './provider-register-page.component';

describe('ProviderRegisterPageComponent', () => {
  it('validates and submits only the public provider registration contract without authenticating', async () => {
    const { component, api } = await setup();
    component.form.setValue({
      displayName: 'Ada Clinic',
      email: 'ADA@example.test',
      phone: '+2348000000000',
      password: 'a-secure-password',
      professionalReference: '',
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
    first.component.register();
    first.component.register();
    expect(first.api.register).toHaveBeenCalledOnce();
    TestBed.resetTestingModule();
    const conflict = await setup(() =>
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'raw identity' } })),
    );
    conflict.component.form.setValue(valid());
    conflict.component.register();
    expect(conflict.component.error()).toContain('already exists');
    expect(conflict.component.error()).not.toContain('raw identity');
  });
  it.each(['CLINIC', 'LABORATORY', 'PHARMACY'] as const)('captures %s referral intent without overriding provider selection', async (type) => {
    const { component, api } = await setup(() => of(profile()), { ref: 'SC-ABC123', type }); component.form.setValue(valid()); component.register();
    expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ referralCode: 'SC-ABC123', intendedReferralType: type, providerType: 'INDIVIDUAL' }));
  });
  it('keeps ISO state selection out of the provider registration payload', async () => {
    const { component, api } = await setup();
    component.onRegisterCountryChange('NG');
    component.onRegisterStateChange('OY');
    component.form.patchValue({ ...valid(), countryCode: 'NG', city: 'Kisi' });
    component.form.controls.stateOrRegion.setValue('Oyo');
    expect(component.registrationStateCode.value).toBe('OY');
    component.register();
    expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Kisi' }));
    component.onRegisterCountryChange('GH');
    expect(component.registrationStateCode.value).toBe('');
    expect(component.form.getRawValue()).toMatchObject({ stateOrRegion: '', city: '' });
  });
  async function setup(register = () => of(profile()), query: Record<string,string> = {}) {
    const api = { register: vi.fn(register) };
    await TestBed.configureTestingModule({
      imports: [ProviderRegisterPageComponent],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } }, { provide: ProviderOnboardingApiService, useValue: api }],
    }).compileComponents();
    return {
      component: TestBed.createComponent(ProviderRegisterPageComponent).componentInstance,
      api,
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
    status: 'PENDING',
    onboardingStatus: 'SUBMITTED',
    submittedAt: '2026-08-22',
    reviewedAt: null,
    reviewNote: null,
  };
}
