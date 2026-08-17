import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { UserRole } from '../../core/models/auth.model';
import { AuthStateService } from '../../core/services/auth-state.service';
import { providerGuard } from './provider-auth.guard';

describe('providerGuard', () => {
  it('allows an authenticated PROVIDER after restoration', async () => {
    const { state } = setup();
    authenticate(state, ['PROVIDER']);
    state.completeInitialization();
    expect(await runGuard()).toBe(true);
  });

  it.each<[string, UserRole[]]>([
    ['USER', ['USER']],
    ['ADMIN without PROVIDER', ['ADMIN']],
    ['OPERATIONS without PROVIDER', ['OPERATIONS']],
  ])('denies %s', async (_name, roles) => {
    const { state, router } = setup();
    authenticate(state, roles);
    state.completeInitialization();
    expect(await runGuard()).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/provider/access-denied']);
  });

  it('allows a PROVIDER combined with another role', async () => {
    const { state } = setup();
    authenticate(state, ['ADMIN', 'PROVIDER']);
    state.completeInitialization();
    expect(await runGuard()).toBe(true);
  });

  function setup() {
    const router = { createUrlTree: vi.fn(() => ({ redirected: true }) as unknown as UrlTree) };
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
    return { state: TestBed.inject(AuthStateService), router };
  }

  function runGuard() {
    return TestBed.runInInjectionContext(() => providerGuard({} as never, {} as never));
  }
});

function authenticate(state: AuthStateService, roles: UserRole[]): void {
  state.setSession({
    accessToken: 'token',
    user: {
      id: 'id',
      email: 'provider@example.test',
      displayName: 'Provider',
      roles,
      status: 'ACTIVE',
    },
  });
}
