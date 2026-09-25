import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { ProviderEligibilityApiService } from '../../core/services/provider-eligibility-api.service';
import { ProviderSelfConfigurationApiService } from '../../core/services/provider-self-configuration-api.service';
import { ProviderServiceAreasApiService } from '../../core/services/provider-service-areas-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
import { ProviderServiceAreasComponent } from './provider-service-areas.component';

describe('ProviderServiceAreasComponent', () => {
  it('lists HOME_VISIT services, creates scoped areas, and never asks for raw IDs', async () => {
    const create = vi.fn(() => of(area()));
    const fixture = await setup({ create });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.setValue({
      providerServiceId: 'home-service',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: '',
      postalCode: '',
      travelFee: 0,
      priority: 100,
      originLatitude: null,
      originLongitude: null,
      maxRadiusKm: null,
    });
    component.save();
    expect(create).toHaveBeenCalledWith({
      providerServiceId: 'home-service',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: null,
      postalCode: null,
      priority: 100,
      originLatitude: null,
      originLongitude: null,
      maxRadiusKm: null,
    });
    expect(JSON.stringify(create.mock.calls[0])).not.toContain('providerId');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('whole state or region');
    expect(text).not.toContain('provider ID');
  });

  it('sanitizes duplicate conflicts', async () => {
    const fixture = await setup({
      create: () =>
        throwError(
          () => new HttpErrorResponse({ status: 409, error: { message: 'raw ownership' } }),
        ),
    });
    const component = fixture.componentInstance;
    component.form.setValue({
      providerServiceId: 'home-service',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
      postalCode: '',
      travelFee: 0,
      priority: 100,
      originLatitude: null,
      originLongitude: null,
      maxRadiusKm: null,
    });
    component.save();
    expect(component.error()).toContain('conflicts');
    expect(component.error()).not.toContain('raw ownership');
  });
  it('preselects an edited state by ISO code while preserving its state and city names', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.edit({ ...area(), stateOrRegion: 'Oyo', city: 'Kisi' });
    expect(component.areaStateCode.value).toBe('Oyo');
    expect(component.form.getRawValue()).toMatchObject({ countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Kisi' });
    component.onAreaStateChange('LA');
    expect(component.form.getRawValue()).toMatchObject({ stateOrRegion: 'Lagos', city: '' });
  });
});

async function setup(overrides: Record<string, unknown> = {}) {
  const areaApi = {
    listOwn: () => of([area()]),
    listForAdmin: () => of([area()]),
    create: () => of(area()),
    update: () => of(area()),
    setActive: () => of(area()),
    ...overrides,
  };
  const services = [
    {
      id: 'home-service',
      providerId: 'hidden',
      healthCheckPackageId: 'pkg',
      fulfilmentModeId: 'home',
      isActive: true,
      providerLocationIds: [],
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'clinic-service',
      providerId: 'hidden',
      healthCheckPackageId: 'pkg',
      fulfilmentModeId: 'clinic',
      isActive: true,
      providerLocationIds: [],
      createdAt: '',
      updatedAt: '',
    },
  ];
  await TestBed.configureTestingModule({
    imports: [ProviderServiceAreasComponent],
    providers: [
      { provide: ProviderServiceAreasApiService, useValue: areaApi },
      {
        provide: ProviderSelfConfigurationApiService,
        useValue: { listServices: () => of(services) },
      },
      { provide: ProviderEligibilityApiService, useValue: { listServices: () => of(services) } },
      {
        provide: HealthCheckPackagesApiService,
        useValue: {
          getPackages: () =>
            of([
              {
                id: 'pkg',
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
        provide: LocationDataService,
        useValue: {
          getCountries: () => [{ name: 'Nigeria', isoCode: 'NG' }],
          getStates: () => [
            { name: 'Lagos', isoCode: 'LA', countryCode: 'NG' },
            { name: 'Oyo', isoCode: 'Oyo', countryCode: 'NG' },
          ],
          getCities: (_countryCode: string, stateCode: string) =>
            stateCode === 'Oyo'
              ? [{ name: 'Kisi', stateCode: 'Oyo', countryCode: 'NG' }]
              : [{ name: 'Ikeja', stateCode: 'LA', countryCode: 'NG' }],
        },
      },
      {
        provide: FulfilmentModesApiService,
        useValue: {
          getFulfilmentModes: () =>
            of([
              { id: 'home', code: 'HOME_VISIT', name: 'Home visit', isActive: true },
              {
                id: 'clinic',
                code: 'PROVIDER_LOCATION',
                name: 'Provider location',
                isActive: true,
              },
            ]),
        },
      },
    ],
  }).compileComponents();
  return TestBed.createComponent(ProviderServiceAreasComponent);
}

function area() {
  return {
    id: 'area-id',
    providerId: 'hidden',
    providerServiceId: 'home-service',
    countryCode: 'NG',
    stateOrRegion: 'Lagos',
    city: null,
    postalCode: null,
    travelFeeMinor: '0.00',
    priority: 100,
    originLatitude: null,
    originLongitude: null,
    maxRadiusKm: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  };
}
