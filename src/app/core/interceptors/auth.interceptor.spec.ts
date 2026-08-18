import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY, SKIP_STAFF_AUTH } from '../config/http-context.tokens';
import { AuthStateService } from '../services/auth-state.service';
import { AuthApiService } from '../services/auth-api.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('attaches a bearer token only to configured API requests', () => {
    const { auth, api, http } = setup();
    authenticate(auth);

    api.getCurrentUser().subscribe();
    const apiRequest = http.expectOne('http://api.example.test/api/v1/auth/me');
    expect(apiRequest.request.headers.get('Authorization')).toBe('Bearer token');
    apiRequest.flush(user());

    TestBed.inject(HttpClient).get('https://external.example.test/data').subscribe();
    const externalRequest = http.expectOne('https://external.example.test/data');
    expect(externalRequest.request.headers.has('Authorization')).toBe(false);
    externalRequest.flush({});
    http.verify();
  });

  it('keeps cookie-authorized public booking requests out of staff auth handling', () => {
    const { auth, http } = setup();
    authenticate(auth);
    let failed = false;
    TestBed.inject(HttpClient)
      .get('http://api.example.test/api/v1/public/bookings/SC-REF', {
        withCredentials: true,
        context: new HttpContext().set(SKIP_STAFF_AUTH, true),
      })
      .subscribe({ error: () => (failed = true) });

    const request = http.expectOne('http://api.example.test/api/v1/public/bookings/SC-REF');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    http.expectNone('http://api.example.test/api/v1/auth/refresh');
    expect(auth.authenticated()).toBe(true);
    http.verify();
  });

  it('refreshes once and retries the original request with the new token', () => {
    const { auth, api, http } = setup();
    authenticate(auth);
    let response: unknown;
    api.getCurrentUser().subscribe((value) => (response = value));
    http
      .expectOne('http://api.example.test/api/v1/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = http.expectOne('http://api.example.test/api/v1/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush({ accessToken: 'new-token', user: user() });

    const retry = http.expectOne('http://api.example.test/api/v1/auth/me');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush(user());
    expect(response).toEqual(user());
    http.verify();
  });

  it('clears in-memory auth and redirects when refresh fails', () => {
    const { auth, api, http, router } = setup();
    authenticate(auth);
    api.getCurrentUser().subscribe({ error: () => undefined });
    http
      .expectOne('http://api.example.test/api/v1/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('http://api.example.test/api/v1/auth/refresh')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.authenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
    http.verify();
  });

  it('shares one refresh operation across simultaneous 401 responses', () => {
    const { auth, api, http } = setup();
    authenticate(auth);
    api.getCurrentUser().subscribe();
    api.getCurrentUser().subscribe();
    const originals = http.match('http://api.example.test/api/v1/auth/me');
    expect(originals).toHaveLength(2);
    originals.forEach((request) => request.flush({}, { status: 401, statusText: 'Unauthorized' }));

    const refreshes = http.match('http://api.example.test/api/v1/auth/refresh');
    expect(refreshes).toHaveLength(1);
    refreshes[0].flush({ accessToken: 'new-token', user: user() });
    const retries = http.match('http://api.example.test/api/v1/auth/me');
    expect(retries).toHaveLength(2);
    retries.forEach((request) => request.flush(user()));
    http.verify();
  });

  it('does not refresh a failed refresh request or retry an original request twice', () => {
    const { api, http } = setup();
    api.refresh().subscribe({ error: () => undefined });
    http
      .expectOne('http://api.example.test/api/v1/auth/refresh')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectNone('http://api.example.test/api/v1/auth/refresh');

    api.getCurrentUser().subscribe({ error: () => undefined });
    http
      .expectOne('http://api.example.test/api/v1/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('http://api.example.test/api/v1/auth/refresh')
      .flush({ accessToken: 'new-token', user: user() });
    http
      .expectOne('http://api.example.test/api/v1/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectNone('http://api.example.test/api/v1/auth/refresh');
    http.verify();
  });

  it('refreshes the session without replaying an opted-out mutation', () => {
    const { auth, http } = setup();
    authenticate(auth);
    let failed = false;
    TestBed.inject(HttpClient)
      .post('http://api.example.test/api/v1/provider/offers/id/accept', null, {
        context: new HttpContext().set(SKIP_AUTH_RETRY, true),
      })
      .subscribe({ error: () => (failed = true) });
    http
      .expectOne('http://api.example.test/api/v1/provider/offers/id/accept')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('http://api.example.test/api/v1/auth/refresh')
      .flush({ accessToken: 'new-token', user: user() });
    http.expectNone('http://api.example.test/api/v1/provider/offers/id/accept');
    expect(failed).toBe(true);
    expect(auth.authenticated()).toBe(true);
    http.verify();
  });

  function setup() {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
        { provide: Router, useValue: router },
      ],
    });
    return {
      auth: TestBed.inject(AuthStateService),
      api: TestBed.inject(AuthApiService),
      http: TestBed.inject(HttpTestingController),
      router,
    };
  }
});

function authenticate(state: AuthStateService): void {
  state.setSession({ accessToken: 'token', user: user() });
}

function user() {
  return {
    id: 'id',
    email: 'admin@example.test',
    displayName: 'Admin',
    roles: ['ADMIN' as const],
    status: 'ACTIVE' as const,
  };
}
