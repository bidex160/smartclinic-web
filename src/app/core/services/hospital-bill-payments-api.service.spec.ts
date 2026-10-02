import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { HospitalBillPaymentsApiService } from './hospital-bill-payments-api.service';

describe('HospitalBillPaymentsApiService', () => {
  let api: HospitalBillPaymentsApiService;
  let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }] }); api = TestBed.inject(HospitalBillPaymentsApiService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('uses hospital, invoice, initialize and verify endpoints', () => {
    api.getHospitals().subscribe(); http.expectOne('/api/v1/me/hospital-bill-payments/hospitals').flush([]);
    api.getInvoice('AKTH', '1467709').subscribe(); const invoice = http.expectOne('/api/v1/me/hospital-bill-payments/AKTH/invoice?invoiceReference=1467709'); expect(invoice.request.method).toBe('GET'); invoice.flush({});
    const body = { hospitalCode: 'AKTH', invoiceReference: '1467709', items: [{ itemReference: 'ITEM-1' }] }; api.initializePayment(body).subscribe(); const init = http.expectOne('/api/v1/me/hospital-bill-payments'); expect(init.request.body).toEqual(body); init.flush({});
    api.verifyPayment('SC-HBP-1').subscribe(); const verify = http.expectOne('/api/v1/me/hospital-bill-payments/SC-HBP-1/verify'); expect(verify.request.body).toBeNull(); verify.flush({});
  });
});
