import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';
import { AdminHealthCheckPackagesPageComponent } from './admin-health-check-packages-page.component';

describe('AdminHealthCheckPackagesPageComponent', () => {
  it('renders existing and arbitrary backend packages with the create action', async () => {
    const packages = ['ESSENTIAL', 'COMPLETE', 'EXECUTIVE'].map((code) => ({
      code,
      name: `${code} Health Check`,
      description: null,
      benefits: [],
      estimatedDurationMinutes: null,
      isActive: code !== 'EXECUTIVE',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
      includedContentCount: 0,
      optionalAddonCount: 0,
    }));
    await TestBed.configureTestingModule({
      imports: [AdminHealthCheckPackagesPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AdminHealthCheckCatalogueApiService,
          useValue: { listPackages: () => of(packages) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminHealthCheckPackagesPageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('ESSENTIAL');
    expect(text).toContain('COMPLETE');
    expect(text).toContain('EXECUTIVE');
    expect(
      fixture.nativeElement.querySelector('a[href="/admin/health-checks/packages/new"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('a[href="/admin/health-checks/packages/EXECUTIVE"]'),
    ).not.toBeNull();
  });
});
