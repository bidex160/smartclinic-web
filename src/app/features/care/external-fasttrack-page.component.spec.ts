import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { DependantsApiService } from '../../core/services/dependants-api.service';
import { ExternalFastTrackPageComponent } from './external-fasttrack-page.component';

describe('ExternalFastTrackPageComponent', () => {
  it('shows only backend FastTrack offerings and submits references without a fee', async () => {
    const provider = {
      providerReference: 'SCPR-ABCDEF0123456789',
      displayName: 'Dynamic Clinic',
      providerType: 'CLINIC',
      location: { city: 'Ibadan', stateOrRegion: 'Oyo', countryCode: 'NG' },
      locations: [],
      services: [
        {
          code: 'DENTAL',
          name: 'Dental care',
          description: null,
          deliveryOptions: [{ deliveryMode: 'IN_PERSON', priceMinor: 1000000, currency: 'NGN' }],
          supportsAppointmentRequests: true,
          supportsFastTrack: true,
          fastTrackFeeMinor: 5000,
          fastTrackCurrency: 'NGN',
        },
        {
          code: 'GENERAL',
          name: 'General consultation',
          description: null,
          deliveryOptions: [{ deliveryMode: 'IN_PERSON', priceMinor: 0, currency: 'NGN' }],
          supportsAppointmentRequests: true,
          supportsFastTrack: false,
          fastTrackFeeMinor: null,
          fastTrackCurrency: null,
        },
      ],
    } as const;
    const find = {
      getProviders: vi.fn(() =>
        of({ items: [provider], page: 1, limit: 50, total: 1, totalPages: 1 }),
      ),
    };
    const fast = { createExternal: vi.fn(() => of({ reference: 'SC-FT-ABCDEF0123456789' })) };
    await TestBed.configureTestingModule({
      imports: [ExternalFastTrackPageComponent],
      providers: [
        provideRouter([]),
        { provide: FindCareApiService, useValue: find },
        { provide: FastTrackApiService, useValue: fast },
        {
          provide: DependantsApiService,
          useValue: { getDependants: vi.fn(() => of({ items: [] })) },
        },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ExternalFastTrackPageComponent);
    const c = fixture.componentInstance;
    c.form.patchValue({ countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Ibadan' });
    c.searchProviders();
    c.selectProvider(provider);
    c.form.patchValue({
      serviceCode: 'DENTAL',
      externalAppointmentReference: 'APT-1',
      appointmentDate: '2026-09-01',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Dental care');
    expect(fixture.nativeElement.textContent).not.toContain('General consultation');
    c.submit();
    expect(fast.createExternal).toHaveBeenCalledWith(
      expect.objectContaining({
        providerReference: provider.providerReference,
        serviceCode: 'DENTAL',
      }),
    );
    expect(fast.createExternal).not.toHaveBeenCalledWith(
      expect.objectContaining({ feeMinor: expect.anything() }),
    );
  });
  it('translates the selected state code to the external request geography name', async () => {
    const find = {
      getProviders: vi.fn(() => of({ items: [], page: 1, limit: 50, total: 0, totalPages: 0 })),
    };
    await TestBed.configureTestingModule({
      imports: [ExternalFastTrackPageComponent],
      providers: [
        provideRouter([]),
        { provide: FindCareApiService, useValue: find },
        { provide: FastTrackApiService, useValue: { createExternal: vi.fn() } },
        {
          provide: DependantsApiService,
          useValue: { getDependants: vi.fn(() => of({ items: [] })) },
        },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const c = TestBed.createComponent(ExternalFastTrackPageComponent).componentInstance;
    c.form.controls.countryCode.setValue('NG');
    c.countryChanged();
    c.fastTrackStateCode.setValue('Oyo');
    c.stateChanged();
    c.form.controls.city.setValue('Kisi');
    expect(c.fastTrackStateCode.value).toBe('Oyo');
    expect(c.form.getRawValue()).toMatchObject({
      countryCode: 'NG',
      stateOrRegion: 'Oyo',
      city: 'Kisi',
    });
    c.form.controls.countryCode.setValue('GH');
    c.countryChanged();
    expect(c.fastTrackStateCode.value).toBe('');
    expect(c.form.getRawValue()).toMatchObject({ stateOrRegion: '', city: '' });
  });

  it('uses provider-name-first FastTrack discovery and sends a dependant participant reference', async () => {
    const provider = {
      providerReference: 'SCPR-TARGET',
      displayName: 'Primed Diagnostics',
      providerType: 'CLINIC',
      location: { city: 'Ikeja', stateOrRegion: 'Lagos', countryCode: 'NG' },
      locations: [],
      services: [
        {
          code: 'GENERAL',
          name: 'General consultation',
          description: null,
          deliveryOptions: [],
          supportsAppointmentRequests: true,
          supportsFastTrack: true,
          fastTrackFeeMinor: 4000,
          fastTrackCurrency: 'NGN',
        },
      ],
    } as const;
    const find = {
      getProviders: vi.fn(() =>
        of({ items: [provider], page: 1, limit: 50, total: 1, totalPages: 1 }),
      ),
    };
    const createExternal = vi.fn(() => of({ reference: 'SC-FT-1' }));
    await TestBed.configureTestingModule({
      imports: [ExternalFastTrackPageComponent],
      providers: [
        provideRouter([]),
        { provide: FindCareApiService, useValue: find },
        { provide: FastTrackApiService, useValue: { createExternal } },
        {
          provide: DependantsApiService,
          useValue: {
            getDependants: vi.fn(() =>
              of({ items: [{ patientReference: 'SCP-CHILD', displayName: 'Aisha Okafor' }] }),
            ),
          },
        },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const c = TestBed.createComponent(ExternalFastTrackPageComponent).componentInstance;
    c.form.patchValue({ providerSearch: 'Primed' });
    c.searchProviders();
    expect(find.getProviders).toHaveBeenCalledWith({ q: 'Primed', fastTrackOnly: true, limit: 50 });
    c.selectParticipant({
      kind: 'DEPENDANT',
      patientReference: 'SCP-CHILD',
      displayName: 'Aisha Okafor',
    });
    c.selectProvider(provider);
    c.form.patchValue({
      serviceCode: 'GENERAL',
      externalAppointmentReference: 'APT-1',
      appointmentDate: '2026-09-01',
    });
    c.submit();
    expect(createExternal).toHaveBeenCalledWith(
      expect.objectContaining({ participantPatientReference: 'SCP-CHILD' }),
    );
  });
});
