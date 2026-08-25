import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PackagePrice } from '../../core/models/package-price.model';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { PackagePricesApiService } from '../../core/services/package-prices-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { PackagePricesAdminPageComponent } from './package-prices-admin-page.component';

describe('PackagePricesAdminPageComponent', () => {
  it('renders the price list with catalogue names', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Essential Health Check');
    expect(fixture.nativeElement.textContent).toContain('Provider location');
    expect(fixture.nativeElement.textContent).toContain('NGN 12500.00');
  });

  it('creates a price and refreshes the list', async () => {
    const { component, pricesApi } = await setup();
    component.createForm.setValue({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-id',
      amount: '15000.00',
      currency: 'NGN',
      effectiveFrom: '2026-09-01',
      effectiveTo: '',
    });
    component.createPrice();
    expect(pricesApi.createPackagePrice).toHaveBeenCalledWith({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-id',
      amount: '15000.00',
      currency: 'NGN',
      effectiveFrom: '2026-09-01',
    });
    expect(pricesApi.getPackagePrices).toHaveBeenCalledTimes(2);
  });

  it('schedules a future price and preserves the schedule endpoint flow', async () => {
    const { component, pricesApi } = await setup();
    component.scheduleForm.setValue({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-id',
      amount: '18000.00',
      currency: 'NGN',
      effectiveFrom: '2099-01-01',
      effectiveTo: '',
    });
    component.schedulePrice();
    expect(pricesApi.schedulePackagePrice).toHaveBeenCalledWith({
      healthCheckPackageId: 'package-id',
      fulfilmentModeId: 'mode-id',
      amount: '18000.00',
      currency: 'NGN',
      effectiveFrom: '2099-01-01',
    });
    expect(component.status()).toContain('history was preserved');
  });

  it('requires confirmation and deactivates without deletion', async () => {
    const { component, pricesApi, fixture } = await setup();
    component.requestDeactivation('price-id');
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.parentElement.classList.contains('fixed')).toBe(true);
    expect(pricesApi.deactivatePackagePrice).not.toHaveBeenCalled();
    component.confirmDeactivation('price-id');
    expect(pricesApi.deactivatePackagePrice).toHaveBeenCalledWith('price-id');
    expect(component.pendingDeactivateId()).toBeNull();
  });

  it('routes a backend 403 to the accessible access-denied page', async () => {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    await TestBed.configureTestingModule({
      imports: [PackagePricesAdminPageComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
        { provide: HealthCheckPackagesApiService, useValue: { getPackages: () => of([]) } },
        { provide: FulfilmentModesApiService, useValue: { getFulfilmentModes: () => of([]) } },
        {
          provide: PackagePricesApiService,
          useValue: {
            getPackagePrices: () => throwError(() => new HttpErrorResponse({ status: 403 })),
          },
        },
      ],
    }).compileComponents();
    TestBed.createComponent(PackagePricesAdminPageComponent);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/access-denied']);
  });

  async function setup() {
    const pricesApi = {
      getPackagePrices: vi.fn(() => of([price()])),
      createPackagePrice: vi.fn(() => of(price())),
      schedulePackagePrice: vi.fn(() => of(price())),
      deactivatePackagePrice: vi.fn(() => of({ ...price(), isActive: false })),
    };
    await TestBed.configureTestingModule({
      imports: [PackagePricesAdminPageComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
        {
          provide: HealthCheckPackagesApiService,
          useValue: {
            getPackages: () => of([{ id: 'package-id', name: 'Essential Health Check' }]),
          },
        },
        {
          provide: FulfilmentModesApiService,
          useValue: {
            getFulfilmentModes: () => of([{ id: 'mode-id', name: 'Provider location' }]),
          },
        },
        { provide: PackagePricesApiService, useValue: pricesApi },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PackagePricesAdminPageComponent);
    return { fixture, component: fixture.componentInstance, pricesApi };
  }
});

function price(): PackagePrice {
  return {
    id: 'price-id',
    healthCheckPackageId: 'package-id',
    fulfilmentModeId: 'mode-id',
    amount: '12500.00',
    currency: 'NGN',
    effectiveFrom: '2026-08-01',
    effectiveTo: null,
    isActive: true,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };
}
