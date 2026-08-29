import { ChangeDetectionStrategy, Component, inject, Injector, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { PatientHealthCheckDetail } from '../../core/models/patient-health-check-history.model';
import { PublicBookingPaymentStatus } from '../../core/models/public-booking.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { FastTrackPaymentStatus } from '../../core/models/find-care.model';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { CareRequestFunding } from '../../core/models/find-care.model';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';

@Component({
  selector: 'app-patient-payment-return-page',
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Payment return</p>
      @if (verifying()) { <section role="status" class="mt-6 rounded-2xl border bg-white p-7"><h1 class="text-2xl font-bold">Verifying your payment…</h1><p class="mt-2 text-slate-600">SmartClinic is checking the authoritative payment status.</p></section> }
      @if (error()) { <section role="alert" class="mt-6 rounded-2xl bg-red-50 p-7 text-red-950"><h1 class="text-2xl font-bold">We could not confirm the payment yet</h1><p class="mt-2">Refresh or try verification again.</p><button type="button" (click)="verify()" [disabled]="verifying()" class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">Try verification again</button></section> }
      @if (status(); as payment) {
        <section class="mt-6 rounded-2xl border bg-white p-7">
          @if (payment.fundingStatus === 'SETTLED') { <h1 class="text-2xl font-bold text-green-900">Payment confirmed</h1><p class="mt-2">{{ payment.bookingStatus === 'SCHEDULED' ? 'Your appointment is scheduled.' : 'We are now finding a suitable provider for your Health Check.' }}</p> }
          @else if (payment.paymentStatus === 'FAILED' || payment.paymentStatus === 'CANCELLED') { <h1 class="text-2xl font-bold">Payment was not completed successfully</h1><p class="mt-2">Return to your Health Check and try again.</p> }
          @else { <h1 class="text-2xl font-bold">Payment pending</h1><p class="mt-2">We could not confirm the payment yet. You can retry verification.</p><button type="button" (click)="verify()" class="mt-4 rounded-xl border border-brand-700 px-5 py-3 font-bold text-brand-700">Try verification again</button> }
          <div class="mt-6 flex flex-wrap gap-3"><a [routerLink]="['/me/health-checks', reference]" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">View Health Check</a><a routerLink="/me/health-checks" class="rounded-xl border px-5 py-3 font-bold">Back to My Health Checks</a></div>
        </section>
      }
      @if (fastTrackStatus(); as payment) {
        <section class="mt-6 rounded-2xl border bg-white p-7">
          @if (payment.fastTrackStatus === 'CONFIRMED' || payment.fastTrackStatus === 'PAID') { <h1 class="text-2xl font-bold text-green-900">Payment confirmed</h1><p class="mt-2">Your FastTrack request is confirmed.</p> }
          @else if (payment.paymentAttemptStatus === 'FAILED') { <h1 class="text-2xl font-bold">Payment was not completed successfully</h1><p class="mt-2">Return to FastTrack and try again.</p> }
          @else { <h1 class="text-2xl font-bold">Payment pending</h1><p class="mt-2">We could not confirm the payment yet.</p><button type="button" (click)="verify()" class="mt-4 rounded-xl border border-brand-700 px-5 py-3 font-bold text-brand-700">Try verification again</button> }
          <div class="mt-6 flex flex-wrap gap-3"><a [routerLink]="['/me/fasttrack', reference]" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">View FastTrack request</a><a routerLink="/me/fasttrack" class="rounded-xl border px-5 py-3 font-bold">Back to FastTrack requests</a></div>
        </section>
      }
      @if (careFunding(); as payment) {
        <section class="mt-6 rounded-2xl border bg-white p-7">
          @if (payment.fundingStatus === 'PAID') { <h1 class="text-2xl font-bold text-green-900">Payment confirmed</h1><p class="mt-2">Your provider can now schedule your care.</p> }
          @else if (payment.fundingStatus === 'SATISFIED_FREE') { <h1 class="text-2xl font-bold text-green-900">No payment required</h1><p class="mt-2">This care service is free.</p> }
          @else { <h1 class="text-2xl font-bold">Payment pending</h1><p class="mt-2">We could not confirm the payment yet.</p><button type="button" (click)="verify()" class="mt-4 rounded-xl border border-brand-700 px-5 py-3 font-bold text-brand-700">Try verification again</button> }
          <div class="mt-6 flex flex-wrap gap-3"><a [routerLink]="['/me/care', reference]" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">View Care Request</a><a routerLink="/me/care" class="rounded-xl border px-5 py-3 font-bold">Back to My Care</a></div>
        </section>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientPaymentReturnPageComponent {
  private readonly api = inject(HealthCheckResultsApiService);
  private readonly injector = inject(Injector);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly verifying = signal(false);
  readonly error = signal(false);
  readonly status = signal<PublicBookingPaymentStatus | null>(null);
  readonly detail = signal<PatientHealthCheckDetail | null>(null);
  readonly fastTrackStatus = signal<FastTrackPaymentStatus | null>(null);
  readonly careFunding = signal<CareRequestFunding | null>(null);
  constructor() { this.verify(); }
  verify(): void {
    if (!this.reference || this.verifying()) return;
    this.verifying.set(true); this.error.set(false); this.status.set(null);
    if (this.reference.startsWith('SC-FT-')) {
      const fastTrack = this.injector.get(FastTrackApiService);
      fastTrack.verifyPayment(this.reference).pipe(finalize(() => this.verifying.set(false))).subscribe({next: payment => this.fastTrackStatus.set(payment), error: () => this.error.set(true)});
      return;
    }
    if (this.reference.startsWith('SC-CARE-')) {
      const care = this.injector.get(CareRequestsApiService);
      care.verifyLatestFunding(this.reference).pipe(finalize(() => this.verifying.set(false))).subscribe({
        next: funding => this.careFunding.set(funding),
        error: () => this.error.set(true),
      });
      return;
    }
    this.api.verifyMyHealthCheckPayment(this.reference).pipe(
      switchMap(() => forkJoin({ status: this.api.getMyHealthCheckPayment(this.reference), detail: this.api.getMyHealthCheck(this.reference) })),
      finalize(() => this.verifying.set(false)),
    ).subscribe({ next: ({ status, detail }) => { this.status.set(status); this.detail.set(detail); }, error: () => this.error.set(true) });
  }
}
