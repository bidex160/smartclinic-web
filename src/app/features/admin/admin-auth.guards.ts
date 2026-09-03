import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from '../../core/services/auth-state.service';

export const adminPricingGuard: CanActivateFn = async () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  await authState.waitForInitialization();

  if (!authState.authenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authState.canManagePricing() ? true : router.createUrlTree(['/admin/access-denied']);
};

export const adminOnlyGuard: CanActivateFn = async () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  await authState.waitForInitialization();
  if (!authState.authenticated()) return router.createUrlTree(['/login']);
  return authState.currentUser()?.roles.includes('ADMIN')
    ? true
    : router.createUrlTree(['/admin/access-denied']);
};
