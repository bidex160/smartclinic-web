import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EXTERNAL_NAVIGATOR } from '../../core/config/external-navigation.token';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { PatientPaymentPanelComponent } from './patient-payment-panel.component';

describe('PatientPaymentPanelComponent', () => {
  it('defaults to PAY_NOW and verifies after Popup success', async () => {
    const { fixture, api, resume } = await setup(); fixture.detectChanges();
    fixture.componentInstance.initiate();
    expect(api.initiateMyHealthCheckPayment).toHaveBeenCalledWith('SC-1', 'PAY_NOW');
    const callbacks = resume.mock.calls[0][1]; callbacks.onSuccess();
    expect(api.verifyMyHealthCheckPayment).toHaveBeenCalledWith('SC-1');
  });
  it('renders and copies a PAYMENT_LINK without invoking Popup', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const { fixture, api, resume } = await setup('PAYMENT_LINK'); fixture.detectChanges();
    fixture.componentInstance.select('PAYMENT_LINK'); fixture.componentInstance.initiate(); fixture.detectChanges();
    expect(api.initiateMyHealthCheckPayment).toHaveBeenCalledWith('SC-1', 'PAYMENT_LINK');
    expect(fixture.nativeElement.textContent).toContain('Payment link ready'); expect(resume).not.toHaveBeenCalled();
    await fixture.componentInstance.copyLink(); expect(writeText).toHaveBeenCalledWith('https://checkout.paystack.com/safe');
  });
  it('accepts nullable PAY_LATER response and keeps funding outstanding', async () => {
    const { fixture, resume } = await setup('PAY_LATER'); fixture.detectChanges();
    fixture.componentInstance.select('PAY_LATER'); fixture.componentInstance.initiate(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Booking saved — payment still required'); expect(resume).not.toHaveBeenCalled();
  });
});

async function setup(option: 'PAY_NOW'|'PAYMENT_LINK'|'PAY_LATER' = 'PAY_NOW') {
  const pending = { bookingReference: 'SC-1', bookingStatus: 'AWAITING_FUNDING', fundingStatus: 'PENDING', checkoutOption: option, paymentStatus: null, paymentAttemptReference: null, amount: '100', currency: 'NGN', paidAt: null };
  const api = { getMyHealthCheckPayment: vi.fn(() => of(pending)), verifyMyHealthCheckPayment: vi.fn(() => of({ ...pending, fundingStatus: 'SETTLED', paymentStatus: 'SUCCEEDED', bookingStatus: 'PENDING_PROVIDER_MATCH' })), initiateMyHealthCheckPayment: vi.fn(() => of({ bookingReference: 'SC-1', fundingStatus: 'PENDING', checkoutOption: option, paymentAttemptReference: option === 'PAY_LATER' ? null : 'attempt', status: option === 'PAY_LATER' ? null : 'AWAITING_CUSTOMER_ACTION', amount: '100', currency: 'NGN', checkoutUrl: option === 'PAYMENT_LINK' ? 'https://checkout.paystack.com/safe' : null, accessCode: option === 'PAY_NOW' ? 'access-code' : null })) };
  await TestBed.configureTestingModule({ imports: [PatientPaymentPanelComponent], providers: [provideRouter([]), { provide: HealthCheckResultsApiService, useValue: api }, { provide: EXTERNAL_NAVIGATOR, useValue: vi.fn() }] }).compileComponents();
  const fixture = TestBed.createComponent(PatientPaymentPanelComponent); fixture.componentRef.setInput('reference', 'SC-1');
  const resume = vi.fn(); fixture.componentInstance.popup.resumeTransaction = resume; return { fixture, api, resume };
}
