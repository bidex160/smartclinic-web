import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { ProviderEarningsApiService } from './provider-earnings-api.service';

describe('ProviderEarningsApiService', () => {
  let api: ProviderEarningsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }] });
    api = TestBed.inject(ProviderEarningsApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('maps provider summary, filtered history and public-reference detail', () => {
    api.getProviderSummary().subscribe();
    http.expectOne('/api/v1/provider/earnings/summary').flush([]);
    api.getProviderEarnings({ status: 'PAYABLE', sourceType: 'GENERAL_CARE', currency: 'NGN', page: 2, limit: 25 }).subscribe();
    const list = http.expectOne(r => r.url === '/api/v1/provider/earnings');
    expect(list.request.params.get('status')).toBe('PAYABLE');
    expect(list.request.params.get('sourceType')).toBe('GENERAL_CARE');
    expect(list.request.params.get('currency')).toBe('NGN');
    expect(list.request.params.get('page')).toBe('2');
    list.flush({ items: [], page: 2, limit: 25, total: 0, totalPages: 0 });
    api.getProviderEarning('SC-EARN/A').subscribe();
    http.expectOne('/api/v1/provider/earnings/SC-EARN%2FA').flush({});
  });

  it('uses providerReference for admin reporting and never sends deprecated providerId', () => {
    api.getAdminSummary('SCPR-ABC').subscribe();
    const summary = http.expectOne(r => r.url === '/api/v1/admin/provider-earnings/summary');
    expect(summary.request.params.get('providerReference')).toBe('SCPR-ABC');
    expect(summary.request.params.has('providerId')).toBe(false);
    summary.flush([]);
    api.getAdminEarnings({ providerReference: 'SCPR-ABC', from: '2026-08-01T00:00:00.000Z', to: '2026-08-30T23:59:59.999Z' }).subscribe();
    const list = http.expectOne(r => r.url === '/api/v1/admin/provider-earnings');
    expect(list.request.params.get('providerReference')).toBe('SCPR-ABC');
    expect(list.request.params.has('providerId')).toBe(false);
    list.flush({ items: [], page: 1, limit: 25, total: 0, totalPages: 0 });
    api.getAdminEarning('SC-EARN-1').subscribe();
    http.expectOne('/api/v1/admin/provider-earnings/SC-EARN-1').flush({});
  });

  it('omits empty filters', () => {
    api.getAdminEarnings({ providerReference: '', currency: undefined }).subscribe();
    const request = http.expectOne('/api/v1/admin/provider-earnings');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ items: [], page: 1, limit: 25, total: 0, totalPages: 0 });
  });
});
