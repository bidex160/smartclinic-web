import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { PatientHealthCheckV2BookingPageComponent } from './patient-health-check-v2-booking-page.component';

describe('PatientHealthCheckV2BookingPageComponent', () => {
  it('starts on Appointment and renders the compact four-step progress UI', async () => {
    const { component, fixture } = await setup();
    expect(component.currentStep()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 4');
    for (const label of ['Appointment', 'Provider', 'Customise', 'Review & Pay'])
      expect(fixture.nativeElement.textContent).toContain(label);
    expect(fixture.nativeElement.textContent).not.toContain('Choose a provider');
  });

  it('uses dependent state/city dropdowns and clears city when state changes', async () => {
    const { component, fixture } = await setup();
    const state = fixture.nativeElement.querySelector(
      'select[formcontrolname="stateOrRegion"]',
    ) as HTMLSelectElement;
    const city = fixture.nativeElement.querySelector(
      'select[formcontrolname="city"]',
    ) as HTMLSelectElement;
    expect(state).not.toBeNull();
    expect(city.disabled).toBe(true);
    expect(state.options[0].textContent).toContain('Select state');
    component.stateChanged('Lagos');
    component.form.controls.address.controls.city.setValue('Ikeja');
    expect(component.cities().some((item) => item.name === 'Ikeja')).toBe(true);
    component.stateChanged('Oyo');
    expect(component.form.controls.address.controls.city.value).toBe('');
    expect(component.form.controls.address.controls.stateOrRegion.value).toBe('Oyo');
  });

  it('hides and does not require a patient street address for PROVIDER_LOCATION', async () => {
    const { component, fixture } = await setup();
    setAppointment(component, 'PROVIDER_LOCATION');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[formcontrolname="addressLine1"]')).toBeNull();
    expect(component.form.controls.address.controls.addressLine1.hasError('required')).toBe(false);
    expect(component.form.valid).toBe(true);
  });

  it('shows and requires the actual visit address for HOME_VISIT', async () => {
    const { component, fixture } = await setup();
    setAppointment(component, 'HOME_VISIT', false);
    fixture.detectChanges();
    const street = fixture.nativeElement.querySelector(
      'input[formcontrolname="addressLine1"]',
    ) as HTMLInputElement;
    expect(street.placeholder).toBe('12 Ring Road');
    expect(fixture.nativeElement.textContent).toContain('Address line 2 / landmark');
    expect(component.form.controls.address.controls.addressLine1.hasError('required')).toBe(true);
  });

  it('discovers with geography only and advances only when providers are returned', async () => {
    const { component, packageApi } = await setup();
    setAppointment(component, 'PROVIDER_LOCATION');
    component.discover(1);
    expect(packageApi.discoverProviders).toHaveBeenCalledWith({
      packageCode: 'ESSENTIAL',
      fulfilmentModeCode: 'PROVIDER_LOCATION',
      preferredDate: '2026-09-10',
      preferredTime: '09:00',
      timezone: 'Africa/Lagos',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
      page: 1,
      limit: 10,
    });
    expect(JSON.stringify(packageApi.discoverProviders.mock.calls[0][0])).not.toContain(
      'addressLine1',
    );
    expect(component.currentStep()).toBe(2);
  });

  it('keeps an empty discovery on Appointment with a friendly state', async () => {
    const { component, fixture } = await setup({ offerings: [] });
    setAppointment(component, 'PROVIDER_LOCATION');
    component.discover(1);
    fixture.detectChanges();
    expect(component.currentStep()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('No providers available');
  });

  it('moves from Provider to Customise and supports back navigation with selections', async () => {
    const { component } = await setup();
    setAppointment(component, 'PROVIDER_LOCATION');
    component.discover(1);
    component.selectOffering(providerOffering);
    component.continueToCustomise();
    expect(component.currentStep()).toBe(3);
    component.backTo(2);
    expect(component.currentStep()).toBe(2);
    expect(component.selectedOffering()).toBe(providerOffering);
    component.backTo(1);
    expect(component.currentStep()).toBe(1);
  });

  it('shows provider locations only for PROVIDER_LOCATION and keeps add-ons selectable', async () => {
    const provider = await setup();
    enterCustomise(provider.component, providerOffering);
    provider.fixture.detectChanges();
    expect(provider.fixture.nativeElement.textContent).toContain('Where will you attend?');
    expect(provider.fixture.nativeElement.textContent).toContain('Configured add-on');
    provider.component.toggleAddon('ADDON_A');
    expect(provider.component.selectedAddons()).toEqual(['ADDON_A']);

    TestBed.resetTestingModule();
    const home = await setup({ offerings: [homeOffering] });
    enterCustomise(home.component, homeOffering, 'HOME_VISIT');
    home.fixture.detectChanges();
    expect(home.fixture.nativeElement.textContent).not.toContain('Where will you attend?');
  });

  it('silently confirms price and moves to the single Review & Pay step', async () => {
    const { component, packageApi, fixture } = await setup();
    enterCustomise(component, providerOffering);
    component.selectLocation(providerOffering.locations[0]);
    component.toggleAddon('ADDON_A');
    component.reviewBooking();
    expect(packageApi.getConfigurationQuote).toHaveBeenCalledWith({
      packageCode: 'ESSENTIAL',
      providerReference: 'SCPR-SAFE',
      providerLocationReference: 'SC-LOC-SAFE',
      fulfilmentModeCode: 'PROVIDER_LOCATION',
      addonCodes: ['ADDON_A'],
    });
    expect(component.currentStep()).toBe(4);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Get authoritative quote');
    expect(text).not.toContain('Final booking review');
    expect(text.match(/Review & Pay/g)?.length).toBeGreaterThanOrEqual(1);
    expect(text).toContain('Price confirmed for this booking');
    expect(text).toContain('₦9,000');
  });

  it('keeps quote failures on Customise with patient-safe copy', async () => {
    const { component, fixture } = await setup({ quoteError: true });
    enterCustomise(component, providerOffering);
    component.selectLocation(providerOffering.locations[0]);
    component.reviewBooking();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('This option is no longer available');
  });

  it('invalidates downstream provider and quote state after upstream changes', async () => {
    const { component } = await setup();
    enterCustomise(component, providerOffering);
    component.selectLocation(providerOffering.locations[0]);
    component.quote.set(providerQuote);
    component.stateChanged('Oyo');
    expect(component.offerings()).toEqual([]);
    expect(component.selectedOffering()).toBeNull();
    expect(component.selectedLocation()).toBeNull();
    expect(component.selectedAddons()).toEqual([]);
    expect(component.quote()).toBeNull();
  });

  it('omits visitAddress for provider-location booking creation and shows payment immediately', async () => {
    const { component, bookingApi, fixture } = await setup();
    setAppointment(component, 'PROVIDER_LOCATION');
    component.currentStep.set(4);
    component.quote.set(providerQuote);
    component.createBooking();
    const payload = bookingApi.createMyHealthCheck.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload['visitAddress']).toBeUndefined();
    expect(payload['configurationReference']).toBe('SC-HCQ-SAFE');
    fixture.detectChanges();
    expect(component.currentStep()).toBe(4);
    expect(fixture.nativeElement.querySelector('#booking-payment')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-patient-payment-panel')).not.toBeNull();
  });

  it('sends the real HOME_VISIT address without provider-location data', async () => {
    const { component, bookingApi } = await setup({ offerings: [homeOffering], quote: homeQuote });
    setAppointment(component, 'HOME_VISIT');
    component.form.controls.address.patchValue({
      addressLine1: '12 Ring Road',
      addressLine2: 'Opposite Central Pharmacy',
      postalCode: '200001',
    });
    component.currentStep.set(4);
    component.quote.set(homeQuote);
    component.createBooking();
    const payload = bookingApi.createMyHealthCheck.mock.calls[0]![0] as {
      visitAddress?: Record<string, unknown>;
    };
    expect(payload.visitAddress).toEqual({
      addressLine1: '12 Ring Road',
      addressLine2: 'Opposite Central Pharmacy',
      city: 'Ikeja',
      stateOrRegion: 'Lagos',
      postalCode: '200001',
      countryCode: 'NG',
    });
  });

  function setAppointment(
    component: PatientHealthCheckV2BookingPageComponent,
    mode: 'PROVIDER_LOCATION' | 'HOME_VISIT',
    includeStreet = true,
  ): void {
    component.form.patchValue({
      packageCode: 'ESSENTIAL',
      fulfilmentModeCode: mode,
      preferredDate: '2026-09-10',
      preferredTime: '09:00',
      timezone: 'Africa/Lagos',
      address: {
        addressLine1: includeStreet ? '12 Ring Road' : '',
        countryCode: 'NG',
        stateOrRegion: 'Lagos',
        city: 'Ikeja',
      },
    });
    component.fulfilmentChanged();
    component.stateChanged('Lagos');
    component.form.controls.address.controls.city.setValue('Ikeja');
    if (mode === 'HOME_VISIT' && includeStreet)
      component.form.controls.address.controls.addressLine1.setValue('12 Ring Road');
  }

  function enterCustomise(
    component: PatientHealthCheckV2BookingPageComponent,
    offering: typeof providerOffering | typeof homeOffering,
    mode: 'PROVIDER_LOCATION' | 'HOME_VISIT' = 'PROVIDER_LOCATION',
  ): void {
    setAppointment(component, mode);
    component.offerings.set([offering]);
    component.currentStep.set(2);
    component.selectOffering(offering);
    component.continueToCustomise();
  }

  async function setup(
    options: {
      offerings?: readonly (typeof providerOffering | typeof homeOffering)[];
      quote?: typeof providerQuote | typeof homeQuote;
      quoteError?: boolean;
    } = {},
  ) {
    const selectedQuote = options.quote ?? providerQuote;
    const packageApi = {
      getCatalogue: vi.fn(() => of([catalogue])),
      discoverProviders: vi.fn((_request: unknown) =>
        of({
          items: options.offerings ?? [providerOffering],
          page: 1,
          limit: 10,
          total: (options.offerings ?? [providerOffering]).length,
          totalPages: 1,
        }),
      ),
      getConfigurationQuote: vi.fn((_request: unknown) =>
        options.quoteError ? throwError(() => new Error('internal')) : of(selectedQuote),
      ),
    };
    const bookingApi = {
      createMyHealthCheck: vi.fn((_request: unknown) =>
        of({ bookingReference: 'SC-BOOKING', commercialConfiguration: selectedQuote }),
      ),
      getMyHealthCheckPayment: vi.fn(() => throwError(() => new Error('not loaded in unit test'))),
      previewMyHealthCheckRewards: vi.fn(() =>
        throwError(() => new Error('not loaded in unit test')),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [PatientHealthCheckV2BookingPageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: packageApi },
        { provide: HealthCheckResultsApiService, useValue: bookingApi },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientHealthCheckV2BookingPageComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, packageApi, bookingApi, fixture };
  }
});

const catalogue = {
  code: 'ESSENTIAL', name: 'Essential Health Check', description: 'Core checks', benefits: [],
  estimatedDurationMinutes: 30, isActive: true,
  includedContents: [{ code: 'BP', name: 'Blood pressure', category: 'VITALS', description: null }],
  optionalAddons: [], fromPriceMinor: 800000, currency: 'NGN',
  fulfilmentModes: [
    { code: 'PROVIDER_LOCATION', name: 'Provider location' },
    { code: 'HOME_VISIT', name: 'Home visit' },
  ],
};

const providerOffering = {
  providerReference: 'SCPR-SAFE', providerName: 'Prime Clinic', packageCode: 'ESSENTIAL',
  basePackagePriceMinor: 800000, currency: 'NGN',
  fulfilmentMode: { code: 'PROVIDER_LOCATION' as const, name: 'Provider location', fulfilmentFeeMinor: 0 },
  locations: [{ reference: 'SC-LOC-SAFE', name: 'Main Clinic', addressLine1: '1 Clinic Road', addressLine2: null, city: 'Ikeja', stateOrRegion: 'Lagos', postalCode: null, countryCode: 'NG' }],
  addons: [{ code: 'ADDON_A', name: 'Configured add-on', category: 'LAB', priceMinor: 100000, currency: 'NGN' }],
};

const homeOffering = {
  ...providerOffering,
  fulfilmentMode: { code: 'HOME_VISIT' as const, name: 'Home visit', fulfilmentFeeMinor: 200000 },
  locations: [],
};

const providerQuote = {
  configurationReference: 'SC-HCQ-SAFE', expiresAt: '2026-09-10T10:00:00Z',
  package: { code: 'ESSENTIAL', name: 'Essential Health Check' },
  provider: { reference: 'SCPR-SAFE', name: 'Prime Clinic' }, providerLocation: providerOffering.locations[0],
  fulfilmentMode: { code: 'PROVIDER_LOCATION', name: 'Provider location' },
  includedContents: [{ code: 'BP', name: 'Blood pressure', category: 'VITALS' }],
  selectedAddons: [{ code: 'ADDON_A', name: 'Configured add-on', amountMinor: 100000 }],
  pricing: { currency: 'NGN', basePackagePriceMinor: 800000, clinicalAddonsTotalMinor: 100000, fulfilmentFeeMinor: 0, totalMinor: 900000 },
};

const homeQuote = {
  ...providerQuote,
  providerLocation: null,
  fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
  pricing: { ...providerQuote.pricing, fulfilmentFeeMinor: 200000, totalMinor: 1100000 },
};
