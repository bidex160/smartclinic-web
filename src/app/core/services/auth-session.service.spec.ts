import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { LoginResponse } from '../models/auth.model';
import { AuthApiService } from './auth-api.service';
import { AuthSessionService } from './auth-session.service';
import { AuthStateService } from './auth-state.service';

describe('AuthSessionService', () => {
  it('restores a session once and completes startup initialization', async () => {
    const { api, sessionService, state } = setup({ refresh: () => of(session()) });

    await Promise.all([sessionService.restoreSession(), sessionService.restoreSession()]);

    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(state.authenticated()).toBe(true);
    expect(state.initializing()).toBe(false);
  });

  it('treats an absent refresh session as an unauthenticated completed startup', async () => {
    const { sessionService, state } = setup({
      refresh: () => throwError(() => new HttpErrorResponse({ status: 401 })),
    });

    await sessionService.restoreSession();

    expect(state.authenticated()).toBe(false);
    expect(state.initializing()).toBe(false);
    expect(state.error()).toBeNull();
  });

  it('keeps access credentials in signal state only', async () => {
    const { sessionService, state } = setup({ refresh: () => of(session()) });
    const localStorageSpy = vi.spyOn(window.localStorage, 'setItem');
    const sessionStorageSpy = vi.spyOn(window.sessionStorage, 'setItem');

    await sessionService.restoreSession();

    expect(state.accessToken()).toBe('restored-token');
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
  });

  it('logs out and clears local state', async () => {
    const { api, sessionService, state, router } = setup({ logout: () => of(undefined) });
    state.setSession(session());

    expect(await firstValueFrom(sessionService.logout())).toBe(true);

    expect(api.logout).toHaveBeenCalledOnce();
    expect(state.authenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears local state when backend logout fails', async () => {
    const { sessionService, state } = setup({
      logout: () => throwError(() => new HttpErrorResponse({ status: 0 })),
    });
    state.setSession(session());

    expect(await firstValueFrom(sessionService.logout())).toBe(false);
    expect(state.authenticated()).toBe(false);
  });

  it('supports logout-all and clears the session', async () => {
    const { api, sessionService, state } = setup({ logoutAll: () => of(undefined) });
    state.setSession(session());

    expect(await firstValueFrom(sessionService.logoutAll())).toBe(true);
    expect(api.logoutAll).toHaveBeenCalledOnce();
    expect(state.authenticated()).toBe(false);
  });

  function setup(
    overrides: Partial<Record<'refresh' | 'logout' | 'logoutAll', () => Observable<unknown>>>,
  ) {
    const api = {
      refresh: vi.fn(overrides.refresh ?? (() => of(session()))),
      logout: vi.fn(overrides.logout ?? (() => of(undefined))),
      logoutAll: vi.fn(overrides.logoutAll ?? (() => of(undefined))),
    };
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: api },
        { provide: Router, useValue: router },
      ],
    });
    return {
      api,
      router,
      sessionService: TestBed.inject(AuthSessionService),
      state: TestBed.inject(AuthStateService),
    };
  }
});

function session(): LoginResponse {
  return {
    accessToken: 'restored-token',
    user: {
      id: 'id',
      email: 'admin@example.test',
      displayName: 'Admin',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    },
  };
}
