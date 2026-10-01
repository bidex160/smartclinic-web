import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import PaystackPop from '@paystack/inline-js';
import { HospitalBillPaymentsApiService } from '../../core/services/hospital-bill-payments-api.service';
import {
  ConnectedHospital,
  HospitalBillPayment,
  HospitalInvoice,
  HospitalInvoiceItem,
} from '../../core/models/hospital-bill-payment.model';
import { PaymentContactEmailComponent } from '../../shared/components/payment-contact-email.component';

@Component({
  selector: 'app-pay-bills-page',
  imports: [RouterLink, PaymentContactEmailComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <a routerLink="/me/dashboard" class="font-bold text-brand-700 underline">← Dashboard</a>
      <header class="mt-6">
        <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Payments</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-950">Pay Bills</h1>
        <p class="mt-2 text-slate-600">Pay an outstanding invoice from a connected hospital.</p>
      </header>

      @if (hospitalLoading()) {
        <p role="status" class="mt-7 rounded-2xl border bg-white p-6">
          Loading connected hospitals…
        </p>
      } @else if (hospitalError()) {
        <section role="alert" class="mt-7 rounded-2xl bg-red-50 p-6 text-red-950">
          <p>We could not load your connected hospitals.</p>
          <button type="button" class="mt-3 font-bold underline" (click)="loadHospitals()">
            Try again
          </button>
        </section>
      } @else if (!hospitals().length) {
        <section class="mt-7 rounded-2xl border bg-white p-8 text-center">
          <h2 class="text-xl font-bold">No connected hospitals</h2>
          <p class="mt-2 text-slate-600">No connected hospitals are available for bill payment.</p>
          <a
            routerLink="/me/providers"
            class="mt-5 inline-flex rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
            >View providers</a
          >
        </section>
      } @else {
        <section class="mt-7 rounded-2xl border bg-white p-6" aria-labelledby="hospital-title">
          <h2 id="hospital-title" class="text-xl font-bold">Select a hospital</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            @for (hospital of hospitals(); track hospital.hospitalCode) {
              <button
                type="button"
                (click)="selectHospital(hospital)"
                [attr.aria-pressed]="selectedHospital()?.hospitalCode === hospital.hospitalCode"
                class="flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left transition hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                [class.border-brand-600]="
                  selectedHospital()?.hospitalCode === hospital.hospitalCode
                "
                [class.bg-brand-50]="selectedHospital()?.hospitalCode === hospital.hospitalCode"
              >
                <img
                  [src]="hospital.logo"
                  [alt]="hospital.name"
                  class="h-12 w-12 rounded-lg object-contain"
                />
                <span
                  ><strong class="block">{{ hospital.name }}</strong
                  ><small class="text-slate-500">{{ hospital.hospitalCode }}</small></span
                >
              </button>
            }
          </div>
        </section>

        @if (invoiceLoading()) {
          <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading invoice…</p>
        } @else if (invoiceError()) {
          <section role="alert" class="mt-6 rounded-2xl bg-amber-50 p-6 text-amber-950">
            <p>{{ invoiceError() }}</p>
            @if (selectedHospital()) {
              <button
                type="button"
                class="mt-3 font-bold underline"
                (click)="loadInvoice(selectedHospital()!)"
              >
                Try again
              </button>
            }
          </section>
        }
        @if (invoice(); as bill) {
          <section class="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div class="rounded-2xl border bg-white p-6">
              <h2 class="text-xl font-bold">Invoice</h2>
              <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-slate-500">Patient</dt>
                  <dd class="font-semibold">{{ bill.patient.displayName || 'Patient' }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500">Hospital reference</dt>
                  <dd class="font-semibold">
                    {{
                      bill.hospital.externalPatientReference ||
                        bill.hospital.patientReference ||
                        'Not supplied'
                    }}
                  </dd>
                </div>
                <div>
                  <dt class="text-slate-500">Invoice reference</dt>
                  <dd class="font-semibold">{{ bill.reference || 'Not supplied' }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500">Date</dt>
                  <dd class="font-semibold">
                    {{ bill.date ? (bill.date | date: 'mediumDate') : 'Not supplied' }}
                  </dd>
                </div>
              </dl>
              <h3 class="mt-7 font-bold">Invoice items</h3>
              <div class="mt-3 divide-y rounded-xl border">
                @for (item of bill.items; track item.itemReference) {
                  <label
                    class="flex items-center justify-between gap-3 p-4"
                    [class.opacity-50]="item.payable !== true"
                  >
                    <span class="flex items-center gap-3"
                      ><input
                        type="checkbox"
                        [checked]="isSelected(item)"
                        [disabled]="!isSelectable(item) || paymentPending()"
                        (change)="toggleItem(item)"
                      />
                      <span
                        >{{ item.description }}
                        @if (item.payable !== true) {
                          <small class="block text-slate-500">Not payable</small>
                        }
                      </span></span
                    >
                    <span class="font-semibold">{{
                      formatAmount(item.amount, bill.currency)
                    }}</span>
                  </label>
                }
              </div>
            </div>
            <aside class="h-fit rounded-2xl border bg-white p-6">
              <h2 class="text-xl font-bold">Payment</h2>
              <p class="mt-2 text-sm text-slate-600">
                Select payable items and continue to SmartClinic's secure payment page.
              </p>
              <dl class="mt-5 border-t pt-4">
                <div class="flex justify-between gap-4">
                  <dt>Selected total</dt>
                  <dd class="font-bold">{{ formatAmount(selectedTotal(), bill.currency) }}</dd>
                </div>
              </dl>
              <app-payment-contact-email />
              <button
                type="button"
                (click)="pay()"
                [disabled]="!selectedItems().length || paymentPending() || !bill.reference || paymentBlocksRetry()"
                class="mt-5 min-h-12 w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ paymentPending() ? 'Preparing secure payment…' : 'Pay securely' }}
              </button>
              @if (paymentError()) {
                <p role="alert" class="mt-3 text-sm text-red-700">{{ paymentError() }}</p>
              }
            </aside>
          </section>
        }
        @if (payment(); as result) {
          <section class="mt-6 rounded-2xl border bg-white p-6" aria-live="polite">
            @if (result.status === 'PAID') {
              <h2 class="text-xl font-bold text-green-900">Payment successful</h2>
              <p class="mt-2 text-green-900">Your hospital invoice has been updated.</p>
            } @else if (result.status === 'PAYMENT_RECEIVED_HOSPITAL_PENDING') {
              <h2 class="text-xl font-bold text-amber-900">Payment received</h2>
              <p class="mt-2 text-amber-900">
                The hospital system has not confirmed the invoice update yet. Do not pay again.
              </p>
            } @else if (result.status === 'FAILED') {
              <h2 class="text-xl font-bold text-red-900">Payment could not be completed</h2>
            } @else {
              <h2 class="text-xl font-bold">Payment pending</h2>
              <p class="mt-2 text-slate-600">
                We are still waiting for authoritative confirmation.
              </p>
            }
            <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-slate-500">Payment reference</dt>
                <dd class="font-semibold">{{ result.reference }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Amount</dt>
                <dd class="font-semibold">{{ formatAmount(result.amount, result.currency) }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Invoice</dt>
                <dd class="font-semibold">{{ result.invoiceReference }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Hospital</dt>
                <dd class="font-semibold">{{ selectedHospital()?.name || result.hospitalCode }}</dd>
              </div>
            </dl>
          </section>
        }
      }
    </main>
  `,
})
export class PayBillsPageComponent {
  @ViewChild(PaymentContactEmailComponent) private paymentContact?: PaymentContactEmailComponent;
  private readonly api = inject(HospitalBillPaymentsApiService);
  readonly hospitals = signal<readonly ConnectedHospital[]>([]);
  readonly selectedHospital = signal<ConnectedHospital | null>(null);
  readonly invoice = signal<HospitalInvoice | null>(null);
  readonly selectedItems = signal<readonly string[]>([]);
  readonly hospitalLoading = signal(true);
  readonly hospitalError = signal(false);
  readonly invoiceLoading = signal(false);
  readonly invoiceError = signal<string | null>(null);
  readonly paymentPending = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly payment = signal<HospitalBillPayment | null>(null);
  readonly popup = new PaystackPop();

  constructor() {
    this.loadHospitals();
  }

  loadHospitals(): void {
    this.hospitalLoading.set(true);
    this.hospitalError.set(false);
    this.api
      .getHospitals()
      .pipe(finalize(() => this.hospitalLoading.set(false)))
      .subscribe({
        next: (hospitals) => this.hospitals.set(hospitals),
        error: () => this.hospitalError.set(true),
      });
  }
  selectHospital(hospital: ConnectedHospital): void {
    this.selectedHospital.set(hospital);
    this.payment.set(null);
    this.loadInvoice(hospital);
  }
  loadInvoice(hospital: ConnectedHospital): void {
    this.invoiceLoading.set(true);
    this.invoiceError.set(null);
    this.invoice.set(null);
    this.selectedItems.set([]);
    this.payment.set(null);
    this.paymentError.set(null);
    this.api
      .getInvoice(hospital.hospitalCode)
      .pipe(finalize(() => this.invoiceLoading.set(false)))
      .subscribe({
        next: (invoice) => this.invoice.set(invoice),
        error: (error: unknown) => this.invoiceError.set(this.readableInvoiceError(error)),
      });
  }
  isSelected(item: HospitalInvoiceItem): boolean {
    return this.selectedItems().includes(item.itemReference);
  }
  toggleItem(item: HospitalInvoiceItem): void {
    if (!this.isSelectable(item) || this.paymentPending()) return;
    this.selectedItems.update((items) =>
      items.includes(item.itemReference)
        ? items.filter((value) => value !== item.itemReference)
        : [...items, item.itemReference],
    );
  }
  isSelectable(item: HospitalInvoiceItem): boolean {
    return item.payable === true && this.toMinor(item.amount) > 0n;
  }
  paymentBlocksRetry(): boolean {
    const status = this.payment()?.status;
    return status === 'PENDING' || status === 'PAYMENT_RECEIVED_HOSPITAL_PENDING' || status === 'PAID';
  }
  selectedTotal(): bigint {
    return this.selectedItems().reduce(
      (sum, reference) =>
        sum +
        this.toMinor(
          this.invoice()?.items.find((item) => item.itemReference === reference)?.amount,
        ),
      0n,
    );
  }
  formatAmount(amount: string | bigint | null, currency: string): string {
    return this.money(typeof amount === 'bigint' ? amount : this.toMinor(amount), currency);
  }
  private money(minor: bigint, currency: string): string {
    return `${currency} ${(Number(minor) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  private toMinor(value: string | null | undefined): bigint {
    if (!value || !/^\d+(?:\.\d{1,2})?$/.test(value)) return 0n;
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  }
  pay(): void {
    const bill = this.invoice();
    const hospital = this.selectedHospital();
    const paymentOptions = this.paymentContact?.request();
    if (
      !bill?.reference ||
      !hospital ||
      !this.selectedItems().length ||
      this.paymentPending() ||
      paymentOptions === null ||
      this.paymentBlocksRetry()
    )
      return;
    this.paymentPending.set(true);
    this.paymentError.set(null);
    const request = {
      hospitalCode: hospital.hospitalCode,
      invoiceReference: bill.reference,
      items: this.selectedItems().map((itemReference) => ({ itemReference })),
      ...(paymentOptions ?? {}),
    };
    this.api
      .initializePayment(request)
      .pipe(finalize(() => this.paymentPending.set(false)))
      .subscribe({
        next: (result) => this.launchCheckout(result),
        error: (error: unknown) => this.paymentError.set(this.readablePaymentError(error)),
      });
  }
  private launchCheckout(result: HospitalBillPayment): void {
    this.payment.set(result);
    if (result.status === 'PAID' || result.status === 'PAYMENT_RECEIVED_HOSPITAL_PENDING') return;
    if (result.provider === 'OPAY' && result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    if (result.provider === 'PAYSTACK' && result.accessCode) {
      this.popup.resumeTransaction(result.accessCode, {
        onSuccess: () => this.verify(result.reference),
        onError: () =>
          this.paymentError.set('Payment was not completed. You can safely try again.'),
      });
      return;
    }
    this.paymentError.set('Secure payment could not be started. Please try again.');
  }
  verify(reference: string): void {
    this.paymentPending.set(true);
    this.api
      .verifyPayment(reference)
      .pipe(finalize(() => this.paymentPending.set(false)))
      .subscribe({
        next: (result) => this.payment.set(result),
        error: () =>
          this.paymentError.set('We could not confirm the payment yet. Please try again.'),
      });
  }
  private readableInvoiceError(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    return status >= 500
      ? "This hospital's bill service is temporarily unavailable. Please try again later."
      : 'We could not load this invoice. Please try again.';
  }
  private readablePaymentError(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    return status >= 500
      ? 'Secure payment is temporarily unavailable. Please try again later.'
      : 'We could not start secure payment. Please try again.';
  }
}
