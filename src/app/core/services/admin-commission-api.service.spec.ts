import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { AdminCommissionApiService } from './admin-commission-api.service';

describe('AdminCommissionApiService', () => {
  it('uses the exact platform and provider commission endpoints', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } }] });
    const api = TestBed.inject(AdminCommissionApiService); const http = TestBed.inject(HttpTestingController);
    api.getPlatform().subscribe(); let req = http.expectOne('http://api.test/api/v1/admin/commercial-settings/provider-commission'); expect(req.request.method).toBe('GET'); req.flush(platform());
    api.setPlatform({ commissionBasisPoints: 1000 }).subscribe(); req = http.expectOne('http://api.test/api/v1/admin/commercial-settings/provider-commission'); expect(req.request.method).toBe('PATCH'); expect(req.request.body).toEqual({ commissionBasisPoints: 1000 }); req.flush(platform());
    api.getProvider('provider/id').subscribe(); req = http.expectOne('http://api.test/api/v1/admin/providers/provider%2Fid/commission'); expect(req.request.method).toBe('GET'); req.flush(provider());
    api.setProvider('provider-id', { commissionBasisPoints: 0 }).subscribe(); req = http.expectOne('http://api.test/api/v1/admin/providers/provider-id/commission'); expect(req.request.method).toBe('PATCH'); expect(req.request.body).toEqual({ commissionBasisPoints: 0 }); req.flush(provider());
    api.clearProvider('provider-id').subscribe(); req = http.expectOne('http://api.test/api/v1/admin/providers/provider-id/commission'); expect(req.request.method).toBe('DELETE'); req.flush(provider()); http.verify();
  });
});
function platform() { return { configured: true, commissionBasisPoints: 1000, commissionPercentage: '10.00', updatedAt: null }; }
function provider() { return { providerReference: 'SCPR-TEST', platformDefaultBasisPoints: 1000, providerOverrideBasisPoints: null, configured: true, effectiveBasisPoints: 1000, source: 'PLATFORM_DEFAULT' }; }
