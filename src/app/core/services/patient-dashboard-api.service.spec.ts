import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { PatientDashboardApiService } from './patient-dashboard-api.service';

describe('PatientDashboardApiService', () => {
  let api: PatientDashboardApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    api = TestBed.inject(PatientDashboardApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('loads the authoritative patient dashboard', () => {
    api.getDashboard().subscribe();
    const request = http.expectOne('/api/v1/me/dashboard');
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
  it('loads and patches only patient-editable profile fields', () => {
    api.getProfile().subscribe();
    let request = http.expectOne('/api/v1/me/profile');
    expect(request.request.method).toBe('GET');
    request.flush({});
    api
      .updateProfile({
        givenName: 'Ada',
        familyName: 'Okafor',
        phone: null,
        dateOfBirth: '1990-01-01',
      })
      .subscribe();
    request = http.expectOne('/api/v1/me/profile');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      givenName: 'Ada',
      familyName: 'Okafor',
      phone: null,
      dateOfBirth: '1990-01-01',
    });
    expect(request.request.body.email).toBeUndefined();
    request.flush({});
  });
});
