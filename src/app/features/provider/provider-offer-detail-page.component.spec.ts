import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { ProviderOffer } from '../../core/models/provider-offer.model';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderOfferDetailPageComponent } from './provider-offer-detail-page.component';

describe('ProviderOfferDetailPageComponent', () => {
  it('renders safe operational detail and actions only for OFFERED', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ada Okafor');
    expect(text).toContain('Accept offer');
    expect(text).toContain('Decline offer');
    expect(text).not.toContain('sensitive free text');
  });

  it('shows the Health Check action only for a confirmed assignment', async () => {
    const { fixture, component } = await setup({
      getOffer: () =>
        of(
          offer({
            status: 'CONFIRMED',
            confirmedSchedule: {
              date: '2026-08-25',
              timeFrom: '09:00',
              timeTo: '10:00',
              timezone: 'Africa/Lagos',
              providerLocationName: null,
            },
          }),
        ),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Open Smart Health Check');
    component.offer.set(offer({ status: 'ACCEPTED' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Open Smart Health Check');
  });

  it('accepts once, prevents duplicate submission, and updates the offer', async () => {
    const pending = new Subject<ProviderOffer>();
    const { component, api } = await setup({ acceptOffer: () => pending });

    component.accept();
    component.accept();
    expect(api.acceptOffer).toHaveBeenCalledTimes(1);

    pending.next(offer({ status: 'ACCEPTED', acceptedAt: '2026-08-24T08:10:00Z' }));
    pending.complete();
    expect(component.offer()?.status).toBe('ACCEPTED');
    expect(component.statusMessage()).toContain('accepted');
  });

  it('declines with an optional trimmed reason and updates state', async () => {
    const { component, api } = await setup({
      declineOffer: () => of(offer({ status: 'DECLINED', responseReason: 'Unavailable' })),
    });
    component.showDecline();
    component.declineForm.controls.reason.setValue('  Unavailable  ');
    component.decline();
    expect(api.declineOffer).toHaveBeenCalledWith('offer-id', { reason: 'Unavailable' });
    expect(component.offer()?.status).toBe('DECLINED');
    expect(component.declineOpen()).toBe(false);
  });

  it('handles an expired 409 and refreshes authoritative offer state', async () => {
    const getOffer = vi
      .fn()
      .mockReturnValueOnce(of(offer()))
      .mockReturnValueOnce(of(offer({ status: 'EXPIRED' })));
    const { component } = await setup({
      getOffer,
      acceptOffer: () => throwError(() => new HttpErrorResponse({ status: 409 })),
    });
    component.accept();
    expect(component.error()).toContain('no longer actionable');
    expect(component.offer()?.status).toBe('EXPIRED');
    expect(getOffer).toHaveBeenCalledTimes(2);
  });

  it('shows a safe not-found state for a 404', async () => {
    const { component, fixture } = await setup({
      getOffer: () => throwError(() => new HttpErrorResponse({ status: 404 })),
    });
    fixture.detectChanges();
    expect(component.notFound()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('could not be found');
  });

  async function setup(
    overrides: Partial<{
      getOffer: () => ReturnType<ProviderOffersApiService['getOffer']>;
      acceptOffer: () => ReturnType<ProviderOffersApiService['acceptOffer']>;
      declineOffer: () => ReturnType<ProviderOffersApiService['declineOffer']>;
    }> = {},
  ) {
    const api = {
      getOffer: vi.fn(overrides.getOffer ?? (() => of(offer()))),
      acceptOffer: vi.fn(overrides.acceptOffer ?? (() => of(offer({ status: 'ACCEPTED' })))),
      declineOffer: vi.fn(overrides.declineOffer ?? (() => of(offer({ status: 'DECLINED' })))),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderOfferDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'offer-id' }) } },
        },
        { provide: ProviderOffersApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderOfferDetailPageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});

function offer(changes: Partial<ProviderOffer> = {}): ProviderOffer {
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
    responseReason: null,
    ...changes,
  };
}
