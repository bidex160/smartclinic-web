import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
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
      ],
    }).compileComponents();
    const component = TestBed.createComponent(PatientBookingPageComponent).componentInstance;
    component.onSelfCountryChange('NG');
    component.onSelfStateChange('OY');
    component.visitAddressForm.controls.city.setValue('Kisi');
    expect(component.bookingStateCode.value).toBe('OY');
    expect(component.visitAddressForm.getRawValue()).toMatchObject({ countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Kisi' });
    component.onSelfCountryChange('GH');
    expect(component.bookingStateCode.value).toBe('');
    expect(component.visitAddressForm.getRawValue()).toMatchObject({ stateOrRegion: '', city: '' });
  });
});
