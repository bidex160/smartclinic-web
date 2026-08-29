import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AdminCareServicesApiService } from '../../core/services/admin-care-services-api.service';
import { AdminCareServicesPageComponent } from './admin-care-services-page.component';

describe('AdminCareServicesPageComponent', () => {
  async function setup(items: readonly ReturnType<typeof definition>[] = []) {
    const api = { list: vi.fn(() => of(items)), create: vi.fn(() => of(definition())), update: vi.fn(() => of(definition())) };
    await TestBed.configureTestingModule({ imports: [AdminCareServicesPageComponent], providers: [{ provide: AdminCareServicesApiService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(AdminCareServicesPageComponent); fixture.detectChanges();
    return { fixture, api };
  }

  it('renders the empty state and Add Care Service action', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.textContent).toContain('No Care Services have been created yet.');
    expect(fixture.nativeElement.textContent).toContain('Add Care Service');
  });

  it('creates with the exact DTO and reloads the catalogue', async () => {
    const { fixture, api } = await setup(); const c = fixture.componentInstance;
    c.openCreate(); c.form.setValue({ code: 'general_consultation', name: 'General Consultation', description: 'General consultation with a healthcare provider', clinicalRecordType: 'CONSULTATION' }); c.submit();
    expect(api.create).toHaveBeenCalledWith({ code: 'GENERAL_CONSULTATION', name: 'General Consultation', description: 'General consultation with a healthcare provider', clinicalRecordType: 'CONSULTATION' });
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('enforces required backend fields', async () => {
    const { fixture, api } = await setup(); const c = fixture.componentInstance;
    c.openCreate(); c.form.setValue({ code: '', name: '   ', description: '', clinicalRecordType: '' }); c.submit();
    expect(api.create).not.toHaveBeenCalled(); expect(c.form.invalid).toBe(true);
  });

  it('edits only supported definition fields and reloads', async () => {
    const { fixture, api } = await setup([definition()]); const c = fixture.componentInstance;
    c.openEdit(definition()); c.form.patchValue({ name: 'Primary Care Consultation' }); c.submit();
    expect(api.update).toHaveBeenCalledWith('definition-id', { code: 'GENERAL_CONSULTATION', name: 'Primary Care Consultation', description: 'General consultation', clinicalRecordType: null });
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('prepopulates, updates, and clears the configured clinical record type', async () => {
    const configured = { ...definition(), clinicalRecordType: 'CONSULTATION' as const };
    const { fixture, api } = await setup([configured]); const c = fixture.componentInstance;
    c.openEdit(configured); expect(c.form.controls.clinicalRecordType.value).toBe('CONSULTATION');
    c.form.controls.clinicalRecordType.setValue(''); c.submit();
    expect(api.update).toHaveBeenCalledWith('definition-id', expect.objectContaining({ clinicalRecordType: null }));
    expect(c.clinicalRecordTypeLabel(null)).toBe('No requirement');
  });

  it('activates and deactivates through the backend update contract', async () => {
    const { fixture, api } = await setup([definition()]); const c = fixture.componentInstance;
    c.setActive(definition(), false); expect(api.update).toHaveBeenCalledWith('definition-id', { isActive: false });
    c.setActive({ ...definition(), isActive: false }, true); expect(api.update).toHaveBeenLastCalledWith('definition-id', { isActive: true });
  });

  it('keeps the form open with safe feedback after a backend conflict', async () => {
    const { fixture, api } = await setup(); api.create.mockReturnValue(throwError(() => ({ status: 409, error: { message: 'Care service code already exists' } })));
    const c = fixture.componentInstance; c.openCreate(); c.form.setValue({ code: 'GENERAL_CONSULTATION', name: 'General Consultation', description: '', clinicalRecordType: '' }); c.submit();
    expect(c.modalOpen()).toBe(true); expect(c.form.controls.name.value).toBe('General Consultation'); expect(c.mutationError()).toBe('Care service code already exists');
  });

  it('prevents duplicate form submission while a mutation is pending', async () => {
    const { fixture, api } = await setup(); const pending = new Subject<ReturnType<typeof definition>>(); api.create.mockReturnValue(pending);
    const c = fixture.componentInstance; c.openCreate(); c.form.setValue({ code: 'GENERAL_CONSULTATION', name: 'General Consultation', description: '', clinicalRecordType: '' }); c.submit(); c.submit();
    expect(api.create).toHaveBeenCalledTimes(1);
  });
});

function definition() { return { id: 'definition-id', code: 'GENERAL_CONSULTATION', name: 'General Consultation', description: 'General consultation', clinicalRecordType: null as 'CONSULTATION' | null, isActive: true, createdAt: '2026-08-28T00:00:00Z', updatedAt: '2026-08-28T00:00:00Z' }; }
