import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { PatientProviderConnectionsApiService } from './patient-provider-connections-api.service';
describe('PatientProviderConnectionsApiService', () => {
  let api: PatientProviderConnectionsApiService, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    api = TestBed.inject(PatientProviderConnectionsApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('maps patient directory, initiation, lifecycle and funding routes using public references', () => {
    api.directory(' prime ', 2, 10).subscribe();
    let r = http.expectOne((x) => x.url === '/api/v1/me/patient-provider-connection-providers');
    expect(r.request.params.get('q')).toBe('prime');
    expect(r.request.params.get('page')).toBe('2');
    r.flush({ items: [] });
    api.startNew({ providerReference: 'SCPR-PUBLIC', consentAcknowledged: true }).subscribe();
    r = http.expectOne('/api/v1/me/patient-provider-connections/new-registration');
    expect(r.request.body).toEqual({ providerReference: 'SCPR-PUBLIC', consentAcknowledged: true });
    r.flush({});
    api
      .startExisting({
        providerReference: 'SCPR-PUBLIC',
        consentAcknowledged: true,
        externalPatientReference: 'YAB-1',
      })
      .subscribe();
    r = http.expectOne('/api/v1/me/patient-provider-connections/existing-link');
    expect(r.request.body).toEqual({
      providerReference: 'SCPR-PUBLIC',
      consentAcknowledged: true,
      externalPatientReference: 'YAB-1',
    });
    r.flush({});
    api.resubmit('SC-PPC-1', 'YAB-2').subscribe();
    http.expectOne('/api/v1/me/patient-provider-connections/SC-PPC-1/resubmit').flush({});
    api.convert('SC-PPC-1').subscribe();
    r = http.expectOne(
      '/api/v1/me/patient-provider-connections/SC-PPC-1/convert-to-new-registration',
    );
    expect(r.request.body).toEqual({ consentAcknowledged: true });
    r.flush({});
    api.initializeFunding('SC-PPC-1').subscribe();
    r = http.expectOne('/api/v1/me/patient-provider-connections/SC-PPC-1/funding/initialize');
    expect(r.request.body).toBeNull();
    r.flush({});
    api.verifyFunding('SC-PPC-1').subscribe();
    http
      .expectOne('/api/v1/me/patient-provider-connections/SC-PPC-1/funding/verify-latest')
      .flush({});
  });
  it('maps Provider configuration, queue and decision commands', () => {
    api.getConfiguration().subscribe();
    http.expectOne('/api/v1/provider/patient-connections/configuration').flush({});
    const config = {
      newPatientRegistrationEnabled: true,
      newPatientRegistrationFeeMinor: 0,
      newPatientRegistrationCurrency: 'NGN',
      existingPatientLinkEnabled: false,
      existingPatientLinkFeeMinor: null,
      existingPatientLinkCurrency: null,
    };
    api.updateConfiguration(config).subscribe();
    let r = http.expectOne('/api/v1/provider/patient-connections/configuration');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body.newPatientRegistrationFeeMinor).toBe(0);
    r.flush({});
    api.listProvider().subscribe();
    http.expectOne((x) => x.url === '/api/v1/provider/patient-connections').flush({ items: [] });
    api.confirm('SC-PPC-1', { externalPatientReference: 'MRN-1' }).subscribe();
    http.expectOne('/api/v1/provider/patient-connections/SC-PPC-1/confirm').flush({});
    api.unable('SC-PPC-1').subscribe();
    http.expectOne('/api/v1/provider/patient-connections/SC-PPC-1/unable-to-verify').flush({});
    api.reject('SC-PPC-1').subscribe();
    http.expectOne('/api/v1/provider/patient-connections/SC-PPC-1/reject').flush({});
  });
});
