import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { PharmacyFulfillmentApiService } from '../../../core/services/pharmacy-fulfillment-api.service';
import { ProviderReferredOutPageComponent } from './provider-referred-out-page.component';

const row = (overrides: Record<string, unknown>) => ({
  reference: 'F', status: 'PROPOSED', createdAt: '2026-10-01T10:00:00Z', dispensing: null,
  patient: { givenName: 'Ngozi', familyName: 'Eze' },
  fulfiller: { displayName: 'Ikeja Reference Lab', serviceUnitName: 'Main lab' },
  referral: { referredBy: { displayName: 'Lagoon Lab' }, note: 'We don’t run HbA1c' },
  clinicalOrder: { type: 'LABORATORY', diagnosticItems: [{ name: 'HbA1c', resultedAt: null, sortOrder: 0 }] },
  ...overrides,
});

describe('ProviderReferredOutPageComponent', () => {
  it('shows where each referral is, with results once accepted', async () => {
    const items = [
      row({ reference: 'A' }),
      row({ reference: 'B', status: 'ACCEPTED', referralFee: { amountMinor: 45000, currency: 'NGN', status: 'PAYABLE' }, clinicalOrder: { type: 'LABORATORY', diagnosticItems: [{ name: 'HbA1c', resultValue: '7.9', resultUnit: '%', resultedAt: '2026-10-02', sortOrder: 0 }] } }),
      row({ reference: 'C', status: 'CANCELLED' }),
    ];
    await TestBed.configureTestingModule({
      imports: [ProviderReferredOutPageComponent],
      providers: [provideRouter([]), { provide: PharmacyFulfillmentApiService, useValue: { listReferredOut: vi.fn(() => of({ items })) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderReferredOutPageComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('[data-status]')].map((n) => n.textContent?.trim())).toEqual(['Waiting for patient', 'Results ready', 'Not taken up']);
    expect(el.querySelector('[data-results]')?.textContent).toContain('7.9');
    expect(el.textContent).toContain('We don’t run HbA1c');
    const fees = el.querySelectorAll('[data-referral-fee]');
    expect(fees.length).toBe(1);
    expect(fees[0].textContent).toContain('450');
    expect(fees[0].textContent).toContain('ready for payout');
  });
});
