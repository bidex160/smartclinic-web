import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { FindCarePageComponent } from './find-care-page.component';
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
  async function setup(authenticated = true) {
    const find = {
      getServices: vi.fn(() => of(services)),
      getProviders: vi.fn(() =>
        of({ items: [provider], page: 1, limit: 50, total: 1, totalPages: 1 }),
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
        provideRouter([]),
        { provide: FindCareApiService, useValue: find },
        { provide: CareRequestsApiService, useValue: care },
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
});
