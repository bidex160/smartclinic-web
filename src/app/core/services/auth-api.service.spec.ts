import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  it('registers a patient account without roles or patient identifiers', () => {
    const { api, http } = setup();
    api
      .register({
        givenName: 'Ada',
        familyName: 'Okafor',
        email: 'ada@example.test',
        phone: '+2348000000000',
        password: 'secure-password',
      })
      .subscribe();
    const request = http.expectOne('http://api.example.test/api/v1/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      givenName: 'Ada',
      familyName: 'Okafor',
      email: 'ada@example.test',
      phone: '+2348000000000',
      password: 'secure-password',
    });
    expect(request.request.body).not.toEqual(
      expect.objectContaining({ roles: expect.anything(), patientId: expect.anything() }),
    );
    request.flush(session().user);
  });
  it.each(['login', 'refresh', 'logout', 'logout-all'])(
    'sends credentials for the %s request',
    (operation) => {
      const { api, http } = setup();
      if (operation === 'login')
        api.login({ identifier: '+234 801 234 5678', password: 'secret' }).subscribe();
      if (operation === 'refresh') api.refresh().subscribe();
      if (operation === 'logout') api.logout().subscribe();
      if (operation === 'logout-all') api.logoutAll().subscribe();

      const request = http.expectOne(`http://api.example.test/api/v1/auth/${operation}`);
      expect(request.request.withCredentials).toBe(true);
      if (operation === 'login') {
        expect(request.request.body).toEqual({
          identifier: '+234 801 234 5678',
          password: 'secret',
        });
        expect(request.request.body.email).toBeUndefined();
      }
      request.flush(operation === 'login' || operation === 'refresh' ? session() : null);
      http.verify();
    },
  );

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    return {
      api: TestBed.inject(AuthApiService),
      http: TestBed.inject(HttpTestingController),
    };
  }
});

function session() {
  return {
    accessToken: 'token',
    user: {
      id: 'id',
      email: 'admin@example.test',
      displayName: 'Admin',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    },
  };
}
