import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { UserRole } from '../../core/models/auth.model';
import { AuthStateService } from '../../core/services/auth-state.service';
import { adminPricingGuard } from './admin-auth.guards';

describe('adminPricingGuard', () => {
  it.each<UserRole>(['ADMIN', 'OPERATIONS'])('allows the %s role', (role) => {
    const { state } = setup();
    authenticate(state, [role]);

    expect(runGuard()).toBe(true);
  });

  it('redirects an unauthenticated user to admin login', () => {
    const { router } = setup();
    expect(runGuard()).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/login']);
  });

  it('redirects an authenticated USER to access denied', () => {
    const { state, router } = setup();
    authenticate(state, ['USER']);
    expect(runGuard()).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/access-denied']);
  });

  function setup() {
    const router = { createUrlTree: vi.fn(() => ({ redirected: true }) as unknown as UrlTree) };
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
    return { state: TestBed.inject(AuthStateService), router };
  }

  function runGuard() {
    return TestBed.runInInjectionContext(() => adminPricingGuard({} as never, {} as never));
  }
});

function authenticate(state: AuthStateService, roles: UserRole[]): void {
  state.setSession({
    accessToken: 'token',
    user: { id: 'id', email: 'user@example.test', displayName: 'User', roles, status: 'ACTIVE' },
  });
}
