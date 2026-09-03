import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES } from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';
import { AdminHealthCheckClinicalContentDetailPageComponent } from './admin-health-check-clinical-content-detail-page.component';

describe('AdminHealthCheckClinicalContentDetailPageComponent', () => {
  it('selects the existing category and offers only authoritative choices', async () => {
    const { component, fixture } = await setup(content());
    const select = fixture.nativeElement.querySelector(
      '#clinical-content-category',
    ) as HTMLSelectElement;
    expect(select.value).toBe('VITALS');
    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      '',
      ...HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES.map((category) => category.value),
    ]);
    expect(component.form.controls.category.value).toBe('VITALS');
  });

  it('submits a changed authoritative category without changing unrelated fields', async () => {
    const { component, api } = await setup(content());
    component.form.patchValue({ category: 'SERVICE', name: 'Updated review', displayOrder: 12 });
    component.save();
    expect(api.updateClinicalContent).toHaveBeenCalledWith('SC-HCC-1', {
      name: 'Updated review',
      description: 'Existing description',
      category: 'SERVICE',
      displayOrder: 12,
    });
  });

  it('preserves an unknown historical category until a supported replacement is chosen', async () => {
    const { component, fixture, api } = await setup(content({ category: 'HISTORICAL' }));
    const select = fixture.nativeElement.querySelector(
      '#clinical-content-category',
    ) as HTMLSelectElement;
    expect(select.value).toBe('HISTORICAL');
    expect(select.selectedOptions[0].disabled).toBe(true);
    expect(select.selectedOptions[0].textContent).toContain('historical');
    expect(component.form.controls.category.valid).toBe(true);
    component.save();
    expect(api.updateClinicalContent).toHaveBeenCalledWith(
      'SC-HCC-1',
      expect.objectContaining({ category: 'HISTORICAL' }),
    );
    component.form.controls.category.setValue('ARBITRARY');
    expect(component.form.controls.category.invalid).toBe(true);
  });

  it('displays result type and unit as friendly read-only metadata', async () => {
    const { fixture } = await setup(
      content({ resultType: 'SINGLE_NUMERIC' as const, unit: 'mg/dL' }),
    );
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Result type');
    expect(text).toContain('Single numeric value');
    expect(text).toContain('Unit');
    expect(text).toContain('mg/dL');
    expect(fixture.nativeElement.querySelector('[formControlName="resultType"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[formControlName="unit"]')).toBeNull();
  });

  it('displays NONE content without an applicable unit', async () => {
    const { fixture } = await setup(content());
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('None');
    expect(text).toContain('Not applicable');
  });

  async function setup(value: ReturnType<typeof content>) {
    const api = {
      clinicalContentDetail: vi.fn(() => of(value)),
      updateClinicalContent: vi.fn(() => of(value)),
      setClinicalContentActive: vi.fn(() => of(value)),
    };
    await TestBed.configureTestingModule({
      imports: [AdminHealthCheckClinicalContentDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ reference: 'SC-HCC-1' }) } },
        },
        { provide: AdminHealthCheckCatalogueApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminHealthCheckClinicalContentDetailPageComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, fixture, api };
  }
});

function content(changes: Record<string, unknown> = {}) {
  return {
    reference: 'SC-HCC-1',
    code: 'CLINICIAN_REVIEW',
    name: 'Clinician review',
    description: 'Existing description',
    category: 'VITALS',
    resultType: 'NONE' as const,
    unit: null,
    displayOrder: 7,
    isActive: true,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    includedInPackages: [],
    optionalForPackages: [],
    activeProviderOfferingCount: 0,
    ...changes,
  };
}
