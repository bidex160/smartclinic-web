import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { PublicBookingResponse } from '../../core/models/public-booking.model';
import { BookingFlowStateService } from './booking-flow-state.service';
import { BookingConfirmationPageComponent } from './booking-confirmation-page.component';

describe('BookingConfirmationPageComponent', () => {
  const confirmation: PublicBookingResponse = {
    bookingReference: 'SC-REF',
    status: 'DRAFT',
    healthCheckPackage: { code: 'PACKAGE', name: 'Smart package' },
    fulfilmentMode: { code: 'MODE', name: 'Provider location' },
    participant: { givenName: 'Ada', familyName: 'Okafor' },
    quotedAmount: null,
    currency: null,
    preferredDate: null,
    preferredTimeWindowStart: null,
    preferredTimeWindowEnd: null,
    createdAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z',
  };

  it('renders matching in-memory confirmation state and resets for another booking', async () => {
    const { fixture, state, router } = await setup();
    state.completeBooking(confirmation);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SC-REF');
    expect(fixture.nativeElement.textContent).toContain('Smart package');

    fixture.componentInstance.bookAnother();

    expect(state.confirmation()).toBeNull();
    expect(state.selectedPackage()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/health-check/packages']);
  });

  it('shows safe recovery when confirmation state was lost after refresh', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Confirmation details are no longer available',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Ada Okafor');
  });

  async function setup() {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    await TestBed.configureTestingModule({
      imports: [BookingConfirmationPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ reference: 'SC-REF' }) } },
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    return {
      fixture: TestBed.createComponent(BookingConfirmationPageComponent),
      state: TestBed.inject(BookingFlowStateService),
      router,
    };
  }
});
