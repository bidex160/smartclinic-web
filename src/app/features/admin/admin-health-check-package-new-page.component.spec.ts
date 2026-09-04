import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AdminHealthCheckPackageDetail } from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';
import { AdminHealthCheckPackageNewPageComponent } from './admin-health-check-package-new-page.component';

describe('AdminHealthCheckPackageNewPageComponent', () => {
  it('validates required fields, code format, and duration bounds', async () => {
    const { component } = await setup();
    expect(component.form.invalid).toBe(true);
    component.form.controls.name.setValue('Executive Health Check');
    component.form.controls.code.setValue('1INVALID');
    expect(component.form.controls.code.invalid).toBe(true);
    component.form.controls.code.setValue('EXECUTIVE');
    component.form.controls.estimatedDurationMinutes.setValue(0);
    expect(component.form.controls.estimatedDurationMinutes.invalid).toBe(true);
    component.form.controls.estimatedDurationMinutes.setValue(1441);
    expect(component.form.controls.estimatedDurationMinutes.invalid).toBe(true);
    component.form.controls.estimatedDurationMinutes.setValue(60);
    expect(component.form.valid).toBe(true);
  });

  it('normalizes code and sends the exact DTO without isActive or blank benefits', async () => {
    const { component, api } = await setup();
    component.form.patchValue({
      name: ' Executive Health Check ',
      code: 'executive',
      description: ' Broader preventive package ',
      estimatedDurationMinutes: 75,
    });
    component.normalizeCode();
    component.addBenefit();
    component.addBenefit();
    component.benefits.at(0).setValue(' Broader preventive health screening ');
    component.benefits.at(1).setValue('   ');
    component.create();
    expect(api.createPackage).toHaveBeenCalledWith({
      code: 'EXECUTIVE',
      name: 'Executive Health Check',
      description: 'Broader preventive package',
      benefits: ['Broader preventive health screening'],
      estimatedDurationMinutes: 75,
    });
  });

  it('prevents duplicate submission while pending and navigates using the returned code', async () => {
    const pending = new Subject<AdminHealthCheckPackageDetail>();
    const { component, api, router } = await setup(pending);
    component.form.patchValue({ name: 'Executive Health Check', code: 'EXECUTIVE' });
    component.create();
    component.create();
    expect(api.createPackage).toHaveBeenCalledTimes(1);
    expect(component.submitting()).toBe(true);
    pending.next(packageDetail('EXECUTIVE_2026'));
    pending.complete();
    expect(router.navigate).toHaveBeenCalledWith([
      '/admin/health-checks/packages',
      'EXECUTIVE_2026',
    ]);
  });

  it('surfaces a safe backend conflict message', async () => {
    const conflict = throwError(
      () =>
        new HttpErrorResponse({
          status: 409,
          error: { message: 'A Health Check package with this code already exists.' },
        }),
    );
    const { component } = await setup(conflict);
    component.form.patchValue({ name: 'Executive Health Check', code: 'EXECUTIVE' });
    component.create();
    expect(component.error()).toBe('A Health Check package with this code already exists.');
  });

  async function setup(response = of(packageDetail('EXECUTIVE'))) {
    const api = { createPackage: vi.fn(() => response) };
    await TestBed.configureTestingModule({
      imports: [AdminHealthCheckPackageNewPageComponent],
      providers: [
        provideRouter([]),
        { provide: AdminHealthCheckCatalogueApiService, useValue: api },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AdminHealthCheckPackageNewPageComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, fixture, api, router };
  }
});

function packageDetail(code: string): AdminHealthCheckPackageDetail {
  return {
    code,
    name: 'Executive Health Check',
    description: null,
    benefits: [],
    estimatedDurationMinutes: null,
    isActive: false,
    createdAt: '2026-09-04T09:00:00Z',
    updatedAt: '2026-09-04T09:00:00Z',
    includedContents: [],
    optionalAddons: [],
  };
}
