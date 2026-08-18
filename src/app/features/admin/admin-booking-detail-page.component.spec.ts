import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { AdminBookingDetail } from '../../core/models/admin-booking-detail.model';
import { AdminBookingsApiService } from '../../core/services/admin-bookings-api.service';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AdminBookingDetailPageComponent } from './admin-booking-detail-page.component';

describe('AdminBookingDetailPageComponent', () => {
  it('renders the safe operational projection and a confirmed assignment', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Essential Health Check');
    expect(text).toContain('Ada Okafor');
    expect(text).toContain('Care Provider');
    expect(text).toContain('Confirmed');
    expect(text).toContain('Provider assigned');
    expect(text).not.toContain('internal-provider-id');
    expect(text).not.toContain('1990-01-01');
  });

  it('handles absent funding, payment, assignment, and registered-booker fields without inference', async () => {
    const { fixture } = await setup({
      booking: detail({
        bookerContact: {
          givenName: null,
          familyName: null,
          email: 'account@example.test',
          phone: null,
        },
        funding: { fundingStatus: null, fundingType: null, amount: null, currency: null },
        payment: { status: null, paymentReference: null, paidAt: null },
        assignment: emptyAssignment(),
      }),
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No assignment yet');
    expect(text).toContain('Not started');
    expect(text).toContain('Not available');
    expect(text).toContain('account@example.test');
    expect(text).not.toContain('Ada Okafor Not available');
  });

  it('shows Start matching only when backend readiness is READY', async () => {
    const ready = await setup({
      booking: detail({ readiness: 'READY', assignment: emptyAssignment() }),
    });
    ready.fixture.detectChanges();
    expect(button(ready.fixture, 'Start matching')).toBeTruthy();

    ready.component.booking.set(
      detail({ readiness: 'FUNDING_INCOMPLETE', assignment: emptyAssignment() }),
    );
    ready.fixture.detectChanges();
    expect(button(ready.fixture, 'Start matching')).toBeFalsy();
    expect(ready.fixture.nativeElement.textContent).toContain('Funding incomplete');
  });

  it('prevents duplicate matching and refreshes detail after success', async () => {
    const pending = new Subject<any>();
    const { component, api } = await setup({
      booking: detail({ readiness: 'READY', assignment: emptyAssignment() }),
      startMatching: () => pending,
    });
    component.startMatching();
    component.startMatching();
    expect(api.startMatching).toHaveBeenCalledTimes(1);
    pending.next({
      bookingReference: 'SC-2026-ABCDEF123456',
      bookingStatus: 'PENDING_PROVIDER_MATCH',
      outcome: 'OFFER_CREATED',
      assignmentId: 'assignment-id',
      assignmentStatus: 'OFFERED',
      offerExpiresAt: null,
    });
    pending.complete();
    expect(api.getBooking).toHaveBeenCalledTimes(2);
    expect(component.createdAssignmentId()).toBe('assignment-id');
  });

  async function setup(options: { booking?: AdminBookingDetail; startMatching?: () => any } = {}) {
    const api = {
      getBooking: vi.fn(() => of(options.booking ?? detail())),
      startMatching: vi.fn(
        options.startMatching ??
          (() =>
            of({
              bookingReference: 'SC-2026-ABCDEF123456',
              bookingStatus: 'PENDING_PROVIDER_MATCH',
              outcome: 'OFFER_CREATED',
              assignmentId: 'assignment-id',
              assignmentStatus: 'OFFERED',
              offerExpiresAt: null,
            })),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [AdminBookingDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ reference: 'SC-2026-ABCDEF123456' }) },
          },
        },
        { provide: AdminBookingsApiService, useValue: api },
        { provide: AdminProviderAssignmentsApiService, useValue: api },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminBookingDetailPageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});

function button(fixture: any, label: string): HTMLButtonElement | undefined {
  return [...fixture.nativeElement.querySelectorAll('button')].find(
    (element: HTMLButtonElement) => element.textContent?.trim() === label,
  );
}

function emptyAssignment(): AdminBookingDetail['assignment'] {
  return {
    assignmentId: null,
    assignmentStatus: null,
    providerName: null,
    offeredAt: null,
    acceptedAt: null,
    confirmedAt: null,
    expiresAt: null,
  };
}

function detail(changes: Partial<AdminBookingDetail> = {}): AdminBookingDetail {
  return {
    bookingReference: 'SC-2026-ABCDEF123456',
    status: 'PROVIDER_ASSIGNED',
    createdAt: '2026-08-18T08:00:00Z',
    updatedAt: '2026-08-18T09:00:00Z',
    package: { code: 'ESSENTIAL', name: 'Essential Health Check' },
    fulfilmentMode: { code: 'HOME_VISIT', name: 'Home visit' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    bookerContact: {
      givenName: 'Chidi',
      familyName: 'Okafor',
      email: 'booker@example.test',
      phone: '+2348000000000',
    },
    preferredDate: '2026-09-01',
    preferredTimeFrom: '09:00',
    preferredTimeTo: '11:00',
    preferredTimezone: 'Africa/Lagos',
    locationNote: 'Reception',
    quotedAmount: '12500.00',
    quotedCurrency: 'NGN',
    funding: { fundingStatus: 'SETTLED', fundingType: 'SELF', amount: '12500.00', currency: 'NGN' },
    payment: {
      status: 'SUCCEEDED',
      paymentReference: 'safe-payment-ref',
      paidAt: '2026-08-18T08:30:00Z',
    },
    assignment: {
      assignmentId: 'assignment-id',
      assignmentStatus: 'CONFIRMED',
      providerName: 'Care Provider',
      offeredAt: '2026-08-18T08:40:00Z',
      acceptedAt: '2026-08-18T08:50:00Z',
      confirmedAt: '2026-08-18T09:00:00Z',
      expiresAt: '2026-08-18T09:10:00Z',
    },
    readiness: 'ALREADY_ASSIGNED',
    ...changes,
  };
}
