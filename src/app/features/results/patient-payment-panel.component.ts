import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import PaystackPop from '@paystack/inline-js';
import { EXTERNAL_NAVIGATOR } from '../../core/config/external-navigation.token';
import { PublicBookingCheckoutOption, PublicBookingPaymentStatus } from '../../core/models/public-booking.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { safePaystackCheckoutUrl } from '../booking/paystack-checkout-url';

@Component({
  selector: 'app-patient-payment-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl border bg-white p-6" aria-labelledby="patient-payment-heading">
      <h2 id="patient-payment-heading" class="text-xl font-bold text-brand-900">How would you like to pay?</h2>
      @if (statusLoading()) { <p role="status" class="mt-4">Loading payment status…</p> }
      @if (error()) { <div role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ error() }}</div> }
      @if (status()?.fundingStatus === 'SETTLED') {
        <div role="status" class="mt-4 rounded-xl bg-green-50 p-4 text-green-950"><strong>Payment confirmed</strong><p class="mt-1">{{ matchingCopy(status()!.bookingStatus) }}</p></div>
      } @else if (!statusLoading()) {
        <fieldset [disabled]="pending()" class="mt-5">
          <legend class="sr-only">Payment option</legend>
          <div class="grid gap-3 md:grid-cols-3">
            @for (option of options; track option.value) {
              <label class="cursor-pointer rounded-xl border p-4 focus-within:ring-4 focus-within:ring-brand-200" [class.border-brand-700]="selected() === option.value" [class.bg-brand-50]="selected() === option.value">
                <input type="radio" name="patient-payment-option" [value]="option.value" [checked]="selected() === option.value" (change)="select(option.value)" />
                <strong class="ml-2">{{ option.label }}</strong><span class="mt-2 block text-sm text-slate-600">{{ option.description }}</span>
              </label>
            }
          </div>
        </fieldset>
        <p class="mt-4 text-sm text-slate-600">Provider matching begins only after funding is settled. Pay later does not reserve a provider or appointment.</p>
        <button type="button" (click)="initiate()" [disabled]="pending()" class="mt-5 min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-60">{{ pending() ? pendingLabel() : actionLabel() }}</button>
        @if (payLater()) { <div role="status" class="mt-5 rounded-xl bg-amber-50 p-4 text-amber-950"><strong>Booking saved — payment still required</strong><p class="mt-1">No provider is reserved. Choose Pay now or Payment link when you are ready.</p></div> }
        @if (checkoutUrl()) {
          <div class="mt-5 rounded-xl bg-brand-50 p-4"><h3 class="font-bold">Payment link ready</h3><p class="mt-1 text-sm">This hosted link is only for payment and does not provide access to your SmartClinic account.</p><input aria-label="Payment link" readonly [value]="checkoutUrl()" class="mt-3 w-full rounded-lg border bg-white p-3 text-sm" /><div class="mt-3 flex flex-wrap gap-3"><button type="button" (click)="openPaymentPage()" class="min-h-11 rounded-lg bg-brand-700 px-4 font-bold text-white">Open secure payment page</button><button type="button" (click)="copyLink()" class="min-h-11 rounded-lg border border-brand-700 px-4 font-bold text-brand-700">Copy payment link</button></div><p aria-live="polite" class="mt-2 text-sm">{{ copyFeedback() }}</p></div>
        }
        <button type="button" (click)="refresh()" [disabled]="refreshing()" class="mt-4 block font-bold text-brand-700 underline">{{ refreshing() ? 'Checking payment status…' : 'Check payment status' }}</button>
      }
    </section>
  `,
})
export class PatientPaymentPanelComponent implements OnInit {
  @Input({ required: true }) reference = '';
  @Output() readonly statusChanged = new EventEmitter<PublicBookingPaymentStatus>();
  private readonly api = inject(HealthCheckResultsApiService);
  private readonly navigateExternal = inject(EXTERNAL_NAVIGATOR);
  popup = new PaystackPop();
  readonly selected = signal<PublicBookingCheckoutOption>('PAY_NOW');
  readonly status = signal<PublicBookingPaymentStatus | null>(null);
  readonly statusLoading = signal(true);
  readonly refreshing = signal(false);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly checkoutUrl = signal<string | null>(null);
  readonly payLater = signal(false);
  readonly copyFeedback = signal('');
  readonly options = [
    { value: 'PAY_NOW' as const, label: 'Pay now', description: 'Pay securely with Paystack.' },
    { value: 'PAYMENT_LINK' as const, label: 'Payment link', description: 'Open or share a secure hosted checkout link.' },
    { value: 'PAY_LATER' as const, label: 'Pay later', description: 'Keep this booking awaiting payment and return later.' },
  ];

  ngOnInit(): void { this.refresh(); }
  select(option: PublicBookingCheckoutOption): void { if (!this.pending()) { this.selected.set(option); this.error.set(null); } }
  actionLabel(): string { return this.selected() === 'PAY_NOW' ? 'Pay securely' : this.selected() === 'PAYMENT_LINK' ? 'Get payment link' : 'Pay later'; }
  pendingLabel(): string { return this.selected() === 'PAY_NOW' ? 'Preparing secure payment…' : this.selected() === 'PAYMENT_LINK' ? 'Creating payment link…' : 'Saving booking…'; }
  initiate(): void {
    if (!this.reference || this.pending() || this.status()?.fundingStatus === 'SETTLED') return;
    const option = this.selected(); this.pending.set(true); this.error.set(null); this.checkoutUrl.set(null); this.payLater.set(false);
    this.api.initiateMyHealthCheckPayment(this.reference, option).subscribe({
      next: (result) => {
        this.pending.set(false);
        if (result.bookingReference !== this.reference || result.checkoutOption !== option) return this.fail('We could not start payment. Try again.');
        if (option === 'PAY_LATER') { this.payLater.set(true); this.refresh(); return; }
        if (option === 'PAYMENT_LINK') { const url = safePaystackCheckoutUrl(result.checkoutUrl); if (!url) return this.fail('We could not create a secure payment link. Try again.'); this.checkoutUrl.set(url); this.refresh(); return; }
        if (!result.accessCode) return this.fail('We could not start payment. Try again.');
        this.popup.resumeTransaction(result.accessCode, { onSuccess: () => this.verify(), onError: () => this.fail('Payment was not completed. You can try again.') });
      },
      error: () => { this.pending.set(false); this.fail('We could not start payment. Try again.'); },
    });
  }
  verify(): void {
    if (this.refreshing()) return; this.refreshing.set(true); this.error.set(null);
    this.api.verifyMyHealthCheckPayment(this.reference).subscribe({ next: (status) => { this.apply(status); this.refreshing.set(false); }, error: () => { this.refreshing.set(false); this.fail('We could not verify the payment yet. Refresh or try again.'); } });
  }
  refresh(): void {
    if (!this.reference || this.refreshing()) return; this.refreshing.set(true); this.error.set(null);
    this.api.getMyHealthCheckPayment(this.reference).subscribe({ next: (status) => { this.apply(status); this.statusLoading.set(false); this.refreshing.set(false); }, error: () => { this.statusLoading.set(false); this.refreshing.set(false); this.fail('We could not load payment status. Try again.'); } });
  }
  private apply(status: PublicBookingPaymentStatus): void {
    this.status.set(status);
    if (status.fundingStatus === 'SETTLED') this.statusChanged.emit(status);
  }
  private fail(message: string): void { this.error.set(message); }
  openPaymentPage(): void { const url = safePaystackCheckoutUrl(this.checkoutUrl()); if (url) this.navigateExternal(url); }
  async copyLink(): Promise<void> { const url = this.checkoutUrl(); if (!url) return; try { await navigator.clipboard.writeText(url); this.copyFeedback.set('Payment link copied.'); } catch { this.copyFeedback.set('Copy was unavailable. Select and copy the link manually.'); } }
  matchingCopy(status: string): string { return status === 'SCHEDULED' ? 'Your appointment is scheduled.' : 'SmartClinic is finding a suitable provider.'; }
}
