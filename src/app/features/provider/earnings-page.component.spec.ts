import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProviderEarningCurrencySummary, ProviderEarningPage } from '../../core/models/provider-earning.model';
import { ProviderEarningsApiService } from '../../core/services/provider-earnings-api.service';
import { EarningsPageComponent } from './earnings-page.component';

const summary = (currency: string): ProviderEarningCurrencySummary => ({ currency, earningCount: 2, grossAmountMinor: 200000, commissionAmountMinor: 20000, providerShareMinor: 180000, heldAmountMinor: 50000, payableAmountMinor: 60000, settledAmountMinor: 70000, voidedAmountMinor: 1000, statusBreakdown: [], sourceBreakdown: [{ key: 'GENERAL_CARE', earningCount: 2, grossAmountMinor: 200000, commissionAmountMinor: 20000, providerShareMinor: 180000 }] });
const emptyPage: ProviderEarningPage = { items: [], page: 1, limit: 25, total: 0, totalPages: 0 };

describe('EarningsPageComponent', () => {
  it('keeps provider currency summaries separate and uses authoritative source aggregates', () => {
    const api = { getProviderSummary: () => of([summary('NGN'), summary('USD')]), getProviderEarnings: () => of(emptyPage) };
    TestBed.configureTestingModule({ imports: [EarningsPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } }, { provide: ProviderEarningsApiService, useValue: api }] });
    const fixture = TestBed.createComponent(EarningsPageComponent); fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('NGN'); expect(text).toContain('USD'); expect(text).toContain('General Care');
    expect(text).toContain('Held'); expect(text).toContain('Payable'); expect(text).toContain('Settled'); expect(text).toContain('Voided');
    expect(text).not.toContain('Paid');
  });

  it('sends the admin public provider reference, resets paging on apply, and never calls providerId', () => {
    const getAdminEarnings = vi.fn().mockReturnValue(of(emptyPage));
    const api = { getAdminSummary: () => of([summary('NGN')]), getAdminEarnings };
    TestBed.configureTestingModule({ imports: [EarningsPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { earningsScope: 'admin' } } } }, { provide: ProviderEarningsApiService, useValue: api }] });
    const fixture = TestBed.createComponent(EarningsPageComponent); const component = fixture.componentInstance; fixture.detectChanges();
    component.filters.patchValue({ providerReference: 'SCPR-ABC', status: 'PAYABLE' }); component.loadHistory(4); component.apply();
    const filters = getAdminEarnings.mock.calls.at(-1)?.[0];
    expect(filters.providerReference).toBe('SCPR-ABC'); expect(filters.providerId).toBeUndefined(); expect(filters.page).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Revenue'); expect(fixture.nativeElement.textContent).not.toContain('Profit');
  });

  it('shows independent summary and history error states', () => {
    const api = { getProviderSummary: () => throwError(() => new Error('failed')), getProviderEarnings: () => throwError(() => new Error('failed')) };
    TestBed.configureTestingModule({ imports: [EarningsPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } }, { provide: ProviderEarningsApiService, useValue: api }] });
    const fixture = TestBed.createComponent(EarningsPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Financial summary is unavailable');
    expect(fixture.nativeElement.textContent).toContain('Transactions are unavailable');
  });
});
