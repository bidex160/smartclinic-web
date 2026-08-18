import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

export const authenticatedUserGuard: CanActivateFn = async () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  await authState.waitForInitialization();
  return authState.authenticated() ? true : router.createUrlTree(['/admin/login']);
};
