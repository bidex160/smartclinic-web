import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProviderCareServicesApiService } from '../../core/services/provider-care-services-api.service';
import { ProviderCareServicesPageComponent } from './provider-care-services-page.component';
describe('ProviderCareServicesPageComponent', () => {
  const definition = {
    id: 'definition-id',
    code: 'GENERAL',
    name: 'API General Care',
    description: 'From API',
    isActive: true,
  };
  async function setup() {
    const api = {
      getCatalogue: vi.fn(() => of([definition])),
      getOfferings: vi.fn(() => of([])),
      create: vi.fn((body) => of(body)),
      update: vi.fn((body) => of(body)),
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
  it('loads catalogue without a hardcoded service and submits exact modes and price-on-request nulls', async () => {
    const { fixture, api } = await setup();
    expect(fixture.nativeElement.textContent).toContain('API General Care');
    const c = fixture.componentInstance;
    c.openCreate();
    c.form.patchValue({
      careServiceDefinitionId: 'definition-id',
      description: 'Remote care',
      supportsAppointmentRequests: true,
      pricingMode: 'REQUEST',
      supportsFastTrack: false,
    });
    c.toggleMode('VIRTUAL');
    c.save();
    expect(api.create).toHaveBeenCalledWith(
      expect.objectContaining({
        careServiceDefinitionId: 'definition-id',
        deliveryModes: ['VIRTUAL'],
        priceMinor: null,
        currency: null,
        supportsFastTrack: false,
        fastTrackFeeMinor: null,
        fastTrackCurrency: null,
      }),
    );
    const payload = api.create.mock.calls[0][0];
    expect(payload).not.toHaveProperty('meetingUrl');
    expect(payload).not.toHaveProperty('chat');
  });
  it('requires at least one mode and converts fixed and FastTrack fees', async () => {
    const { fixture, api } = await setup();
    const c = fixture.componentInstance;
    c.openCreate();
    c.form.patchValue({
      careServiceDefinitionId: 'definition-id',
      pricingMode: 'FIXED',
      currency: 'NGN',
      price: '15000.00',
      supportsFastTrack: true,
      fastTrackCurrency: 'NGN',
      fastTrackFee: '3000.00',
    });
    c.save();
    expect(api.create).not.toHaveBeenCalled();
    expect(c.modeError()).toBe(true);
    c.toggleMode('IN_PERSON');
    c.toggleMode('VIRTUAL');
    c.save();
    expect(api.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryModes: ['IN_PERSON', 'VIRTUAL'],
        priceMinor: 1500000,
        fastTrackFeeMinor: 300000,
      }),
    );
  });
});
