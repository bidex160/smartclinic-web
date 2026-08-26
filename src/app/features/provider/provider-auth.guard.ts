import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from '../../core/services/auth-state.service';

export const providerGuard: CanActivateFn = async () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  await authState.waitForInitialization();

  if (!authState.authenticated()) return router.createUrlTree(['/login']);
  return authState.isProvider() ? true : router.createUrlTree(['/provider/access-denied']);
};
