import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { GuidedSelfChecksApiService } from './guided-self-checks-api.service';

describe('GuidedSelfChecksApiService', () => {
  let api: GuidedSelfChecksApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    api = TestBed.inject(GuidedSelfChecksApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses the public product and owned Self-Check endpoints', () => {
    api.product().subscribe();
    expect(http.expectOne('/api/v1/guided-self-check/product').request.method).toBe('GET');
    api.create().subscribe();
    const create = http.expectOne('/api/v1/me/guided-self-checks');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({});
  });
  it('saves the exact answer state/value DTO and refreshes questionnaire projection', () => {
    api
      .saveAnswer('SC-GSC-A', 'blood pressure', {
        state: 'KNOWN',
        value: { systolic: 120, diastolic: 80, unit: 'mmHg' },
      })
      .subscribe();
    const request = http.expectOne(
      '/api/v1/me/guided-self-checks/SC-GSC-A/answers/blood%20pressure',
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      state: 'KNOWN',
      value: { systolic: 120, diastolic: 80, unit: 'mmHg' },
    });
  });
  it('uses authoritative funding initialization and verification endpoints', () => {
    api.initializeFunding('SC-GSC-A', { paymentEmail: 'ada@example.com' }).subscribe();
    const initialize = http.expectOne('/api/v1/me/guided-self-checks/SC-GSC-A/funding/initialize');
    expect(initialize.request.method).toBe('POST');
    expect(initialize.request.body).toEqual({ paymentEmail: 'ada@example.com' });
    api.verifyFunding('SC-GSC-A').subscribe();
    expect(
      http.expectOne('/api/v1/me/guided-self-checks/SC-GSC-A/funding/verify-latest').request.method,
    ).toBe('POST');
  });
});
