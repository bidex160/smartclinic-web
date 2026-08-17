import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { BookingFlowStateService } from './booking-flow-state.service';
import { hasCompleteBookingDraftGuard, hasSelectedPackageGuard } from './booking-flow.guards';

describe('booking flow guards', () => {
  it('redirects direct fulfilment access when no package is selected', () => {
    const router = { createUrlTree: vi.fn(() => ({ redirected: true }) as unknown as UrlTree) };
    TestBed.configureTestingModule({
      providers: [BookingFlowStateService, { provide: Router, useValue: router }],
    });

    const result = TestBed.runInInjectionContext(() =>
      hasSelectedPackageGuard({} as never, {} as never),
    );

    expect(result).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/health-check/packages'], {
      queryParams: { flow: 'restart' },
    });
  });

  it('redirects review to details when selections exist but saved details do not', () => {
    const router = { createUrlTree: vi.fn(() => ({ redirected: true }) as unknown as UrlTree) };
    TestBed.configureTestingModule({
      providers: [BookingFlowStateService, { provide: Router, useValue: router }],
    });
    const state = TestBed.inject(BookingFlowStateService);
    state.selectPackage({
      id: 'package-id',
      code: 'PACKAGE',
      name: 'Package',
      description: null,
      benefits: [],
      estimatedDurationMinutes: null,
      prices: [
        {
          fulfilmentModeId: 'mode-id',
          fulfilmentModeCode: 'MODE',
          fulfilmentModeName: 'Mode',
          amount: '100.00',
          currency: 'API',
        },
      ],
      isActive: true,
    });
    state.selectFulfilmentMode({ id: 'mode-id', code: 'MODE', name: 'Mode', isActive: true });

    const result = TestBed.runInInjectionContext(() =>
      hasCompleteBookingDraftGuard({} as never, {} as never),
    );

    expect(result).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/book/details']);
  });
});
