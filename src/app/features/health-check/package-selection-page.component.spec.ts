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
      code: 'ESSENTIAL',
      name: 'API package',
      description: 'API description',
      benefits: ['API benefit'],
      estimatedDurationMinutes: 45,
      isActive: true,
    };
    TestBed.inject(HttpTestingController)
      .expectOne('http://api.example.test/api/v1/health-check-packages/catalogue')
      .flush([
        {
          code: 'ESSENTIAL',
          name: 'Essential Health Check',
          description: 'API description',
          benefits: [],
          estimatedDurationMinutes: 45,
          isActive: true,
          includedContents: [
            { code: 'BP', name: 'API content', category: 'MEASUREMENT', description: null },
          ],
          optionalAddons: [],
          fromPriceMinor: null,
          currency: null,
          fulfilmentModes: [],
        },
      ]);
    TestBed.inject(HttpTestingController)
      .expectOne('http://api.example.test/api/v1/health-check-packages')
      .flush([healthCheckPackage]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('API content');
    expect(fixture.nativeElement.textContent).toContain('Price shown after you choose a provider');
    expect(fixture.nativeElement.textContent).toContain('45 minutes');
    expect(fixture.nativeElement.textContent).not.toContain('price');

    fixture.componentInstance.selectPackage(fixture.componentInstance.packages()[0]);

    expect(state.selectedPackage()).toEqual(healthCheckPackage);
    expect(router.navigate).toHaveBeenCalledWith(['/book/fulfilment']);
  });

  it('accepts an arbitrary backend-defined package code', async () => {
    await TestBed.configureTestingModule({
      imports: [PackageSelectionPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PackageSelectionPageComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://api.example.test/api/v1/health-check-packages/catalogue').flush([
      {
        code: 'EXECUTIVE',
        name: 'Executive Health Check',
        description: null,
        benefits: [],
        estimatedDurationMinutes: 90,
        isActive: true,
        includedContents: [],
        optionalAddons: [],
        fromPriceMinor: 1500000,
        currency: 'NGN',
        fulfilmentModes: [],
      },
    ]);
    http.expectOne('http://api.example.test/api/v1/health-check-packages').flush([
      {
        id: 'executive-id',
        code: 'EXECUTIVE',
        name: 'Executive Health Check',
        description: null,
        benefits: [],
        estimatedDurationMinutes: 90,
        isActive: true,
      },
    ]);
    fixture.detectChanges();
    expect(fixture.componentInstance.packages().map((item) => item.code)).toEqual(['EXECUTIVE']);
    expect(fixture.nativeElement.textContent).toContain('Executive Health Check');
  });
});
