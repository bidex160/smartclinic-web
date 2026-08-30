import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProviderPayoutDetail } from '../../core/models/provider-payout.model';
import { ProviderPayoutsApiService } from '../../core/services/provider-payouts-api.service';
import { PayoutDetailPageComponent } from './payout-detail-page.component';

const detail = (status: ProviderPayoutDetail['status']): ProviderPayoutDetail => ({ reference: 'SC-PAYOUT-AAAAAAAAAAAAAAAAAAAA', currency: 'NGN', totalAmountMinor: 9000, earningCount: 1, status, settlementMethod: 'MANUAL_BANK_TRANSFER', externalReference: status === 'COMPLETED' ? 'BANK-1' : null, note: null, createdAt: '2026-08-30T09:00:00Z', processingAt: status === 'DRAFT' ? null : '2026-08-30T10:00:00Z', completedAt: status === 'COMPLETED' ? '2026-08-30T11:00:00Z' : null, failedAt: null, cancelledAt: null, updatedAt: '2026-08-30T11:00:00Z', earnings: [{ reference: 'SC-EARN-1', sourceType: 'GENERAL_CARE', sourceReference: 'SC-CARE-1', providerShareMinor: 9000, currency: 'NGN', payableAt: '2026-08-30T08:00:00Z', settledAt: status === 'COMPLETED' ? '2026-08-30T11:00:00Z' : null }], history: [{ fromStatus: null, toStatus: 'DRAFT', reasonCode: 'PAYOUT_CREATED', reasonNote: null, createdAt: '2026-08-30T09:00:00Z' }] });
const route = (admin = false) => ({ snapshot: { data: { payoutScope: admin ? 'admin' : 'provider' }, paramMap: { get: () => 'SC-PAYOUT-AAAAAAAAAAAAAAAAAAAA' } } });

describe('PayoutDetailPageComponent', () => {
  it('renders provider earnings and history read-only', () => {
    const api = { getProviderPayout: () => of(detail('COMPLETED')) };
    TestBed.configureTestingModule({ imports: [PayoutDetailPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: route() }, { provide: ProviderPayoutsApiService, useValue: api }] });
    const fixture = TestBed.createComponent(PayoutDetailPageComponent); fixture.detectChanges(); const text = fixture.nativeElement.textContent;
    expect(text).toContain('SC-EARN-1'); expect(text).toContain('Status history'); expect(text).toContain('BANK-1'); expect(text).not.toContain('Complete Settlement'); expect(text).not.toContain('Start Processing');
  });
  it('shows only DRAFT admin actions and preserves manual-settlement language', () => {
    const api = { getAdminPayout: () => of({ ...detail('DRAFT'), provider: { reference: 'SCPR-ONE', displayName: 'Prime Clinic' } }) };
    TestBed.configureTestingModule({ imports: [PayoutDetailPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: route(true) }, { provide: ProviderPayoutsApiService, useValue: api }] });
    const fixture = TestBed.createComponent(PayoutDetailPageComponent); fixture.detectChanges(); const text = fixture.nativeElement.textContent;
    expect(text).toContain('Start Processing'); expect(text).toContain('Cancel'); expect(text).not.toContain('Complete Settlement'); expect(text).not.toContain('Money sent');
  });
  it('shows completion/failure/cancel actions only while PROCESSING', () => {
    const api = { getAdminPayout: () => of({ ...detail('PROCESSING'), provider: { reference: 'SCPR-ONE', displayName: 'Prime Clinic' } }) };
    TestBed.configureTestingModule({ imports: [PayoutDetailPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: route(true) }, { provide: ProviderPayoutsApiService, useValue: api }] });
    const fixture = TestBed.createComponent(PayoutDetailPageComponent); fixture.detectChanges(); const text = fixture.nativeElement.textContent;
    expect(text).toContain('Complete Settlement'); expect(text).toContain('Mark Failed'); expect(text).toContain('Cancel'); expect(text).not.toContain('Start Processing');
  });
});
