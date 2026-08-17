import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { BookingFlowStateService } from './booking-flow-state.service';
import { hasSelectedPackageGuard } from './booking-flow.guards';

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
});
