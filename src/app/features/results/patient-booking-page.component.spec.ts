import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
import { PatientBookingPageComponent } from './patient-booking-page.component';

describe('PatientBookingPageComponent geography', () => {
  it('keeps the UI state code separate from the persisted state name', async () => {
    await TestBed.configureTestingModule({
      imports: [PatientBookingPageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckPackagesApiService, useValue: { getPackages: () => of([]) } },
        { provide: FulfilmentModesApiService, useValue: { getFulfilmentModes: () => of([]) } },
        { provide: HealthCheckResultsApiService, useValue: {} },
        {
          provide: LocationDataService,
          useValue: {
            getCountries: () => [{ name: 'Nigeria', isoCode: 'NG' }],
            getStates: (countryCode: string) => countryCode === 'NG' ? [
              { name: 'Lagos', isoCode: 'LA', countryCode: 'NG' },
              { name: 'Oyo', isoCode: 'Oyo', countryCode: 'NG' },
            ] : [],
            getCities: (_countryCode: string, stateCode: string) =>
              stateCode === 'Oyo'
                ? [{ name: 'Kisi', stateCode: 'Oyo', countryCode: 'NG' }, { name: 'Ibadan', stateCode: 'Oyo', countryCode: 'NG' }]
                : [{ name: 'Ikeja', stateCode: 'LA', countryCode: 'NG' }],
          },
        },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(PatientBookingPageComponent).componentInstance;
    component.onSelfCountryChange('NG');
    component.onSelfStateChange('Oyo');
    component.visitAddressForm.controls.city.setValue('Kisi');
    expect(component.bookingStateCode.value).toBe('Oyo');
    expect(component.visitAddressForm.getRawValue()).toMatchObject({ countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Kisi' });
    component.onSelfCountryChange('GH');
    expect(component.bookingStateCode.value).toBe('');
    expect(component.visitAddressForm.getRawValue()).toMatchObject({ stateOrRegion: '', city: '' });
  });
});
