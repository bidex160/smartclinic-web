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
      .create({ careServiceDefinitionId: 'definition-id', deliveryModes: ['VIRTUAL'] })
      .subscribe();
    expect(http.expectOne('http://api.test/api/v1/provider/care-services').request.body).toEqual({
      careServiceDefinitionId: 'definition-id',
      deliveryModes: ['VIRTUAL'],
    });
    api.setActive('offering-id', false).subscribe();
    expect(
      http.expectOne('http://api.test/api/v1/provider/care-services/offering-id/deactivate').request
        .body,
    ).toEqual({});
  });
});
