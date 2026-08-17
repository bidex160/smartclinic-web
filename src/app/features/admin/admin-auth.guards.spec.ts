import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { UserRole } from '../../core/models/auth.model';
import { AuthStateService } from '../../core/services/auth-state.service';
import { adminPricingGuard } from './admin-auth.guards';

describe('adminPricingGuard', () => {
  it.each<UserRole>(['ADMIN', 'OPERATIONS'])('allows the %s role', async (role) => {
    const { state } = setup();
    authenticate(state, [role]);
    state.completeInitialization();

    expect(await runGuard()).toBe(true);
  });

  it('redirects an unauthenticated user to admin login', async () => {
    const { state, router } = setup();
    state.completeInitialization();
    expect(await runGuard()).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/login']);
  });

  it('redirects an authenticated USER to access denied', async () => {
    const { state, router } = setup();
    authenticate(state, ['USER']);
    state.completeInitialization();
    expect(await runGuard()).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/access-denied']);
  });

  it('waits for restoration before allowing a restored ADMIN', async () => {
    const { state } = setup();
    const result = runGuard() as Promise<unknown>;
    let settled = false;
    void result.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);

    authenticate(state, ['ADMIN']);
    state.completeInitialization();
    expect(await result).toBe(true);
  });

  it('denies a restored USER after initialization', async () => {
    const { state, router } = setup();
    const result = runGuard() as Promise<unknown>;
    authenticate(state, ['USER']);
    state.completeInitialization();
    expect(await result).not.toBe(true);
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
