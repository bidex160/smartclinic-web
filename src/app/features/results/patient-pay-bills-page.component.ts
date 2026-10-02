import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
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
  selector: 'app-patient-pay-bills-page',
  imports: [RouterLink, DatePipe, PaymentContactEmailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <a routerLink="/me/dashboard" class="font-bold text-brand-700 underline">← Dashboard</a>
      <header class="mt-6">
        <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Payments</p>
        <h1 class="mt-2 text-3xl font-bold">Pay Bills</h1>
        <p class="mt-2 text-slate-600">Pay an outstanding invoice from a connected hospital.</p>
      </header>
      @if (loadingHospitals()) {
        <p role="status" class="mt-7 rounded-2xl border bg-white p-6">
          Loading connected hospitals…
        </p>
      } @else if (hospitalError()) {
        <section role="alert" class="mt-7 rounded-2xl bg-red-50 p-6 text-red-950">
          We could not load your connected hospitals.
          <button type="button" class="font-bold underline" (click)="loadHospitals()">
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
        <section class="mt-7 rounded-2xl border bg-white p-6" aria-labelledby="hospital-heading">
          <h2 id="hospital-heading" class="text-xl font-bold">Select a hospital</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            @for (hospital of hospitals(); track hospital.hospitalCode) {
              <button
                type="button"
                (click)="selectHospital(hospital)"
                [attr.aria-pressed]="selectedHospital()?.hospitalCode === hospital.hospitalCode"
                class="flex min-h-20 items-center gap-3 rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                [class.border-brand-600]="
                  selectedHospital()?.hospitalCode === hospital.hospitalCode
                "
              >
                <img
                  [src]="hospital.logo"
                  [alt]="hospital.name"
                  class="h-12 w-12 rounded-lg object-contain"
                /><span
                  ><strong class="block">{{ hospital.name }}</strong
                  ><small class="text-slate-500">{{ hospital.hospitalCode }}</small></span
                >
              </button>
            }
          </div>
        </section>
        @if (selectedHospital()) {
          <section class="mt-6 rounded-2xl border bg-white p-6">
            <label for="invoice-reference" class="font-bold">Invoice reference</label>
            <div class="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="invoice-reference"
                class="min-h-12 flex-1 rounded-xl border p-3"
                [value]="invoiceReference()"
                (input)="setInvoiceReference($event)"
                placeholder="Enter your invoice reference"
              /><button
                type="button"
                class="min-h-12 rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50"
                (click)="loadInvoice()"
                [disabled]="!invoiceReference().trim() || loadingInvoice()"
              >
                {{ loadingInvoice() ? 'Loading…' : 'Load invoice' }}
              </button>
            </div>
          </section>
        }
        @if (invoiceError()) {
          <section role="alert" class="mt-6 rounded-2xl bg-amber-50 p-6 text-amber-950">
            {{ invoiceError() }}
            <button type="button" class="font-bold underline" (click)="loadInvoice()">
              Try again
            </button>
          </section>
        }
        @if (invoice(); as bill) {
          <section class="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div class="rounded-2xl border bg-white p-6">
              <div class="flex items-center gap-3">
                <img
                  [src]="bill.hospital.logo"
                  [alt]="bill.hospital.name"
                  class="h-12 w-12 rounded-lg object-contain"
                />
                <div>
                  <h2 class="text-xl font-bold">{{ bill.hospital.name }}</h2>
                  <p class="text-sm text-slate-500">{{ bill.patient.displayName || 'Patient' }}</p>
                </div>
              </div>
              <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
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
                  <dt class="text-slate-500">Invoice</dt>
                  <dd class="font-semibold">{{ bill.reference || invoiceReference() }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500">Date</dt>
                  <dd class="font-semibold">
                    {{ bill.date ? (bill.date | date: 'mediumDate') : 'Not supplied' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-slate-500">Outstanding</dt>
                  <dd class="font-semibold">{{ money(bill.outstanding, bill.currency) }}</dd>
                </div>
              </dl>
              <h3 class="mt-7 font-bold">Invoice items</h3>
              <div class="mt-3 divide-y rounded-xl border">
                @for (item of bill.items; track item.itemReference) {
                  <label
                    class="flex items-center justify-between gap-3 p-4"
                    [class.opacity-50]="item.payable !== true"
                    ><span class="flex items-center gap-3"
                      ><input
                        type="checkbox"
                        [checked]="selectedItems().includes(item.itemReference)"
                        [disabled]="item.payable !== true || paymentBusy()"
                        (change)="toggleItem(item)"
                      /><span
                        >{{ item.description }}
                        @if (item.payable !== true) {
                          <small class="block text-slate-500">Not payable</small>
                        }
                      </span></span
                    ><span class="font-semibold">{{
                      money(item.amount, bill.currency)
                    }}</span></label
                  >
                }
              </div>
            </div>
            <aside class="h-fit rounded-2xl border bg-white p-6">
              <h2 class="text-xl font-bold">Payment</h2>
              <p class="mt-2 text-sm text-slate-600">
                Pay securely through SmartClinic. The backend will confirm the final amount.
              </p>
              <div class="mt-5 flex justify-between border-t pt-4">
                <span>Selected total</span
                ><strong>{{ money(selectedTotal(), bill.currency) }}</strong>
              </div>
              <app-payment-contact-email /><button
                type="button"
                (click)="pay()"
                [disabled]="!selectedItems().length || paymentBusy()"
                class="mt-5 min-h-12 w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ paymentBusy() ? 'Preparing secure payment…' : 'Pay securely' }}
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
              <h2 class="text-xl font-bold text-green-900">Payment confirmed</h2>
              <p class="mt-2">Your hospital invoice has been updated.</p>
            } @else if (result.status === 'PAYMENT_RECEIVED_HOSPITAL_PENDING') {
              <h2 class="text-xl font-bold text-amber-900">Payment received</h2>
              <p class="mt-2">
                The hospital system has not confirmed the invoice update yet. Do not pay again.
              </p>
            } @else if (result.status === 'FAILED') {
              <h2 class="text-xl font-bold text-red-900">Payment failed</h2>
            } @else {
              <h2 class="text-xl font-bold">Payment confirmation pending</h2>
            }
            <dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-slate-500">Payment reference</dt>
                <dd class="font-semibold">{{ result.reference }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Amount</dt>
                <dd class="font-semibold">{{ money(result.amount, result.currency) }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Invoice</dt>
                <dd class="font-semibold">{{ result.invoiceReference }}</dd>
              </div>
              <div>
                <dt class="text-slate-500">Hospital</dt>
                <dd class="font-semibold">{{ result.hospitalCode }}</dd>
              </div>
            </dl>
          </section>
        }
      }
    </main>
  `,
})
export class PatientPayBillsPageComponent {
  @ViewChild(PaymentContactEmailComponent) private paymentContact?: PaymentContactEmailComponent;
  private readonly api = inject(HospitalBillPaymentsApiService);
  readonly hospitals = signal<readonly ConnectedHospital[]>([]);
  readonly selectedHospital = signal<ConnectedHospital | null>(null);
  readonly invoiceReference = signal('');
  readonly invoice = signal<HospitalInvoice | null>(null);
  readonly selectedItems = signal<readonly string[]>([]);
  readonly loadingHospitals = signal(true);
  readonly hospitalError = signal(false);
  readonly loadingInvoice = signal(false);
  readonly invoiceError = signal<string | null>(null);
  readonly paymentBusy = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly payment = signal<HospitalBillPayment | null>(null);
  readonly popup = new PaystackPop();

  constructor() {
    this.loadHospitals();
  }
  loadHospitals(): void {
    this.loadingHospitals.set(true);
    this.hospitalError.set(false);
    this.api
      .getHospitals()
      .pipe(finalize(() => this.loadingHospitals.set(false)))
      .subscribe({
        next: (value) => this.hospitals.set(value),
        error: () => this.hospitalError.set(true),
      });
  }
  selectHospital(hospital: ConnectedHospital): void {
    this.selectedHospital.set(hospital);
    this.invoice.set(null);
    this.selectedItems.set([]);
    this.invoiceError.set(null);
  }
  setInvoiceReference(event: Event): void {
    this.invoiceReference.set((event.target as HTMLInputElement).value);
  }
  loadInvoice(): void {
    const hospital = this.selectedHospital();
    const reference = this.invoiceReference().trim();
    if (!hospital || !reference || this.loadingInvoice()) return;
    this.loadingInvoice.set(true);
    this.invoiceError.set(null);
    this.invoice.set(null);
    this.selectedItems.set([]);
    this.api
      .getInvoice(hospital.hospitalCode, reference)
      .pipe(finalize(() => this.loadingInvoice.set(false)))
      .subscribe({
        next: (value) => this.invoice.set(value),
        error: (error) => this.invoiceError.set(this.invoiceErrorMessage(error)),
      });
  }
  toggleItem(item: HospitalInvoiceItem): void {
    if (item.payable !== true || this.paymentBusy()) return;
    this.selectedItems.update((items) =>
      items.includes(item.itemReference)
        ? items.filter((value) => value !== item.itemReference)
        : [...items, item.itemReference],
    );
  }
  selectedTotal(): string {
    let total = '0.00';
    for (const ref of this.selectedItems())
      total = this.addMoney(
        total,
        this.invoice()?.items.find((item) => item.itemReference === ref)?.amount,
      );
    return total;
  }
  money(value: string | null, currency: string): string {
    return value === null
      ? 'Not supplied'
      : `${currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  pay(): void {
    const hospital = this.selectedHospital();
    const bill = this.invoice();
    const options = this.paymentContact?.request();
    if (
      !hospital ||
      !bill?.reference ||
      !this.selectedItems().length ||
      this.paymentBusy() ||
      options === null
    )
      return;
    this.paymentBusy.set(true);
    this.paymentError.set(null);
    this.api
      .initializePayment({
        hospitalCode: hospital.hospitalCode,
        invoiceReference: bill.reference,
        items: this.selectedItems().map((itemReference) => ({ itemReference })),
        ...(options ?? {}),
      })
      .pipe(finalize(() => this.paymentBusy.set(false)))
      .subscribe({
        next: (result) => this.launchCheckout(result),
        error: (error) => this.paymentError.set(this.paymentErrorMessage(error)),
      });
  }
  private launchCheckout(result: HospitalBillPayment): void {
    this.payment.set(result);
    if (result.provider === 'OPAY' && result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    if (result.provider === 'PAYSTACK' && result.accessCode) {
      this.popup.resumeTransaction(result.accessCode, {
        onSuccess: () => this.verify(result.reference),
        onError: () => this.paymentError.set('Payment was not completed. You can safely retry.'),
      });
      return;
    }
    this.paymentError.set('Secure payment could not be started. Please try again.');
  }
  verify(reference: string): void {
    if (this.paymentBusy()) return;
    this.paymentBusy.set(true);
    this.api
      .verifyPayment(reference)
      .pipe(finalize(() => this.paymentBusy.set(false)))
      .subscribe({
        next: (result) => this.payment.set(result),
        error: () =>
          this.paymentError.set('We could not confirm the payment yet. Please try again.'),
      });
  }
  private addMoney(left: string | null, right: string | null | undefined): string {
    const toMinor = (value: string | null | undefined): bigint =>
      value && /^\d+(?:\.\d{1,2})?$/.test(value)
        ? BigInt(value.split('.')[0]) * 100n + BigInt((value.split('.')[1] || '').padEnd(2, '0'))
        : 0n;
    const total = toMinor(left) + toMinor(right);
    return `${total / 100n}.${(total % 100n).toString().padStart(2, '0')}`;
  }
  private invoiceErrorMessage(error: any): string {
    if(error?.['error'] && error.error.message) {
      return error.error.message;
    }
    return error instanceof HttpErrorResponse && error.status >= 500
      ? "This hospital's bill service is temporarily unavailable. Please try again later."
      : 'We could not load this invoice. Please check the reference and try again.';
  }
  private paymentErrorMessage(error: any): string {
    if(error?.['error'] && error.error.message) {
      return error.error.message;
    }
    return error instanceof HttpErrorResponse && error.status >= 500
      ? 'Secure payment is temporarily unavailable. Please try again later.'
      : 'We could not start secure payment. Please try again.';
  }
}
