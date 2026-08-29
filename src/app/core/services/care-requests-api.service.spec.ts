import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { CareRequestsApiService } from './care-requests-api.service';

describe('CareRequestsApiService funding', () => {
  it('uses authenticated CareRequest funding routes without client amounts', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } }] });
    const api = TestBed.inject(CareRequestsApiService);
    const http = TestBed.inject(HttpTestingController);
    api.getFunding('SC-CARE/A').subscribe();
    let request = http.expectOne('http://api.test/api/v1/me/care-requests/SC-CARE%2FA/funding');
    expect(request.request.method).toBe('GET'); request.flush({});
    api.initializeFunding('SC-CARE/A').subscribe();
    request = http.expectOne('http://api.test/api/v1/me/care-requests/SC-CARE%2FA/funding/initialize');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.body).not.toEqual(expect.objectContaining({ amountMinor: expect.anything(), currency: expect.anything() }));
    request.flush({});
    api.verifyLatestFunding('SC-CARE/A').subscribe();
    request = http.expectOne('http://api.test/api/v1/me/care-requests/SC-CARE%2FA/funding/verify-latest');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toBeNull(); request.flush({});
    http.verify();
  });
});
