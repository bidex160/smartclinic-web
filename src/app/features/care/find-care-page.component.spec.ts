import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { FindCarePageComponent } from './find-care-page.component';
describe('FindCarePageComponent', () => {
  const services = [
    { code: 'DENTAL', name: 'Dental care', description: 'Dental services', providerCount: 1 },
  ];
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
        priceMinor: null,
        currency: null,
        priceOnRequest: true,
        supportsAppointmentRequests: true,
        supportsFastTrack: true,
        fastTrackFeeMinor: 5000,
        fastTrackCurrency: 'NGN',
      },
    ],
  };
  async function setup(authenticated = true) {
    const find = {
      getServices: vi.fn(() => of(services)),
      getProviders: vi.fn(() =>
        of({ items: [provider], page: 1, limit: 50, total: 1, totalPages: 1 }),
      ),
    };
    const care = {
      create: vi.fn(() =>
        of({
          reference: 'SC-CARE-ABCDEF012345',
          status: 'AWAITING_PROVIDER_RESPONSE',
          service: { code: 'DENTAL', name: 'Dental care' },
          geography: { countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Ibadan' },
          preferredProvider: provider,
          assignedProvider: provider,
          preferredDate: null,
          preferredTime: null,
          contactMethod: 'EMAIL',
          notes: null,
          createdAt: '2026-08-28T00:00:00Z',
          updatedAt: '2026-08-28T00:00:00Z',
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [FindCarePageComponent],
      providers: [
        provideRouter([]),
        { provide: FindCareApiService, useValue: find },
        { provide: CareRequestsApiService, useValue: care },
        {
          provide: AuthStateService,
          useValue: { authenticated: () => authenticated, isPatient: () => authenticated },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FindCarePageComponent);
    fixture.detectChanges();
    return { fixture, find, care, router: TestBed.inject(Router) };
  }
  it('renders API services, discovers by location/service and submits providerReference', async () => {
    const { fixture, find, care } = await setup();
    const c = fixture.componentInstance;
    c.form.patchValue({
      countryCode: 'NG',
      stateOrRegion: 'Oyo',
      city: 'Ibadan',
      serviceCode: 'DENTAL',
      preferredProviderReference: '',
    });
    c.discoverProviders();
    fixture.detectChanges();
    expect(find.getProviders).toHaveBeenCalledWith(
      expect.objectContaining({ serviceCode: 'DENTAL', city: 'Ibadan' }),
    );
    expect(fixture.nativeElement.textContent).toContain('Dynamic Clinic');
    c.form.controls.preferredProviderReference.setValue(provider.providerReference);
    c.submit();
    expect(care.create).toHaveBeenCalledWith(
      expect.objectContaining({ preferredProviderReference: provider.providerReference }),
    );
    expect(fixture.nativeElement.textContent).not.toContain('FastTrack</option>');
  });
  it('submits no provider field for no preference', async () => {
    const { fixture, care } = await setup();
    const c = fixture.componentInstance;
    c.form.patchValue({
      countryCode: 'NG',
      stateOrRegion: 'Oyo',
      city: 'Ibadan',
      serviceCode: 'DENTAL',
      preferredProviderReference: '',
    });
    c.submit();
    expect(care.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ preferredProviderReference: expect.anything() }),
    );
  });
  it('preserves intent in memory and routes unauthenticated users to login', async () => {
    const { fixture, care, router } = await setup(false);
    const nav = vi.spyOn(router, 'navigate');
    const c = fixture.componentInstance;
    c.form.patchValue({
      countryCode: 'NG',
      stateOrRegion: 'Oyo',
      city: 'Ibadan',
      serviceCode: 'DENTAL',
    });
    c.submit();
    expect(care.create).not.toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/request-care' } });
  });
});
