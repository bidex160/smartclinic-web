import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

export const builderGuard: CanActivateFn = async () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  await authState.waitForInitialization();
  if (!authState.authenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: '/builder/dashboard' } });
  }
  return authState.isBuilder() ? true : router.createUrlTree(['/me/dashboard']);
};
