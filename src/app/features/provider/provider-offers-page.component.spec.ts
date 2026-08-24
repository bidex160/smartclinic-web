import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ProviderOffer } from '../../core/models/provider-offer.model';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderOffersPageComponent } from './provider-offers-page.component';

describe('ProviderOffersPageComponent', () => {
  it('renders only the safe offer fields supplied by the provider API', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Essential Health Check');
    expect(text).toContain('Ada Okafor');
    expect(text).toContain('Africa/Lagos');
    expect(text).not.toContain('sensitive free text');
    expect(text).not.toContain('+2348000000000');
  });

  it('passes the selected status filter to the API', async () => {
    const { component, api } = await setup();
    component.filterForm.controls.status.setValue('EXPIRED');
    component.loadOffers();
    expect(api.getOffers).toHaveBeenLastCalledWith('EXPIRED');
  });

  it('keeps confirmed work out of the default offers view', async () => {
    const api = {
      getOffers: vi.fn(() =>
        of([
          offer(),
          offer({
            assignmentId: 'confirmed',
            status: 'CONFIRMED',
            confirmedSchedule: {
              date: '2026-08-25',
              timeFrom: '09:00',
              timeTo: '09:15',
              timezone: 'Africa/Lagos',
              providerLocationName: null,
            },
          }),
        ]),
      ),
    };
    const { fixture } = await setup(api);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('confirmed');
    expect(fixture.nativeElement.textContent).toContain('Essential Health Check');
  });

  async function setup(providedApi?: { getOffers: ReturnType<typeof vi.fn> }) {
    const api = providedApi ?? { getOffers: vi.fn(() => of([offer()])) };
    await TestBed.configureTestingModule({
      imports: [ProviderOffersPageComponent],
      providers: [
        provideRouter([]),
        { provide: ProviderOffersApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderOffersPageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});

export function offer(changes: Partial<ProviderOffer> = {}): ProviderOffer {
  return {
    assignmentId: 'offer-id',
    status: 'OFFERED',
    offeredAt: '2026-08-24T08:00:00Z',
    expiresAt: '2026-08-24T08:30:00Z',
    respondedAt: null,
    acceptedAt: null,
    bookingReference: 'SC-2026-ABCDEF123456',
    healthCheckPackage: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    preferredDate: '2026-08-24',
    preferredTimeWindowStart: '09:00',
    preferredTimeWindowEnd: '11:00',
    preferredTimezone: 'Africa/Lagos',
    confirmedSchedule: null,
    visitAddress: null,
    responseReason: null,
    ...changes,
  };
}
