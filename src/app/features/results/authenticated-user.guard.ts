import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

/** Signed-out visitors go to sign-in and come straight back to the page they asked for. */
export const authenticatedUserGuard: CanActivateFn = async (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  await authState.waitForInitialization();
  if (!authState.authenticated()) {
    return state?.url
      ? router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
      : router.createUrlTree(['/login']);
  }
  return authState.isPatient() ? true : router.createUrlTree(['/me/access-denied']);
};
