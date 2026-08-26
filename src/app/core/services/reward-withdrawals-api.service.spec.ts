import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { RewardWithdrawalsApiService } from './reward-withdrawals-api.service';

describe('RewardWithdrawalsApiService', () => {
  let api: RewardWithdrawalsApiService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } }] }); api = TestBed.inject(RewardWithdrawalsApiService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('creates a user withdrawal with only points and bank fields', () => { const body = { points: 100, bankName: 'Access Bank', accountNumber: '0123456789', accountName: 'Ada Okafor' }; api.create(body).subscribe(); const request = http.expectOne('http://api.test/api/v1/me/rewards/withdrawals'); expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual(body); expect(request.request.body).not.toHaveProperty('amount'); request.flush({}); });
  it('calls the authenticated user cancellation command without a user id', () => { api.cancelMine('SCW-1').subscribe(); const request = http.expectOne('http://api.test/api/v1/me/rewards/withdrawals/SCW-1/cancel'); expect(request.request.body).toEqual({}); request.flush({}); });
  it('sends admin paid fields only', () => { api.markPaid('SCW-1', 'BANK-1', 'Transferred').subscribe(); const request = http.expectOne('http://api.test/api/v1/admin/reward-withdrawals/SCW-1/paid'); expect(request.request.body).toEqual({ externalReference: 'BANK-1', adminNote: 'Transferred' }); request.flush({}); });
});
