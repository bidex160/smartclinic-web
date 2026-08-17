import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from '../../core/services/auth-state.service';

export const adminPricingGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.authenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  return authState.canManagePricing() ? true : router.createUrlTree(['/admin/access-denied']);
};
