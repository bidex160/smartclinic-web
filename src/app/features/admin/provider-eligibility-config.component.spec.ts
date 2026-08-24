import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { ProviderEligibilityApiService } from '../../core/services/provider-eligibility-api.service';
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
    });
    first.component.createService();
    expect(first.api.createService).toHaveBeenCalledWith('provider-id', {
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-location',
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
    });
    conflict.component.createService();
    expect(conflict.component.error()).toContain('conflicts');
    expect(conflict.component.error()).not.toContain('constraint');
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
      countryCode: 'ng',
    });
    component.createLocation();
    expect(api.createLocation).toHaveBeenCalledWith('provider-id', {
      name: 'New clinic',
      addressLine1: '2 Road',
      city: 'Ikeja',
      state: 'Lagos',
      countryCode: 'NG',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[name="locationId"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="number"]')).toBeNull();
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
  async function setup(options: { empty?: boolean; createServiceError?: HttpErrorResponse } = {}) {
    const services = options.empty ? [] : serviceRows();
    const api = {
      listServices: vi.fn(() => of(services)),
      createService: vi.fn(() =>
        options.createServiceError ? throwError(() => options.createServiceError) : of(services[0]),
      ),
      setServiceActive: vi.fn(() => of(services[0])),
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
                  prices: [],
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
      isActive: true,
      providerLocationIds: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];
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
