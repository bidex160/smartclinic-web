import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { API_CONFIG } from '../config/api-config.token';
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

  it('clears in-memory auth and redirects on an API 401', () => {
    const { auth, api, http, router } = setup();
    authenticate(auth);
    api.getCurrentUser().subscribe({ error: () => undefined });
    http
      .expectOne('http://api.example.test/api/v1/auth/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.authenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
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
