import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthStateService } from '../../core/services/auth-state.service';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { PatientWalletApiService } from '../../core/services/patient-wallet-api.service';
import { PatientPayBillsPageComponent } from './patient-pay-bills-page.component';

describe('PatientPayBillsPageComponent', () => {
  const connection = {
    reference: 'SC-PPC-BELHAM',
    status: 'CONNECTED',
    externalPatientReference: 'SMHB-001',
    provider: { displayName: 'Smartclinic Healthstation Belham', providerType: 'HOSPITAL' },
  };

  async function setup(paymentStatus: string, itemCount: number, amountMinor: number | null) {
    const companion = {
      requests: [{ orderReference: 'SC-ORD-1', type: 'PRESCRIPTION', serviceUnit: 'Main Pharmacy', paymentStatus, amountMinor, currency: amountMinor === null ? null : 'NGN' }],
      consolidatedPayment: { itemCount, amountMinor, currency: amountMinor === null ? null : 'NGN' },
      servicePass: null,
    };
    await TestBed.configureTestingModule({
      imports: [PatientPayBillsPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientProviderConnectionsApiService, useValue: { listMine: () => of({ items: [connection] }), companion: () => of(companion), settleWallet: vi.fn() } },
        { provide: PatientWalletApiService, useValue: { mine: () => of({ balanceMinor: 0, currency: 'NGN' }) } },
        { provide: AuthStateService, useValue: { currentUser: () => ({ email: 'patient@example.test' }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientPayBillsPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows a truthful price-pending state instead of saying there is nothing to pay', async () => {
    const fixture = await setup('NOT_PRICED', 0, null);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Price pending');
    expect(text).not.toContain('Nothing to pay at this hospital');
    expect(text).not.toContain('Pay securely with OPay');
  });

  it('reveals payment providers only after the patient chooses a payable bill', async () => {
    const fixture = await setup('PAYMENT_REQUIRED', 1, 500000);
    expect(fixture.nativeElement.textContent).not.toContain('Pay securely with OPay');
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((item: HTMLButtonElement) => item.textContent.includes('Choose payment method')) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pay securely with OPay');
    expect(fixture.nativeElement.textContent).toContain('Continue to secure payment');
  });
});
