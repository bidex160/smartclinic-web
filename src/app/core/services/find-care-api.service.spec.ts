import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { FindCareApiService } from './find-care-api.service';
import { CareRequestsApiService } from './care-requests-api.service';
import { FastTrackApiService } from './fasttrack-api.service';

describe('Find Care API services', () => {
  let http: HttpTestingController;
  let find: FindCareApiService;
  let care: CareRequestsApiService;
  let fast: FastTrackApiService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    find = TestBed.inject(FindCareApiService);
    care = TestBed.inject(CareRequestsApiService);
    fast = TestBed.inject(FastTrackApiService);
  });
  afterEach(() => http.verify());
  it('uses dynamic catalogue and filtered public provider routes', () => {
    find.getServices().subscribe();
    http.expectOne('http://api.test/api/v1/public/find-care/services').flush([]);
    find
      .getProviders({
        serviceCode: 'DENTAL',
        countryCode: 'NG',
        stateOrRegion: 'Oyo',
        city: 'Ibadan',
        limit: 50,
      })
      .subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/public/find-care/providers'));
    expect(req.request.params.get('serviceCode')).toBe('DENTAL');
    expect(req.request.params.get('city')).toBe('Ibadan');
    req.flush({ items: [], page: 1, limit: 50, total: 0, totalPages: 0 });
  });
  it('omits empty geography from VIRTUAL provider discovery', () => {
    find
      .getProviders({
        serviceCode: 'GENERAL_CONSULTATION',
        deliveryMode: 'VIRTUAL',
        limit: 50,
      })
      .subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/public/find-care/providers'));
    expect(request.request.params.keys().sort()).toEqual(['deliveryMode', 'limit', 'serviceCode']);
    expect(request.request.params.get('deliveryMode')).toBe('VIRTUAL');
    request.flush({ items: [], page: 1, limit: 50, total: 0, totalPages: 0 });
  });
  it('submits only the Care Request contract with providerReference', () => {
    const body = {
      serviceCode: 'DENTAL',
      deliveryMode: 'VIRTUAL' as const,
      preferredProviderReference: 'SCPR-ABCDEF0123456789',
      contactMethod: 'EMAIL' as const,
    };
    care.create(body).subscribe();
    const req = http.expectOne('http://api.test/api/v1/me/care-requests');
    expect(req.request.body).toEqual(body);
    expect(req.request.body.providerId).toBeUndefined();
    req.flush({});
  });
  it('uses authenticated FastTrack routes without sending a fee', () => {
    const body = {
      providerReference: 'SCPR-ABCDEF0123456789',
      serviceCode: 'DENTAL',
      externalAppointmentReference: 'APT-1',
      appointmentDate: '2026-09-01',
    };
    fast.createExternal(body).subscribe();
    const create = http.expectOne('http://api.test/api/v1/me/fasttrack-requests/external');
    expect(create.request.body).toEqual(body);
    expect(create.request.body.feeMinor).toBeUndefined();
    create.flush({});
    fast.initializePayment('SC-FT-ABCDEF0123456789').subscribe();
    http
      .expectOne(
        'http://api.test/api/v1/me/fasttrack-requests/SC-FT-ABCDEF0123456789/funding/initialize',
      )
      .flush({});
    fast.verifyPayment('SC-FT-ABCDEF0123456789').subscribe();
    http
      .expectOne(
        'http://api.test/api/v1/me/fasttrack-requests/SC-FT-ABCDEF0123456789/funding/verify',
      )
      .flush({});
  });
});
