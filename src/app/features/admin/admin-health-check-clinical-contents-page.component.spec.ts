import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES } from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';
import { AdminHealthCheckClinicalContentsPageComponent } from './admin-health-check-clinical-contents-page.component';

describe('AdminHealthCheckClinicalContentsPageComponent', () => {
  it('renders Category as a select with only the authoritative values and no default selection', async () => {
    const { component, fixture } = await setup();
    component.creating.set(true);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector(
      '#clinical-content-category',
    ) as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.closest('form')?.querySelector('input[formcontrolname="category"]')).toBeNull();
    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      '',
      ...HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES.map((category) => category.value),
    ]);
    expect(Array.from(select.options).map((option) => option.textContent?.trim())).toEqual([
      'Select category',
      'Vitals',
      'Laboratory',
      'Screening',
      'Assessment',
      'Service',
      'Other',
    ]);
    expect(select.value).toBe('');
    expect(select.options[0].disabled).toBe(true);
    expect(component.createForm.controls.category.invalid).toBe(true);
  });

  it('submits the exact selected category and preserves unrelated create fields', async () => {
    const { component, api } = await setup();
    component.createForm.setValue({
      code: 'CLINICIAN_CONSULTATION',
      name: 'Clinician consultation',
      description: 'A review',
      category: 'LAB',
      resultType: 'NONE',
      unit: '',
      displayOrder: 5,
      isActive: false,
    });
    component.create();
    expect(api.createClinicalContent).toHaveBeenCalledWith({
      code: 'CLINICIAN_CONSULTATION',
      name: 'Clinician consultation',
      description: 'A review',
      category: 'LAB',
      resultType: 'NONE',
      unit: null,
      displayOrder: 5,
      isActive: false,
    });
  });

  it('rejects arbitrary categories even if assigned outside the normal select UI', async () => {
    const { component, api } = await setup();
    component.createForm.setValue({
      code: 'CLINICIAN_CONSULTATION',
      name: 'Clinician consultation',
      description: '',
      category: 'custom spelling',
      resultType: 'NONE',
      unit: '',
      displayOrder: 0,
      isActive: true,
    });
    expect(component.createForm.controls.category.hasError('unsupportedCategory')).toBe(true);
    component.create();
    expect(api.createClinicalContent).not.toHaveBeenCalled();
  });

  it('keeps server filtering and renders the supported result-type choices', async () => {
    const { component, api, fixture } = await setup();
    component.filters.patchValue({
      search: 'consult',
      isActive: 'false',
      category: 'SERVICE',
      resultType: 'NONE',
    });
    component.applyFilters();
    expect(api.listClinicalContents).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: 'consult',
        isActive: false,
        category: 'SERVICE',
        resultType: 'NONE',
        page: 1,
        limit: 25,
      }),
    );
    component.creating.set(true);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector(
      '#clinical-content-result-type',
    ) as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      'NONE',
      'SINGLE_NUMERIC',
      'BLOOD_PRESSURE',
    ]);
    expect(Array.from(select.options).map((option) => option.textContent?.trim())).toEqual([
      'None',
      'Single numeric value',
      'Blood pressure',
    ]);
    expect(fixture.nativeElement.textContent).not.toContain('limited to non-measurement content');
  });

  it('does not require or submit a stale unit for NONE', async () => {
    const { component, api, fixture } = await setup();
    component.createForm.patchValue({
      code: 'CLINICIAN_REVIEW',
      name: 'Clinician review',
      category: 'SERVICE',
      resultType: 'SINGLE_NUMERIC',
      unit: 'mg/dL',
    });
    component.resultTypeChanged();
    component.createForm.controls.resultType.setValue('NONE');
    component.resultTypeChanged();
    fixture.detectChanges();
    expect(component.createForm.controls.unit.value).toBe('');
    expect(component.createForm.controls.unit.valid).toBe(true);
    expect(fixture.nativeElement.querySelector('#clinical-content-unit')).toBeNull();
    component.create();
    expect(api.createClinicalContent).toHaveBeenCalledWith(
      expect.objectContaining({ resultType: 'NONE', unit: null }),
    );
  });

  it.each([
    ['SINGLE_NUMERIC', 'mg/dL'],
    ['BLOOD_PRESSURE', 'mmHg'],
  ] as const)('requires and submits trimmed Unit for %s', async (resultType, unit) => {
    const { component, api, fixture } = await setup();
    component.creating.set(true);
    component.createForm.patchValue({
      code: resultType === 'SINGLE_NUMERIC' ? 'CHOLESTEROL' : 'RESTING_BP',
      name: resultType === 'SINGLE_NUMERIC' ? 'Cholesterol' : 'Resting blood pressure',
      category: resultType === 'SINGLE_NUMERIC' ? 'LAB' : 'VITALS',
      resultType,
      unit: '',
    });
    component.resultTypeChanged();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#clinical-content-unit') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(component.createForm.controls.unit.hasError('required')).toBe(true);
    component.createForm.controls.unit.setValue('   ');
    expect(component.createForm.controls.unit.hasError('required')).toBe(true);
    component.createForm.controls.unit.setValue(`  ${unit}  `);
    component.create();
    expect(api.createClinicalContent).toHaveBeenCalledWith(
      expect.objectContaining({ resultType, unit }),
    );
  });

  async function setup() {
    const api = {
      listClinicalContents: vi.fn(() =>
        of({ items: [], page: 1, limit: 25, total: 0, totalPages: 0 }),
      ),
      createClinicalContent: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [AdminHealthCheckClinicalContentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AdminHealthCheckCatalogueApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminHealthCheckClinicalContentsPageComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, fixture, api };
  }
});
