import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import PaystackPop from '@paystack/inline-js';
import { finalize, forkJoin } from 'rxjs';
import { FastTrackPaymentStatus, FastTrackRequest } from '../../core/models/find-care.model';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { UtilsService } from '../../core/services/utils.service';
@Component({
  selector: 'app-fasttrack-detail-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/me/fasttrack" class="font-bold text-brand-700 underline"
      >← FastTrack requests</a
    >
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading FastTrack request…</p>
    } @else if (error()) {
      <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (request(); as r) {
      <header class="mt-6">
        <p class="text-sm font-bold uppercase text-brand-600">FastTrack {{ r.reference }}</p>
        <h1 class="mt-2 text-3xl font-bold">{{ r.service.name }}</h1>
        <p class="mt-2 text-lg font-semibold">{{ label(r.status) }}</p>
      </header>
      <section class="mt-7 rounded-2xl border bg-white p-6">
        <dl class="grid gap-5 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-500">Provider</dt>
            <dd class="font-semibold">{{ r.provider.displayName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Source</dt>
            <dd>
              {{
                r.source === 'EXTERNAL_APPOINTMENT'
                  ? 'Existing appointment'
                  : 'SmartClinic Care Request'
              }}
            </dd>
          </div>
          @if (r.externalAppointment) {
            <div>
              <dt class="text-sm text-slate-500">Appointment reference</dt>
              <dd>{{ r.externalAppointment.reference }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Appointment</dt>
              <dd>
                {{
                  utils.formatAppointment(
                    r.externalAppointment.appointmentDate,
                    r.externalAppointment.appointmentTime
                  )
                }}
              </dd>
            </div>
          }
          <div>
            <dt class="text-sm text-slate-500">FastTrack fee</dt>
            <dd class="font-semibold">{{ money(r.feeMinor, r.currency) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Payment</dt>
            <dd>{{ paymentLabel(payment()?.paymentAttemptStatus ?? null, r.status) }}</dd>
          </div>
        </dl>
      </section>
      @if (r.status === 'VERIFYING') {
        <section class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 class="text-xl font-bold">Your appointment is being verified with the provider</h2>
          <p class="mt-2">
            Payment will become available only after the provider verifies the appointment.
          </p>
        </section>
      } @else if (r.status === 'READY_FOR_PAYMENT' || r.status === 'PAYMENT_PENDING') {
        <section class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 class="text-xl font-bold">
            {{ r.status === 'READY_FOR_PAYMENT' ? 'Ready for payment' : 'Payment pending' }}
          </h2>
          <p class="mt-2">
            Pay the backend-confirmed FastTrack fee of
            <strong>{{ money(r.feeMinor, r.currency) }}</strong
            >.
          </p>
          <p class="mt-2 text-sm">
            Popup completion is not payment proof. SmartClinic confirms payment with the backend.
          </p>
          <button
            type="button"
            (click)="pay()"
            [disabled]="paying()"
            class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {{
              paying()
                ? 'Preparing secure payment…'
                : r.status === 'PAYMENT_PENDING'
                  ? 'Verify or retry payment'
                  : 'Pay securely'
            }}
          </button>
        </section>
      } @else if (r.status === 'CONFIRMED' || r.status === 'PAID') {
        <section class="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
          <h2 class="text-xl font-bold text-green-950">FastTrack confirmed</h2>
          <p class="mt-2">The backend has confirmed your payment and FastTrack request.</p>
        </section>
      }
      <p class="mt-6 rounded-xl bg-slate-50 p-4">
        Clinical urgency and medical triage always take priority.
      </p>
    }
  </main>`,
})
export class FastTrackDetailPageComponent {
  private readonly api = inject(FastTrackApiService);
  readonly utils = inject(UtilsService);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly request = signal<FastTrackRequest | null>(null);
  readonly payment = signal<FastTrackPaymentStatus | null>(null);
  readonly loading = signal(true);
  readonly paying = signal(false);
  readonly error = signal<string | null>(null);
  popup = new PaystackPop();
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      request: this.api.get(this.reference),
      payment: this.api.getPayment(this.reference),
    }).subscribe({
      next: (v) => {
        this.request.set(v.request);
        this.payment.set(v.payment);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("We couldn't load this FastTrack request.");
      },
    });
  }
  pay() {
    if (this.paying()) return;
    const r = this.request();
    if (!r || !['READY_FOR_PAYMENT', 'PAYMENT_PENDING'].includes(r.status)) return;
    this.paying.set(true);
    this.error.set(null);
    this.api
      .initializePayment(this.reference)
      .pipe(finalize(() => this.paying.set(false)))
      .subscribe({
        next: (p) => {
          this.payment.set(p);
          if (!p.accessCode) {
            this.error.set('We could not start secure payment. Try again.');
            return;
          }
          this.popup.resumeTransaction(p.accessCode, {
            onSuccess: () => this.verify(),
            onError: () => this.error.set('Payment was not completed. You can safely try again.'),
          });
        },
        error: () => this.error.set('We could not start secure payment. Try again.'),
      });
  }
  verify() {
    if (this.paying()) return;
    this.paying.set(true);
    this.api
      .verifyPayment(this.reference)
      .pipe(finalize(() => this.paying.set(false)))
      .subscribe({
        next: (p) => {
          this.payment.set(p);
          this.api.get(this.reference).subscribe({ next: (r) => this.request.set(r) });
        },
        error: () => this.error.set('We could not confirm the payment yet. Refresh or try again.'),
      });
  }
  label(s: string) {
    return (
      (
        {
          VERIFYING: 'Verifying appointment',
          READY_FOR_PAYMENT: 'Ready for payment',
          PAYMENT_PENDING: 'Payment pending',
          CONFIRMED: 'FastTrack confirmed',
        } as Record<string, string>
      )[s] ??
      s
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
  paymentLabel(attempt: string | null, status: string) {
    if (status === 'CONFIRMED' || status === 'PAID') return 'Payment confirmed';
    if (attempt === 'FAILED') return 'Payment failed';
    if (attempt) return 'Payment pending';
    return 'Not started';
  }
  money(minor: number, currency: string) {
    const digits = new Intl.NumberFormat('en-NG', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(
      minor / 10 ** digits,
    );
  }
}
