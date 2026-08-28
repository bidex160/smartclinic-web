import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProviderCareServiceOffering } from '../../core/models/find-care.model';
import { ProviderCareServicesApiService } from '../../core/services/provider-care-services-api.service';
import { ProviderCareServicesPageComponent } from './provider-care-services-page.component';

describe('ProviderCareServicesPageComponent', () => {
  const definition = {
    id: 'definition-id', code: 'GENERAL', name: 'API General Care',
    description: 'From API', isActive: true,
  };

  async function setup(existing: readonly unknown[] = []) {
    const api = {
      getCatalogue: vi.fn(() => of([definition])),
      getOfferings: vi.fn(() => of(existing)),
      create: vi.fn((body) => of(body)),
      update: vi.fn((reference, body) => of({ reference, ...body })),
      setActive: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderCareServicesPageComponent],
      providers: [{ provide: ProviderCareServicesApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderCareServicesPageComponent);
    fixture.detectChanges();
    return { fixture, api };
  }

  it('submits only selected delivery options with independent prices', async () => {
    const { fixture, api } = await setup();
    const c = fixture.componentInstance;
    c.openCreate();
    c.form.patchValue({ careServiceDefinitionId: 'definition-id' });
    c.toggleMode('IN_PERSON');
    c.toggleMode('VIRTUAL');
    c.form.patchValue({ inPersonCurrency: 'NGN', inPersonPrice: '15000.50', virtualCurrency: 'NGN', virtualPrice: '10000' });
    c.save();
    const payload = api.create.mock.calls[0][0];
    expect(payload.deliveryOptions).toEqual([
      { deliveryMode: 'IN_PERSON', priceMinor: 1500050, currency: 'NGN' },
      { deliveryMode: 'VIRTUAL', priceMinor: 1000000, currency: 'NGN' },
    ]);
    expect(payload).not.toHaveProperty('deliveryModes');
    expect(payload).not.toHaveProperty('priceMinor');
    expect(payload).not.toHaveProperty('currency');
  });

  it('allows an explicit free price but rejects blank and negative selected-mode prices', async () => {
    const { fixture, api } = await setup();
    const c = fixture.componentInstance;
    c.openCreate();
    c.form.patchValue({ careServiceDefinitionId: 'definition-id' });
    c.toggleMode('VIRTUAL');
    c.form.patchValue({ virtualCurrency: 'NGN', virtualPrice: '' });
    c.save();
    expect(api.create).not.toHaveBeenCalled();
    c.form.controls.virtualPrice.setValue('-1');
    c.save();
    expect(api.create).not.toHaveBeenCalled();
    c.form.controls.virtualPrice.setValue('0');
    c.save();
    expect(api.create.mock.calls[0][0].deliveryOptions).toEqual([
      { deliveryMode: 'VIRTUAL', priceMinor: 0, currency: 'NGN' },
    ]);
  });

  it('prepopulates options, sends replacement set, and keeps FastTrack independent', async () => {
    const offering: ProviderCareServiceOffering = {
      id: 'offering-id', careServiceDefinitionId: 'definition-id', definition,
      descriptionOverride: null, isActive: true,
      deliveryOptions: [
        { deliveryMode: 'IN_PERSON', priceMinor: '1500000', currency: 'NGN' },
        { deliveryMode: 'VIRTUAL', priceMinor: '1000000', currency: 'NGN' },
      ],
      supportsAppointmentRequests: true, supportsFastTrack: true,
      fastTrackFeeMinor: '300000', fastTrackCurrency: 'NGN',
      createdAt: '2026-08-28T00:00:00Z', updatedAt: '2026-08-28T00:00:00Z',
    };
    const { fixture, api } = await setup([offering]);
    const c = fixture.componentInstance;
    c.openEdit(offering);
    expect(c.form.controls.inPersonPrice.value).toBe('15000.00');
    expect(c.form.controls.virtualPrice.value).toBe('10000.00');
    c.toggleMode('IN_PERSON');
    c.form.controls.virtualPrice.setValue('12000');
    c.save();
    const payload = api.update.mock.calls[0][1];
    expect(payload.deliveryOptions).toEqual([
      { deliveryMode: 'VIRTUAL', priceMinor: 1200000, currency: 'NGN' },
    ]);
    expect(payload.fastTrackFeeMinor).toBe(300000);
  });

  it('preserves form values when an update fails', async () => {
    const offering: ProviderCareServiceOffering = {
      id: 'offering-id', careServiceDefinitionId: 'definition-id', definition,
      descriptionOverride: null, isActive: true,
      deliveryOptions: [{ deliveryMode: 'VIRTUAL', priceMinor: '1000000', currency: 'NGN' }],
      supportsAppointmentRequests: true, supportsFastTrack: false,
      fastTrackFeeMinor: null, fastTrackCurrency: null,
      createdAt: '2026-08-28T00:00:00Z', updatedAt: '2026-08-28T00:00:00Z',
    };
    const { fixture, api } = await setup([offering]);
    api.update.mockReturnValue(throwError(() => ({ error: { message: 'Conflict' } })));
    const c = fixture.componentInstance;
    c.openEdit(offering);
    c.form.controls.virtualPrice.setValue('12500');
    c.save();
    expect(c.form.controls.virtualPrice.value).toBe('12500');
    expect(c.editorOpen()).toBe(true);
  });
});
