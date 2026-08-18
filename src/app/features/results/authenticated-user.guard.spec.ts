import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { authenticatedUserGuard } from './authenticated-user.guard';

describe('authenticatedUserGuard', () => {
  it('allows any authenticated user after restoration without a role requirement', async () => {
    const { state } = setup();
    state.setSession({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'user@example.test',
        displayName: 'User',
        roles: ['USER'],
        status: 'ACTIVE',
      },
    });
    state.completeInitialization();
    expect(await run()).toBe(true);
  });
  it('waits for restoration before redirecting an unauthenticated user', async () => {
    const { state, router } = setup();
    let settled = false;
    const result = (run() as Promise<unknown>).then((value: unknown) => {
      settled = true;
      return value;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    state.completeInitialization();
    expect(await result).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/login']);
  });
  function setup() {
    const router = { createUrlTree: vi.fn(() => ({ redirect: true }) as unknown as UrlTree) };
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
    return { state: TestBed.inject(AuthStateService), router };
  }
  function run() {
    return TestBed.runInInjectionContext(() => authenticatedUserGuard({} as never, {} as never));
  }
});
