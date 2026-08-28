import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { CareAppointmentsApiService } from './care-appointments-api.service';

describe('CareAppointmentsApiService', () => {
  let api: CareAppointmentsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    api = TestBed.inject(CareAppointmentsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses authenticated patient appointment routes and public references', () => {
    api.get('SC-CA-ABCDEF012345').subscribe();
    http.expectOne('http://api.test/api/v1/me/care-appointments/SC-CA-ABCDEF012345').flush({});

    api.cancel('SC-CA-ABCDEF012345', 'Plans changed').subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/me/care-appointments/SC-CA-ABCDEF012345/cancel')
        .request.body,
    ).toEqual({ reason: 'Plans changed' });
  });
});
