import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { ProviderCareServicesApiService } from './provider-care-services-api.service';
describe('ProviderCareServicesApiService', () => {
  let api: ProviderCareServicesApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } },
      ],
    });
    api = TestBed.inject(ProviderCareServicesApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses the separate General Care catalogue and offering routes', () => {
    api.getCatalogue().subscribe();
    http.expectOne('http://api.test/api/v1/provider/care-services/catalogue').flush([]);
    api.getOfferings().subscribe();
    http.expectOne('http://api.test/api/v1/provider/care-services').flush([]);
    api
      .create({
        careServiceDefinitionId: 'definition-id',
        deliveryOptions: [{ deliveryMode: 'VIRTUAL', priceMinor: 1000000, currency: 'NGN' }],
      })
      .subscribe();
    expect(http.expectOne('http://api.test/api/v1/provider/care-services').request.body).toEqual({
      careServiceDefinitionId: 'definition-id',
      deliveryOptions: [{ deliveryMode: 'VIRTUAL', priceMinor: 1000000, currency: 'NGN' }],
    });
    api.setActive('offering-id', false).subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-services/offering-id/deactivate').request
        .body,
    ).toEqual({});
  });
  it('uses the authoritative clinical documentation endpoints and payload', () => {
    api.getClinicalDocumentation('offering-id').subscribe();
    http.expectOne('http://api.test/api/v1/provider/care-services/offering-id/clinical-documentation').flush(null);
    const fields = [{ key: 'findings', label: 'Findings', type: 'TEXTAREA' as const, required: true, core: true, sortOrder: 0 }];
    api.saveClinicalDocumentation('offering-id', fields).subscribe();
    expect(http.expectOne('http://api.test/api/v1/provider/care-services/offering-id/clinical-documentation').request.body).toEqual({ fields });
    api.resetClinicalDocumentation('offering-id').subscribe();
    expect(http.expectOne('http://api.test/api/v1/provider/care-services/offering-id/clinical-documentation/reset').request.body).toEqual({});
  });
});
