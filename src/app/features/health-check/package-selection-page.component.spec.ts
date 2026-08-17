import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { API_CONFIG } from '../../core/config/api-config.token';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { BookingFlowStateService } from '../booking/booking-flow-state.service';
import { PackageSelectionPageComponent } from './package-selection-page.component';

describe('PackageSelectionPageComponent', () => {
  it('stores the full selected package and navigates to fulfilment', async () => {
    await TestBed.configureTestingModule({
      imports: [PackageSelectionPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const state = TestBed.inject(BookingFlowStateService);
    const fixture = TestBed.createComponent(PackageSelectionPageComponent);
    const healthCheckPackage: HealthCheckPackage = {
      id: 'package-id',
      code: 'FROM_API',
      name: 'API package',
      description: 'API description',
      isActive: true,
    };
    TestBed.inject(HttpTestingController)
      .expectOne('http://api.example.test/api/v1/health-check-packages')
      .flush([healthCheckPackage]);
    fixture.detectChanges();

    fixture.componentInstance.selectPackage(healthCheckPackage);

    expect(state.selectedPackage()).toEqual(healthCheckPackage);
    expect(router.navigate).toHaveBeenCalledWith(['/book/fulfilment']);
  });
});
