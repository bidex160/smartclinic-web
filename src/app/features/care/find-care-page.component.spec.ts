import { ProviderCredentialsApiService } from '../../core/services/provider-credentials-api.service';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { FindCarePageComponent } from './find-care-page.component';
import { DependantsApiService } from '../../core/services/dependants-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
describe('FindCarePageComponent', () => {
  const services = [
    {
      code: 'DENTAL',
      name: 'Dental care',
      description: 'Dental services',
      providerCount: 1,
    },
  ];
  const provider = {
    providerReference: 'SCPR-ABCDEF0123456789',
    displayName: 'Dynamic Clinic',
    providerType: 'CLINIC',
    location: { city: 'Ibadan', stateOrRegion: 'Oyo', countryCode: 'NG' },
    locations: [],
    services: [
      {
        code: 'DENTAL',
        name: 'Dental care',
        description: null,
        deliveryOptions: [
          { deliveryMode: 'IN_PERSON', priceMinor: 1500000, currency: 'NGN' },
          { deliveryMode: 'VIRTUAL', priceMinor: 1000000, currency: 'NGN' },
          { deliveryMode: 'HOME_VISIT', priceMinor: 1800000, currency: 'NGN' },
        ],
        supportsAppointmentRequests: true,
        supportsFastTrack: true,
        fastTrackFeeMinor: 5000,
        fastTrackCurrency: 'NGN',
      },
    ],
  };
  async function setup(
    authenticated = true,
    dependants: readonly { patientReference: string; displayName: string }[] = [],
    serviceCode: string | null = null,
    serviceResponse: Observable<typeof services> = of(services),
    doctorJourney = false,
    market: 'NG' | 'RW' = 'NG',
    extraParams: Record<string, string> = {},
    providerResponse = provider,
  ) {
    const find = {
      getServices: vi.fn(() => serviceResponse),
      getProviders: vi.fn(() =>
        of({ items: [providerResponse], page: 1, limit: 50, total: 1, totalPages: 1 }),
      ),
    };
    const care = {
      create: vi.fn(() =>
        of({
          reference: 'SC-CARE-ABCDEF012345',
          status: 'AWAITING_PROVIDER_RESPONSE',
          service: {
            code: 'DENTAL',
            name: 'Dental care',
            price: { priceMinor: 1000000, currency: 'NGN' },
          },
          deliveryMode: 'VIRTUAL',
          geography: null,
          preferredProvider: provider,
          assignedProvider: provider,
          preferredDate: null,
          preferredTime: null,
          contactMethod: 'EMAIL',
          notes: null,
          funding: null,
          createdAt: '2026-08-28T00:00:00Z',
          updatedAt: '2026-08-28T00:00:00Z',
          appointment: null,
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [FindCarePageComponent],
      providers: [
        { provide: ProviderCredentialsApiService, useValue: { specialties: () => of([]), regulators: () => of([]), mine: () => of({ providerType: 'CLINIC', specialtyRequired: false, maxSpecialties: 40, specialties: [], regulators: [], credential: null, verified: false, uploadsAvailable: false, blockers: [] }), adminGet: () => of({ providerType: 'CLINIC', specialtyRequired: false, maxSpecialties: 40, specialties: [], regulators: [], credential: null, verified: false, uploadsAvailable: false, blockers: [], documentUrl: null, checkUrl: null, checkedVia: null, reviewNote: null }) } },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ ...(serviceCode ? { serviceCode } : {}), ...(doctorJourney ? { journey: 'doctor' } : {}), ...(market === 'RW' ? { market: 'RW', lang: 'rw' } : {}), ...extraParams }) },
            queryParamMap: of(convertToParamMap({ ...(serviceCode ? { serviceCode } : {}), ...(doctorJourney ? { journey: 'doctor' } : {}), ...(market === 'RW' ? { market: 'RW', lang: 'rw' } : {}), ...extraParams })),
          },
        },
        { provide: FindCareApiService, useValue: find },
        {
          provide: LocationDataService,
          useValue: {
            getCountries: () => [{ name: 'Nigeria', isoCode: 'NG' }, { name: 'Rwanda', isoCode: 'RW' }],
            getStates: (countryCode: string) => countryCode === 'RW' ? [
              { name: 'City of Kigali', isoCode: '01', countryCode: 'RW' },
            ] : [
              { name: 'Lagos', isoCode: 'LA', countryCode: 'NG' },
              { name: 'Oyo', isoCode: 'Oyo', countryCode: 'NG' },
            ],
            getCities: (_countryCode: string, stateCode: string) =>
              stateCode === 'Oyo'
                ? [{ name: 'Kisi', stateCode: 'Oyo', countryCode: 'NG' }]
                : [{ name: 'Ikeja', stateCode: 'LA', countryCode: 'NG' }],
          },
        },
        { provide: CareRequestsApiService, useValue: care },
        {
          provide: DependantsApiService,
          useValue: { getDependants: vi.fn(() => of({ items: dependants })) },
        },
        {
          provide: AuthStateService,
          useValue: { authenticated: () => authenticated, isPatient: () => authenticated },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FindCarePageComponent);
    fixture.detectChanges();
    return { fixture, find, care, router: TestBed.inject(Router) };
  }
  it('starts with "What’s going on?" and reveals the service form for "Something else"', async () => {
    const { fixture } = await setup();
    const element: HTMLElement = fixture.nativeElement;
    const intent = element.querySelector('[data-care-intent]') as HTMLElement;
    expect(intent.textContent).toContain('What’s going on?');
    const links = [...intent.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual([
      '/me/request-care?serviceCode=EMERGENCY_CONSULTATION&journey=doctor',
      '/me/lab-tests',
      '/me/prescriptions',
      '/me/fasttrack/new',
    ]);
    expect(element.querySelector('form')!.classList).toContain('hidden');

    (intent.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelector('[data-care-intent]')).toBeNull();
    expect(element.querySelector('form')!.classList).not.toContain('hidden');
  });

  it('skips the intent step when a doctor journey or service is already chosen', async () => {
    let { fixture } = await setup(true, [], null, undefined, true);
    expect(fixture.nativeElement.querySelector('[data-care-intent]')).toBeNull();

    TestBed.resetTestingModule();
    ({ fixture } = await setup(true, [], 'DENTAL'));
    expect(fixture.nativeElement.querySelector('[data-care-intent]')).toBeNull();
    expect(fixture.nativeElement.querySelector('form').classList).not.toContain('hidden');
  });

  it('shows emergency guidance before the form, with a callable emergency number', async () => {
    const { fixture } = await setup();
    const element: HTMLElement = fixture.nativeElement;
    const guidance = element.querySelector('[data-emergency-guidance]') as HTMLElement;
    expect(guidance.textContent).toContain('Is this an emergency?');
    expect(guidance.querySelector('a[href="tel:112"]')).not.toBeNull();
    const form = element.querySelector('form');
    if (form) expect(guidance.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('preselects a valid serviceCode only after catalogue validation and reuses serviceChanged', async () => {
    const { fixture, find } = await setup(true, [], 'DENTAL');
    const c = fixture.componentInstance;
    expect(c.form.controls.serviceCode.value).toBe('DENTAL');
    expect(find.getProviders).toHaveBeenCalledWith({ serviceCode: 'DENTAL', limit: 50 });
  });

  describe('the blood group & genotype link', () => {
    const withLab = [...services, { code: 'LAB_REQUEST', name: 'Basic Lab Test', description: 'Basic tests', providerCount: 1 }];
    const lab = { ...provider, services: [{ ...provider.services[0], code: 'LAB_REQUEST', name: 'Basic Lab Test' }] };

    it('opens the lab request with the tests noted and the chosen place picked once places load', async () => {
      const { fixture, find } = await setup(true, [], 'LAB_REQUEST', of(withLab), false, 'NG', { topic: 'blood-group-genotype', mode: 'HOME_VISIT' }, lab);
      const c = fixture.componentInstance;
      expect(c.form.controls.serviceCode.value).toBe('LAB_REQUEST');
      expect(c.form.controls.notes.value).toContain('haemoglobin genotype');
      expect(c.form.controls.deliveryMode.value).toBe('HOME_VISIT');
      expect(find.getProviders).toHaveBeenCalledWith({ serviceCode: 'LAB_REQUEST', limit: 50 }); // next, the patient picks their area
    });

    it('keeps lab tests off the menu for any other visit', async () => {
      const { fixture } = await setup(true, [], 'LAB_REQUEST', of(withLab));
      expect(fixture.componentInstance.form.controls.serviceCode.value).toBe('');
      expect(fixture.componentInstance.services().some((x) => x.code === 'LAB_REQUEST')).toBe(false);
    });
  });

  it('ignores an invalid serviceCode and leaves normal service selection available', async () => {
    const { fixture, find } = await setup(true, [], 'DOES_NOT_EXIST');
    expect(fixture.componentInstance.form.controls.serviceCode.value).toBe('');
    expect(find.getProviders).not.toHaveBeenCalled();
  });

  it('does not select a deep-linked service before the catalogue responds', async () => {
    const pending = new Subject<typeof services>();
    const { fixture } = await setup(true, [], 'DENTAL', pending.asObservable());
    expect(fixture.componentInstance.form.controls.serviceCode.value).toBe('');
    pending.next(services);
    pending.complete();
    expect(fixture.componentInstance.form.controls.serviceCode.value).toBe('DENTAL');
  });

  it('discovers delivery modes without geography, then discovers and submits VIRTUAL without it', async () => {
    const { fixture, find, care } = await setup();
    const c = fixture.componentInstance;
    c.form.patchValue({
      serviceCode: 'DENTAL',
      preferredProviderReference: '',
    });
    c.serviceChanged();
    expect(find.getProviders).toHaveBeenCalledWith({ serviceCode: 'DENTAL', limit: 50 });
    expect(c.deliveryModes()).toEqual(['IN_PERSON', 'VIRTUAL', 'HOME_VISIT']);
    c.form.controls.deliveryMode.setValue('VIRTUAL');
    c.deliveryModeChanged();
    fixture.detectChanges();
    expect(find.getProviders).toHaveBeenLastCalledWith({
      serviceCode: 'DENTAL',
      deliveryMode: 'VIRTUAL',
      limit: 50,
    });
    expect(c.form.controls.countryCode.hasError('required')).toBe(false);
    expect(c.form.controls.stateOrRegion.hasError('required')).toBe(false);
    expect(c.form.controls.city.hasError('required')).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('3. Location');
    expect(fixture.nativeElement.textContent).toContain('Dynamic Clinic');
    c.form.controls.preferredProviderReference.setValue(provider.providerReference);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('₦10,000');
    c.submit();
    expect(care.create).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredProviderReference: provider.providerReference,
        deliveryMode: 'VIRTUAL',
      }),
    );
    const request = (care.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request).not.toHaveProperty('countryCode');
    expect(request).not.toHaveProperty('stateOrRegion');
    expect(request).not.toHaveProperty('city');
    expect(request).not.toHaveProperty('priceMinor');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Virtual care');
    expect(fixture.nativeElement.textContent).not.toContain('Requested location');
    expect(fixture.nativeElement.textContent).not.toContain('FastTrack</option>');
  });
  it('includes the selected dependant reference without adding dependant identity fields', async () => {
    const { fixture, care } = await setup(true, [
      { patientReference: 'SCP-CHILD', displayName: 'Aisha Okafor' },
    ]);
    const c = fixture.componentInstance;
    c.selectParticipant({
      kind: 'DEPENDANT',
      patientReference: 'SCP-CHILD',
      displayName: 'Aisha Okafor',
    });
    c.form.patchValue({ serviceCode: 'DENTAL', deliveryMode: 'VIRTUAL' });
    c.submit();
    expect(care.create).toHaveBeenCalledWith(
      expect.objectContaining({ participantPatientReference: 'SCP-CHILD' }),
    );
    expect(care.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ patientId: expect.anything(), email: expect.anything() }),
    );
  });
  it('submits no provider field for no preference', async () => {
    const { fixture, care } = await setup();
    const c = fixture.componentInstance;
    c.form.patchValue({
      serviceCode: 'DENTAL',
      deliveryMode: 'VIRTUAL',
      preferredProviderReference: '',
    });
    c.discoverProviders();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Price will be determined when a Provider is assigned',
    );
    c.submit();
    expect(care.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ preferredProviderReference: expect.anything() }),
    );
  });
  it('preserves intent in memory and routes unauthenticated users to login', async () => {
    const { fixture, care, router } = await setup(false);
    const nav = vi.spyOn(router, 'navigate');
    const c = fixture.componentInstance;
    c.form.patchValue({
      serviceCode: 'DENTAL',
      deliveryMode: 'VIRTUAL',
    });
    c.submit();
    expect(care.create).not.toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/me/request-care' },
    });
  });
  it('country-scopes Rwanda virtual discovery, uses Kigali time, and preserves market through login', async () => {
    const { fixture, find, router } = await setup(false, [], null, of(services), false, 'RW');
    const nav = vi.spyOn(router, 'navigate');
    const component = fixture.componentInstance;
    expect(component.form.controls.countryCode.value).toBe('RW');
    component.form.patchValue({ serviceCode: 'DENTAL', deliveryMode: 'VIRTUAL', preferredDate: '2026-10-01', preferredTime: '09:00' });
    component.discoverProviders();
    expect(find.getProviders).toHaveBeenLastCalledWith({ serviceCode: 'DENTAL', deliveryMode: 'VIRTUAL', countryCode: 'RW', limit: 50 });
    expect(component.request()).toEqual(expect.objectContaining({ preferredTimezone: 'Africa/Kigali' }));
    component.submit();
    expect(nav).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/me/request-care', market: 'RW', lang: 'rw' } });
  });
  it.each(['IN_PERSON', 'HOME_VISIT'] as const)(
    'requires geography and sends it for %s provider discovery and submission',
    async (deliveryMode) => {
      const { fixture, find, care } = await setup();
      const c = fixture.componentInstance;
      c.form.patchValue({ serviceCode: 'DENTAL', deliveryMode, countryCode: '' });
      c.deliveryModeChanged();
      expect(c.form.controls.countryCode.hasError('required')).toBe(true);
      expect(c.form.controls.stateOrRegion.hasError('required')).toBe(true);
      expect(c.form.controls.city.hasError('required')).toBe(true);
      expect(find.getProviders).not.toHaveBeenCalled();
      c.submit();
      expect(care.create).not.toHaveBeenCalled();

      c.form.patchValue({ countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Ibadan' });
      c.discoverProviders();
      expect(find.getProviders).toHaveBeenLastCalledWith({
        serviceCode: 'DENTAL',
        deliveryMode,
        countryCode: 'NG',
        stateOrRegion: 'Oyo',
        city: 'Ibadan',
        limit: 50,
      });
      c.submit();
      expect(care.create).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceCode: 'DENTAL',
          deliveryMode,
          countryCode: 'NG',
          stateOrRegion: 'Oyo',
          city: 'Ibadan',
        }),
      );
    },
  );

  it('resets provider and omits stale geography when switching physical to VIRTUAL', async () => {
    const { fixture, find, care } = await setup();
    const c = fixture.componentInstance;
    c.form.patchValue({
      serviceCode: 'DENTAL',
      deliveryMode: 'IN_PERSON',
      countryCode: 'NG',
      stateOrRegion: 'Oyo',
      city: 'Ibadan',
      preferredProviderReference: provider.providerReference,
    });
    c.form.controls.deliveryMode.setValue('VIRTUAL');
    c.deliveryModeChanged();
    expect(c.form.controls.preferredProviderReference.value).toBe('');
    expect(find.getProviders).toHaveBeenLastCalledWith({
      serviceCode: 'DENTAL',
      deliveryMode: 'VIRTUAL',
      limit: 50,
    });
    c.submit();
    const request = (care.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request).not.toHaveProperty('countryCode');
    expect(request).not.toHaveProperty('stateOrRegion');
    expect(request).not.toHaveProperty('city');
  });

  it('blocks discovery and submission after switching VIRTUAL to physical without geography', async () => {
    const { fixture, find, care } = await setup();
    const c = fixture.componentInstance;
    c.form.patchValue({
      serviceCode: 'DENTAL',
      deliveryMode: 'VIRTUAL',
      countryCode: '',
      stateOrRegion: '',
      city: '',
      preferredProviderReference: provider.providerReference,
    });
    c.form.controls.deliveryMode.setValue('IN_PERSON');
    find.getProviders.mockClear();
    c.deliveryModeChanged();
    expect(c.form.controls.preferredProviderReference.value).toBe('');
    expect(find.getProviders).not.toHaveBeenCalled();
    c.submit();
    expect(care.create).not.toHaveBeenCalled();

    c.form.controls.preferredProviderReference.setValue(provider.providerReference);
    c.serviceChanged();
    expect(c.form.controls.preferredProviderReference.value).toBe('');
  });
  it('uses an ISO state control while preserving the state name in the request form', async () => {
    const { fixture } = await setup();
    const c = fixture.componentInstance;
    c.countryChanged('NG');
    c.stateChanged('Oyo');
    c.form.controls.city.setValue('Kisi');
    expect(c.requestStateCode.value).toBe('Oyo');
    expect(c.form.getRawValue()).toMatchObject({
      countryCode: 'NG',
      stateOrRegion: 'Oyo',
      city: 'Kisi',
    });
    c.countryChanged('GH');
    expect(c.requestStateCode.value).toBe('');
    expect(c.form.getRawValue()).toMatchObject({ stateOrRegion: '', city: '' });
  });
  it('gives immediate feedback and prepares virtual discovery for Talk to a Doctor Now', async () => {
    const { fixture, find } = await setup(true, [], 'DENTAL', of(services), true);
    const component = fixture.componentInstance;
    component.chooseDoctorMode('NOW');
    fixture.detectChanges();
    expect(component.doctorMode()).toBe('NOW');
    expect(component.form.controls.deliveryMode.value).toBe('VIRTUAL');
    expect(fixture.nativeElement.textContent).toContain('Selected — choose a doctor below');
    expect(find.getProviders).toHaveBeenCalled();
  });

  it('makes Book for Later visible and pre-fills the scheduling controls', async () => {
    const { fixture } = await setup(true, [], 'DENTAL', of(services), true);
    const component = fixture.componentInstance;
    component.chooseDoctorMode('LATER');
    fixture.detectChanges();
    expect(component.doctorMode()).toBe('LATER');
    expect(component.form.controls.preferredDate.value).not.toBe('');
    expect(component.form.controls.preferredTime.value).toBe('09:00');
    expect(fixture.nativeElement.textContent).toContain('Selected — choose your preferred time below');
  });

  it('turns Visit a Hospital into an in-person flow with visible confirmation', async () => {
    const { fixture } = await setup(true, [], 'DENTAL', of(services), true);
    const component = fixture.componentInstance;
    component.chooseDoctorMode('HOSPITAL');
    fixture.detectChanges();
    expect(component.doctorMode()).toBe('HOSPITAL');
    expect(component.form.controls.deliveryMode.value).toBe('IN_PERSON');
    expect(fixture.nativeElement.textContent).toContain('Selected — choose a hospital below');
    expect(component.form.controls.stateOrRegion.hasError('required')).toBe(true);
  });

});
