import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
import { ProviderPharmacyCoordinationEarningsPageComponent } from './provider-pharmacy-coordination-earnings-page.component';

describe('ProviderPharmacyCoordinationEarningsPageComponent', () => {
  it('keeps monetary coordination earnings distinct and shows their lifecycle', async () => {
    const api = {
      getCoordinationEarnings: vi.fn(() =>
        of({
          totals: [{ currency: 'NGN', total: 15000, held: 5000, payable: 7000, settled: 3000 }],
          items: [
            {
              id: 'allocation-1',
              type: 'DOCTOR',
              sourceOrderReference: 'SC-ORD-TEST',
              sourceFulfillmentReference: 'SC-ORF-TEST',
              basisAmountMinor: 500000,
              bpsSnapshot: 100,
              amountMinor: 5000,
              currency: 'NGN',
              status: 'HELD',
              createdAt: '2026-09-28T00:00:00.000Z',
              payableAt: null,
              settledAt: null,
              reversedAt: null,
            },
          ],
        } as any),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderPharmacyCoordinationEarningsPageComponent],
      providers: [provideRouter([]), { provide: PharmacyFulfillmentApiService, useValue: api }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProviderPharmacyCoordinationEarningsPageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(api.getCoordinationEarnings).toHaveBeenCalledOnce();
    expect(text).toContain('separate from referral points');
    expect(text).toContain('Doctor coordination');
    expect(text).toContain('SC-ORD-TEST');
    expect(text).toContain('HELD');
  });
});
