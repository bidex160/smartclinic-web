import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { BookingFlowStateService } from './booking-flow-state.service';

export const hasSelectedPackageGuard: CanActivateFn = () => {
  const bookingFlow = inject(BookingFlowStateService);
  const router = inject(Router);
  return bookingFlow.canAccessFulfilment()
    ? true
    : router.createUrlTree(['/health-check/packages'], { queryParams: { flow: 'restart' } });
};

export const hasBookingSelectionsGuard: CanActivateFn = () => {
  const bookingFlow = inject(BookingFlowStateService);
  const router = inject(Router);

  if (!bookingFlow.selectedPackage()) {
    return router.createUrlTree(['/health-check/packages'], { queryParams: { flow: 'restart' } });
  }

  return bookingFlow.canAccessDetails() ? true : router.createUrlTree(['/book/fulfilment']);
};

export const hasCompleteBookingDraftGuard: CanActivateFn = () => {
  const bookingFlow = inject(BookingFlowStateService);
  const router = inject(Router);

  if (!bookingFlow.selectedPackage()) {
    return router.createUrlTree(['/health-check/packages'], { queryParams: { flow: 'restart' } });
  }
  if (!bookingFlow.canAccessDetails()) {
    return router.createUrlTree(['/book/fulfilment']);
  }
  return bookingFlow.details() ? true : router.createUrlTree(['/book/details']);
};
