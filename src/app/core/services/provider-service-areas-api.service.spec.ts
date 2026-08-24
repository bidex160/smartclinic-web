import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { SKIP_AUTH_RETRY } from '../config/http-context.tokens';
import { ProviderServiceAreasApiService } from './provider-service-areas-api.service';

describe('ProviderServiceAreasApiService', () => {
  let api: ProviderServiceAreasApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'https://api.example.test/api/v1' } },
      ],
    });
    api = TestBed.inject(ProviderServiceAreasApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses provider-scoped CRUD routes without sending providerId', () => {
    const body = {
      providerServiceId: 'service-id',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
      postalCode: null,
    };
    api.create(body).subscribe();
    const create = http.expectOne('https://api.example.test/api/v1/provider/service-areas');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(body);
    expect(create.request.body).not.toHaveProperty('providerId');
    expect(create.request.context.get(SKIP_AUTH_RETRY)).toBe(true);
    create.flush({});

    api.update('area-id', body).subscribe();
    const update = http.expectOne('https://api.example.test/api/v1/provider/service-areas/area-id');
    expect(update.request.method).toBe('PATCH');
    update.flush({});
  });

  it('uses the admin read-only review endpoint', () => {
    api.listForAdmin('provider/id').subscribe();
    const request = http.expectOne(
      'https://api.example.test/api/v1/admin/providers/provider%2Fid/service-areas',
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
