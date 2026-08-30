import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProviderPayoutsApiService } from '../../core/services/provider-payouts-api.service';
import { AdminPayoutCreatePageComponent } from './admin-payout-create-page.component';

@Component({ template: '' }) class EmptyPage {}

describe('AdminPayoutCreatePageComponent', () => {
  const earning = (reference: string, amount: number) => ({ reference, sourceType: 'GENERAL_CARE' as const, sourceReference: 'SC-CARE-1', providerShareMinor: amount, currency: 'NGN', payableAt: '2026-08-30T10:00:00Z', createdAt: '2026-08-29T10:00:00Z' });
  it('retains selection across pages, clears it when context changes, and sends references without a total', () => {
    const api = { getEligibleEarnings: vi.fn().mockReturnValue(of({ items: [earning('SC-EARN-1', 9000)], page: 1, limit: 25, total: 2, totalPages: 2 })), createPayout: vi.fn().mockReturnValue(of({ reference: 'SC-PAYOUT-1' })) };
    TestBed.configureTestingModule({ imports: [AdminPayoutCreatePageComponent], providers: [provideRouter([{ path: 'admin/provider-payouts/:reference', component: EmptyPage }]), { provide: ProviderPayoutsApiService, useValue: api }] });
    const fixture = TestBed.createComponent(AdminPayoutCreatePageComponent); const component = fixture.componentInstance;
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    component.form.patchValue({ providerReference: 'SCPR-ONE', currency: 'NGN' }); component.loadEligible(1, true); component.toggle(earning('SC-EARN-1', 9000));
    expect(component.preview()).toBe(9000); component.loadEligible(2, false); expect(component.selected().has('SC-EARN-1')).toBe(true);
    component.create(); const sent = api.createPayout.mock.calls[0][0]; expect(sent.earningReferences).toEqual(['SC-EARN-1']); expect(sent.totalAmountMinor).toBeUndefined();
    component.form.patchValue({ currency: 'USD' }); component.loadEligible(1, false); expect(component.selected().size).toBe(0);
  });
  it('shows the specific stale-selection conflict guidance', () => {
    const api = { getEligibleEarnings: () => of({ items: [earning('SC-EARN-1', 9000)], page: 1, limit: 25, total: 1, totalPages: 1 }), createPayout: () => throwError(() => ({ status: 409 })) };
    TestBed.configureTestingModule({ imports: [AdminPayoutCreatePageComponent], providers: [provideRouter([]), { provide: ProviderPayoutsApiService, useValue: api }] });
    const component = TestBed.createComponent(AdminPayoutCreatePageComponent).componentInstance; vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    component.form.patchValue({ providerReference: 'SCPR-ONE' }); component.loadEligible(1, true); component.toggle(earning('SC-EARN-1', 9000)); component.create();
    expect(component.createError()).toContain('no longer available'); expect(component.createError()).toContain('Refresh the eligible earnings');
  });
});
