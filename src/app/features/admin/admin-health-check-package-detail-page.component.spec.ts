import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminHealthCheckPackageDetail } from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';
import { AdminHealthCheckPackageDetailPageComponent } from './admin-health-check-package-detail-page.component';

describe('AdminHealthCheckPackageDetailPageComponent', () => {
  it('keeps code immutable and manages composition, order, eligibility, and metadata through the API', async () => {
    const detail: AdminHealthCheckPackageDetail = {
      code: 'ESSENTIAL',
      name: 'Essential',
      description: 'Core package',
      benefits: ['Prevention'],
      estimatedDurationMinutes: 30,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
      includedContents: [
        {
          reference: 'HC-1',
          code: 'CONSULTATION',
          name: 'Consultation',
          description: null,
          category: 'SERVICE',
          resultType: 'NONE',
          unit: null,
          displayOrder: 0,
          isActive: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          sortOrder: 0,
          compositionActive: true,
          canonicalContentActive: true,
        },
      ],
      optionalAddons: [],
    };
    const api = {
      packageDetail: vi.fn(() => of(detail)),
      listClinicalContents: vi.fn(() =>
        of({ items: [], page: 1, limit: 100, total: 0, totalPages: 0 }),
      ),
      updatePackage: vi.fn(() => of(detail)),
      setPackageActive: vi.fn(() => of(detail)),
      addIncludedContent: vi.fn(() => of(detail)),
      setIncludedContentActive: vi.fn(() => of(detail)),
      reorderIncludedContents: vi.fn(() => of(detail)),
      addOptionalAddon: vi.fn(() => of(detail)),
      setOptionalAddonActive: vi.fn(() => of(detail)),
    };
    await TestBed.configureTestingModule({
      imports: [AdminHealthCheckPackageDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['code', 'ESSENTIAL']]) } },
        },
        { provide: AdminHealthCheckCatalogueApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminHealthCheckPackageDetailPageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('ESSENTIAL');
    expect(fixture.nativeElement.querySelector('input[formcontrolname="code"]')).toBeNull();
    expect(text).toContain('provider');
    expect(text).not.toContain('Provider price');
    expect(text).not.toContain('Delete');
    fixture.componentInstance.packageForm.patchValue({ name: 'Updated', benefits: 'One\nTwo' });
    fixture.componentInstance.savePackage();
    expect(api.updatePackage).toHaveBeenCalledWith(
      'ESSENTIAL',
      expect.objectContaining({ name: 'Updated', benefits: ['One', 'Two'] }),
    );
    fixture.componentInstance.setIncluded('HC-1', true);
    expect(api.setIncludedContentActive).toHaveBeenCalledWith('ESSENTIAL', 'HC-1', true);
    fixture.componentInstance.setAddon('HC-2', true);
    expect(api.setOptionalAddonActive).toHaveBeenCalledWith('ESSENTIAL', 'HC-2', true);
  });
});
