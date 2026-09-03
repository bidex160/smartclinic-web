import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { ProviderEligibilityApiService } from '../../core/services/provider-eligibility-api.service';
import { ProviderSelfConfigurationApiService } from '../../core/services/provider-self-configuration-api.service';
import { ProviderEligibilityConfigComponent } from './provider-eligibility-config.component';
describe('ProviderEligibilityConfigComponent', () => {
  it('renders catalogue-labelled capabilities and HOME_VISIT limitation', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Essential');
    expect(text).toContain('Provider location');
    expect(text).toContain('Home-visit service-area configuration is not available yet.');
    expect(text).not.toContain('service-id');
  });
  it('creates a capability from catalogue IDs and sanitizes duplicate conflicts', async () => {
    const first = await setup();
    first.component.serviceForm.setValue({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-location',
      currency: 'NGN',
      price: '45000',
    });
    first.component.createService();
    expect(first.api.createService).toHaveBeenCalledWith('provider-id', {
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-location',
      priceMinor: 4500000,
      currency: 'NGN',
    });
    TestBed.resetTestingModule();
    const conflict = await setup({
      createServiceError: new HttpErrorResponse({
        status: 409,
        error: { message: 'raw constraint' },
      }),
    });
    conflict.component.serviceForm.setValue({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-location',
      currency: 'NGN',
      price: '45000',
    });
    conflict.component.createService();
    expect(conflict.component.error()).toContain('conflicts');
    expect(conflict.component.error()).not.toContain('constraint');
  });
  it('updates an exact capability price with safe minor units and supports free pricing', async () => {
    const { component, api, fixture } = await setup();
    const providerLocation = component.services()[0];
    const homeVisit = component.services()[1];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('₦45,000');
    expect(fixture.nativeElement.textContent).toContain('₦65,000');
    component.editServicePrice(providerLocation);
    expect(component.servicePriceForm.controls.price.value).toBe('45000.00');
    component.servicePriceForm.setValue({ currency: 'NGN', price: '65000.50' });
    component.saveServicePrice(providerLocation);
    expect(api.updateServicePrice).toHaveBeenCalledWith('service-location', {
      priceMinor: 6500050,
      currency: 'NGN',
    });
    component.editServicePrice(homeVisit);
    component.servicePriceForm.setValue({ currency: 'NGN', price: '0' });
    component.saveServicePrice(homeVisit);
    expect(api.updateServicePrice).toHaveBeenLastCalledWith('service-home', {
      priceMinor: 0,
      currency: 'NGN',
    });
  });
  it('keeps optional add-ons service-scoped and renders active, inactive, and unavailable states', async () => {
    const { component, fixture } = await setup();
    fixture.detectChanges();
    expect(component.addonConfiguration('service-location')?.items[0].offering?.priceMinor).toBe(
      500000,
    );
    expect(component.addonConfiguration('service-home')?.items[0].offering?.priceMinor).toBe(
      550000,
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Optional add-ons');
    expect(text).toContain('₦5,000');
    expect(text).toContain('Not currently approved for this Health Check package');
    expect(text).toContain('Provider configuration is currently unavailable.');
    expect(fixture.nativeElement.querySelector('input[formcontrolname="category"]')).toBeNull();
  });
  it('configures, updates, reactivates, and stops an add-on using authoritative service currency', async () => {
    const { component, api, fixture } = await setup();
    const service = component.services()[0];
    const configured = component.addonConfiguration(service.id)!;
    const active = configured.items[0];
    component.editAddon(service, active);
    expect(component.addonPriceForm.controls.price.value).toBe('5000.00');
    component.addonPriceForm.setValue({ price: '6250.50' });
    component.saveAddon(service, active);
    expect(api.configureServiceAddon).toHaveBeenCalledWith(service.id, {
      addonCode: 'CHOLESTEROL',
      priceMinor: 625050,
      currency: 'NGN',
    });
    const unconfigured = configured.items[1];
    component.editAddon(service, unconfigured);
    component.addonPriceForm.setValue({ price: '0' });
    component.saveAddon(service, unconfigured);
    expect(api.configureServiceAddon).toHaveBeenLastCalledWith(service.id, {
      addonCode: 'ECG',
      priceMinor: 0,
      currency: 'NGN',
    });
    const inactive = configured.items[2];
    component.editAddon(service, inactive);
    expect(component.addonPriceForm.controls.price.value).toBe('3000.00');
    component.stopOffering(service, active);
    expect(api.deactivateServiceAddon).not.toHaveBeenCalled();
    expect(component.pendingAction()?.label).toContain('saved provider price will be retained');
    component.confirmAction();
    expect(api.deactivateServiceAddon).toHaveBeenCalledWith(service.id, 'CHOLESTEROL');
  });
  it('enforces backend canConfigure and page editability even when a service is inactive', async () => {
    const { component, api, fixture } = await setup();
    const inactiveService = { ...component.services()[0], isActive: false };
    const configurable = component.addonConfiguration('service-location')!.items[1];
    component.editAddon(inactiveService, configurable);
    expect(component.editingAddon()).toBe('service-location:ECG');
    component.cancelAddon();
    const blocked = component.addonConfiguration('service-location')!.items[3];
    component.editAddon(inactiveService, blocked);
    expect(component.editingAddon()).toBeNull();
    component.stopOffering(inactiveService, blocked);
    expect(api.deactivateServiceAddon).not.toHaveBeenCalled();
    fixture.componentRef.setInput('editable', false);
    component.editAddon(inactiveService, configurable);
    expect(component.editingAddon()).toBeNull();
  });
  it('surfaces a safe backend add-on conflict message contextually', async () => {
    const { component } = await setup({
      addonError: new HttpErrorResponse({
        status: 409,
        error: { message: 'Clinical add-on currency must match the Provider package currency' },
      }),
    });
    const service = component.services()[0];
    const addon = component.addonConfiguration(service.id)!.items[1];
    component.editAddon(service, addon);
    component.addonPriceForm.setValue({ price: '5000' });
    component.saveAddon(service, addon);
    expect(component.error()).toBe(
      'Clinical add-on currency must match the Provider package currency',
    );
  });
  it('rejects blank and negative prices and preserves input after a server conflict', async () => {
    const { component, api } = await setup();
    const item = component.services()[0];
    component.editServicePrice(item);
    component.servicePriceForm.setValue({ currency: 'NGN', price: '' });
    component.saveServicePrice(item);
    expect(api.updateServicePrice).not.toHaveBeenCalled();
    component.servicePriceForm.setValue({ currency: 'NGN', price: '-1' });
    component.saveServicePrice(item);
    expect(api.updateServicePrice).not.toHaveBeenCalled();
    api.updateServicePrice.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );
    component.servicePriceForm.setValue({ currency: 'NGN', price: '47000' });
    component.saveServicePrice(item);
    expect(component.servicePriceForm.controls.price.value).toBe('47000');
    expect(component.editingServicePrice()).toBe(item.id);
  });
  it('creates and edits named locations without coordinate or raw UUID fields', async () => {
    const { component, api, fixture } = await setup();
    component.selectTab('locations');
    component.locationForm.setValue({
      name: 'New clinic',
      addressLine1: '2 Road',
      addressLine2: '',
      city: 'Ikeja',
      state: 'Lagos',
      postalCode: '100271',
      countryCode: 'ng',
    });
    component.createLocation();
    expect(api.createLocation).toHaveBeenCalledWith('provider-id', {
      name: 'New clinic',
      addressLine1: '2 Road',
      city: 'Ikeja',
      state: 'Lagos',
      postalCode: '100271',
      countryCode: 'NG',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[name="locationId"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="number"]')).toBeNull();
  });
  it('restores an edited provider location state code without clearing persisted geography', async () => {
    const { component } = await setup();
    component.editLocation({
      ...locationRows()[0],
      locationReference: 'SCPL-TEST',
      postalCode: null,
      state: 'Oyo',
      city: 'Kisi',
    });
    expect(component.locationStateCode.value).toBe('OY');
    expect(component.locationForm.getRawValue()).toMatchObject({
      countryCode: 'NG',
      state: 'Oyo',
      city: 'Kisi',
    });
    component.onLocationStateChange('LA');
    expect(component.locationForm.getRawValue()).toMatchObject({ state: 'Lagos', city: '' });
  });
  it('links only active provider locations for PROVIDER_LOCATION and unlinks after confirmation', async () => {
    const { component, api } = await setup();
    component.link('service-location', 'location-id');
    expect(api.linkLocation).toHaveBeenCalledWith('service-location', 'location-id');
    component.unlink('service-location', 'location-id');
    expect(api.unlinkLocation).not.toHaveBeenCalled();
    component.confirmAction();
    expect(api.unlinkLocation).toHaveBeenCalledWith('service-location', 'location-id');
  });
  it('defaults timezone and validates time order before provider-wide/scoped availability submission', async () => {
    const { component, api } = await setup();
    expect(component.availabilityForm.controls.timezone.value).toBeTruthy();
    component.availabilityForm.patchValue({
      dayOfWeek: 'MONDAY',
      startTime: '17:00',
      endTime: '09:00',
    });
    component.createAvailability();
    expect(api.createAvailability).not.toHaveBeenCalled();
    component.availabilityForm.patchValue({
      startTime: '09:00',
      endTime: '17:00',
      bookingStopTime: '09:00',
    });
    component.createAvailability();
    expect(api.createAvailability).not.toHaveBeenCalled();
    component.availabilityForm.setValue({
      dayOfWeek: 'TUESDAY',
      startTime: '09:00',
      endTime: '17:00',
      bookingStopTime: '16:30',
      timezone: 'Africa/Lagos',
      providerServiceId: 'service-location',
      providerLocationId: 'location-id',
    });
    component.createAvailability();
    expect(api.createAvailability).toHaveBeenCalledWith(
      'provider-id',
      expect.objectContaining({
        providerServiceId: 'service-location',
        providerLocationId: 'location-id',
        bookingStopTime: '16:30',
      }),
    );
  });
  it('groups weekly availability and supports AVAILABLE/UNAVAILABLE full-day exceptions', async () => {
    const { component, api, fixture } = await setup();
    component.selectTab('availability');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('MONDAY');
    expect(fixture.nativeElement.textContent).toContain('09:00');
    expect(fixture.nativeElement.textContent).toContain('New bookings until 16:30:00');
    component.availability.set([{ ...availabilityRows()[0], bookingStopTime: null }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('New bookings until 17:00:00');
    component.exceptionForm.setValue({
      date: '2026-09-01',
      type: 'AVAILABLE',
      fullDay: true,
      startTime: '',
      endTime: '',
      timezone: 'Africa/Lagos',
      providerServiceId: '',
      providerLocationId: '',
      reason: '',
    });
    component.createException();
    expect(api.createException).toHaveBeenCalledWith('provider-id', {
      date: '2026-09-01',
      type: 'AVAILABLE',
      timezone: 'Africa/Lagos',
      providerServiceId: null,
      providerLocationId: null,
    });
  });
  it('reports blockers without claiming booking-specific eligibility', async () => {
    const { fixture } = await setup({ empty: true });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No active service capability');
    expect(text).toContain('No active provider location');
    expect(text).not.toContain('Provider is eligible');
  });
  async function setup(
    options: {
      empty?: boolean;
      createServiceError?: HttpErrorResponse;
      addonError?: HttpErrorResponse;
    } = {},
  ) {
    const services = options.empty ? [] : serviceRows();
    const api = {
      listServices: vi.fn(() => of(services)),
      createService: vi.fn(() =>
        options.createServiceError ? throwError(() => options.createServiceError) : of(services[0]),
      ),
      setServiceActive: vi.fn(() => of(services[0])),
      updateServicePrice: vi.fn((_id: string, body: unknown) => of(body)),
      getServiceAddons: vi.fn((id: string) => of(addonConfiguration(id))),
      configureServiceAddon: vi.fn(() =>
        options.addonError ? throwError(() => options.addonError) : of({}),
      ),
      deactivateServiceAddon: vi.fn(() => of({})),
      linkLocation: vi.fn(() => of(services[0])),
      unlinkLocation: vi.fn(() => of(undefined)),
      listLocations: vi.fn(() => of(options.empty ? [] : locationRows())),
      createLocation: vi.fn(() => of(locationRows()[0])),
      updateLocation: vi.fn(() => of(locationRows()[0])),
      setLocationActive: vi.fn(() => of(locationRows()[0])),
      listAvailability: vi.fn(() => of(options.empty ? [] : availabilityRows())),
      createAvailability: vi.fn(() => of(availabilityRows()[0])),
      updateAvailability: vi.fn(() => of(availabilityRows()[0])),
      setAvailabilityActive: vi.fn(() => of(availabilityRows()[0])),
      listExceptions: vi.fn(() => of([])),
      createException: vi.fn(() => of({})),
      updateException: vi.fn(() => of({})),
      setExceptionActive: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderEligibilityConfigComponent],
      providers: [
        { provide: ProviderEligibilityApiService, useValue: api },
        { provide: ProviderSelfConfigurationApiService, useValue: api },
        {
          provide: HealthCheckPackagesApiService,
          useValue: {
            getPackages: () =>
              of([
                {
                  id: 'package-id',
                  code: 'ESSENTIAL',
                  name: 'Essential',
                  description: null,
                  benefits: [],
                  estimatedDurationMinutes: 15,
                  isActive: true,
                },
              ]),
          },
        },
        {
          provide: FulfilmentModesApiService,
          useValue: {
            getFulfilmentModes: () =>
              of([
                {
                  id: 'mode-location',
                  code: 'PROVIDER_LOCATION',
                  name: 'Provider location',
                  isActive: true,
                },
                { id: 'mode-home', code: 'HOME_VISIT', name: 'Home visit', isActive: true },
              ]),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderEligibilityConfigComponent);
    fixture.componentRef.setInput('providerId', 'provider-id');
    fixture.componentRef.setInput('providerActive', !options.empty);
    fixture.componentRef.setInput('providerApproved', !options.empty);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, api };
  }
});
function serviceRows() {
  return [
    {
      id: 'service-location',
      providerId: 'provider-id',
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-location',
      priceMinor: 4500000,
      currency: 'NGN',
      isActive: true,
      providerLocationIds: ['location-id'],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'service-home',
      providerId: 'provider-id',
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-home',
      priceMinor: 6500000,
      currency: 'NGN',
      isActive: true,
      providerLocationIds: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];
}
function addonConfiguration(serviceId: string) {
  const activePrice = serviceId === 'service-location' ? 500000 : 550000;
  const base = {
    description: 'SmartClinic catalogue description',
    category: 'LAB',
    resultType: 'NONE' as const,
    unit: null,
    canonicalActive: true,
    eligibilityActive: true,
    canConfigure: true,
    configurationUnavailableReason: null,
  };
  return {
    providerServiceId: serviceId,
    currency: 'NGN',
    items: [
      {
        ...base,
        code: 'CHOLESTEROL',
        name: 'Cholesterol Test',
        offering: { priceMinor: activePrice, currency: 'NGN', isActive: true },
      },
      { ...base, code: 'ECG', name: 'ECG', offering: null },
      {
        ...base,
        code: 'VISION',
        name: 'Vision',
        offering: { priceMinor: 300000, currency: 'NGN', isActive: false },
      },
      {
        ...base,
        code: 'OLD_TEST',
        name: 'Old test',
        canonicalActive: false,
        canConfigure: false,
        configurationUnavailableReason: 'CANONICAL_CONTENT_INACTIVE' as const,
        offering: { priceMinor: 100000, currency: 'NGN', isActive: false },
      },
      {
        ...base,
        code: 'PACKAGE_OFF',
        name: 'Package off',
        eligibilityActive: false,
        canConfigure: false,
        configurationUnavailableReason: 'PACKAGE_ELIGIBILITY_INACTIVE' as const,
        offering: null,
      },
      {
        ...base,
        code: 'PROVIDER_OFF',
        name: 'Provider off',
        canConfigure: false,
        configurationUnavailableReason: 'PROVIDER_CONFIGURATION_DISABLED' as const,
        offering: null,
      },
    ],
  };
}
function locationRows() {
  return [
    {
      id: 'location-id',
      providerId: 'provider-id',
      name: 'Ikeja Clinic',
      addressLine1: '1 Road',
      addressLine2: null,
      city: 'Ikeja',
      state: 'Lagos',
      countryCode: 'NG',
      latitude: null,
      longitude: null,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];
}
function availabilityRows() {
  return [
    {
      id: 'availability-id',
      providerId: 'provider-id',
      providerServiceId: null,
      providerLocationId: null,
      dayOfWeek: 'MONDAY' as const,
      startTime: '09:00:00',
      endTime: '17:00:00',
      bookingStopTime: '16:30:00',
      timezone: 'Africa/Lagos',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];
}
