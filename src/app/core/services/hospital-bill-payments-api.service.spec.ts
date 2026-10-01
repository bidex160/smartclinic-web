import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { HospitalBillPaymentsApiService } from './hospital-bill-payments-api.service';

describe('HospitalBillPaymentsApiService', () => {
  let api: HospitalBillPaymentsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    api = TestBed.inject(HospitalBillPaymentsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the hospital bill read endpoints', () => {
    api.getHospitals().subscribe();
    http.expectOne('/api/v1/me/hospital-bill-payments/hospitals').flush([]);
    api.getInvoice('AKTH').subscribe();
    http.expectOne('/api/v1/me/hospital-bill-payments/AKTH/invoice').flush({});
  });

  it('initializes with selected item references only and verifies by reference', () => {
    const request = { hospitalCode: 'AKTH', invoiceReference: 'INV-1', items: [{ itemReference: 'ITEM-1' }] };
    api.initializePayment(request).subscribe();
    const init = http.expectOne('/api/v1/me/hospital-bill-payments');
    expect(init.request.method).toBe('POST');
    expect(init.request.body).toEqual(request);
    init.flush({});
    api.verifyPayment('SC-HBP-1').subscribe();
    const verify = http.expectOne('/api/v1/me/hospital-bill-payments/SC-HBP-1/verify');
    expect(verify.request.method).toBe('POST');
    expect(verify.request.body).toBeNull();
    verify.flush({});
  });
});
