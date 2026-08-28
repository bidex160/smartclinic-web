import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { ProviderCareRequestsPageComponent } from './provider-care-requests-page.component';
import { ProviderFastTrackPageComponent } from './provider-fasttrack-page.component';
describe('provider care operation lists', () => {
  it('loads paginated Care Requests from provider API without patient contact assumptions', async () => {
    const api = {
      getCareRequests: vi.fn(() =>
        of({
          items: [
            {
              reference: 'SC-CARE-ABCDEF012345',
              status: 'AWAITING_PROVIDER_RESPONSE',
              service: { code: 'DENTAL', name: 'Dental care' },
              geography: { countryCode: 'NG', stateOrRegion: 'Oyo', city: 'Ibadan' },
              preferredProvider: null,
              assignedProvider: null,
              preferredDate: null,
              preferredTime: null,
              contactMethod: 'EMAIL',
              notes: null,
              createdAt: '2026-08-28T00:00:00Z',
              updatedAt: '2026-08-28T00:00:00Z',
            },
          ],
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderCareRequestsPageComponent],
      providers: [provideRouter([]), { provide: ProviderCareOperationsApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderCareRequestsPageComponent);
    fixture.detectChanges();
    expect(api.getCareRequests).toHaveBeenCalledWith(1, 20);
    expect(fixture.nativeElement.textContent).toContain('Awaiting your response');
    expect(fixture.nativeElement.textContent).not.toContain('Patient email');
  });
  it('loads FastTrack and renders both source labels', async () => {
    const base = {
      provider: {
        providerReference: 'SCPR-ABCDEF0123456789',
        displayName: 'Clinic',
        providerType: 'CLINIC',
      },
      service: { code: 'DENTAL', name: 'Dental' },
      notes: null,
      feeMinor: 5000,
      currency: 'NGN',
      paymentReady: false,
      verifiedAt: null,
      paidAt: null,
      confirmedAt: null,
      createdAt: '2026-08-28T00:00:00Z',
      updatedAt: '2026-08-28T00:00:00Z',
    };
    const api = {
      getFastTrackRequests: vi.fn(() =>
        of({
          items: [
            {
              ...base,
              reference: 'SC-FT-1111111111111111',
              source: 'EXTERNAL_APPOINTMENT',
              status: 'VERIFYING',
              careRequestReference: null,
              externalAppointment: {
                reference: 'APT',
                appointmentDate: '2026-09-01',
                appointmentTime: null,
                department: null,
                doctorName: null,
              },
            },
            {
              ...base,
              reference: 'SC-FT-2222222222222222',
              source: 'SMARTCLINIC_CARE_REQUEST',
              status: 'READY_FOR_PAYMENT',
              careRequestReference: 'SC-CARE-ABCDEF012345',
              externalAppointment: null,
            },
          ],
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderFastTrackPageComponent],
      providers: [provideRouter([]), { provide: ProviderCareOperationsApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderFastTrackPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('External appointment');
    expect(fixture.nativeElement.textContent).toContain('SmartClinic request');
  });
});
