import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import PaystackPop from '@paystack/inline-js';
import { finalize, forkJoin } from 'rxjs';
import {
  HospitalCompanionView, HospitalWalletSettlementResponse,  PatientProviderConnection,  PatientProviderConnectionFundingResponse,
} from '../../core/models/patient-provider-connection.model';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { formatMinor } from '../provider/care-money';
import { PaymentContactEmailComponent } from '../../shared/components/payment-contact-email.component';
@Component({
  selector: 'app-provider-connection-detail-page',
  imports: [RouterLink, ReactiveFormsModule, PaymentContactEmailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/me/providers" class="font-bold text-brand-700 underline">← My Hospitals</a>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border p-6">Loading hospital…</p>
    } @else if (error() && !connection()) {
      <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        This hospital connection is unavailable.
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (connection(); as c) {
      <header class="mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-950 via-brand-800 to-violet-600 p-7 text-white shadow-xl shadow-brand-950/10">
        <div class="flex items-start gap-4"><div class="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/20">🏥</div><div><p class="text-sm font-bold uppercase tracking-[.16em] text-violet-200">Your hospital companion</p><h1 class="mt-1 text-3xl font-black">{{ c.provider.displayName }}</h1><p class="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{{ label(c.status) }}{{ c.status === 'CONNECTED' ? ' ✓' : '' }}</p></div></div>
        @if (c.externalPatientReference) { <p class="mt-5 text-sm text-violet-100">Hospital ID <strong class="text-white">{{ c.externalPatientReference }}</strong></p> }
      </header>
      @if (returnUrl) {
        <a [routerLink]="returnUrl" class="mt-4 inline-flex font-bold text-brand-700 underline"
          >Return to access requests</a
        >
      }
      @if (c.status === 'CONNECTED') {
        <section class="mt-6 rounded-[2rem] border border-violet-100 bg-gradient-to-b from-white to-violet-50/50 p-6 shadow-sm">
          <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Today at {{ c.provider.displayName }}</p>
          @if (companionLoading()) {
            <p class="mt-3 text-slate-600">Checking what you need to do next…</p>
          } @else if (companion(); as h) {
            <div class="mt-3 rounded-2xl bg-brand-950 p-5 text-white">
              <p class="text-xs font-bold uppercase tracking-[.15em] text-violet-200">Your next step</p>
              <h2 class="mt-1 text-2xl font-black">{{ h.nextAction.title }}</h2>
              @if (h.consolidatedPayment.itemCount > 0 && h.consolidatedPayment.amountMinor !== null && h.consolidatedPayment.currency) {
                <p class="mt-2 text-violet-100">{{ h.consolidatedPayment.itemCount }} request{{ h.consolidatedPayment.itemCount === 1 ? '' : 's' }} · {{ money(h.consolidatedPayment.amountMinor, h.consolidatedPayment.currency) }}</p>
                @if (h.nextAction.kind === 'PAYMENT_REQUIRED') { <button type="button" (click)="payAllWallet()" [disabled]="settling()" class="mt-4 rounded-xl bg-white px-5 py-3 font-black text-brand-950">{{ settling() ? 'Confirming payment…' : 'Pay all from Wallet →' }}</button> }
              }
            </div>
            @if (servicePass(); as pass) { <div class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p class="text-xs font-bold uppercase tracking-wider text-emerald-700">Payment confirmed ✓</p><h3 class="mt-1 text-xl font-black text-emerald-950">SmartClinic Service Pass</h3><p class="mt-2 font-bold">{{ money(pass.amountMinor, pass.currency) }} · {{ c.provider.displayName }}</p><p class="mt-3 rounded-xl bg-white p-3 font-mono text-sm font-bold">{{ pass.reference }}</p><p class="mt-2 text-sm text-emerald-900">Show this pass at the hospital service point. Open it again whenever staff need to verify payment.</p><button type="button" (click)="refreshPass()" class="mt-3 font-bold text-emerald-900 underline">Refresh verification pass</button></div> }
            @if (h.requests.length) {
              <div class="mt-5 grid gap-3">
                @for (request of h.requests; track request.orderReference) {
                  <article class="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <div class="flex items-start justify-between gap-3">
                      <div><p class="font-black text-brand-950">{{ requestTitle(request.type) }}</p><p class="mt-1 text-sm text-slate-600">{{ request.serviceUnit || 'Requested by your care team' }}</p></div>
                      <span class="rounded-full px-3 py-1 text-xs font-bold" [class]="request.resultReady ? 'bg-emerald-50 text-emerald-800' : request.paymentStatus === 'PAID' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'">{{ request.resultReady ? 'Result ready' : request.paymentStatus === 'PAID' ? 'Paid ✓' : request.paymentStatus === 'NOT_PRICED' ? 'Being prepared' : 'Payment needed' }}</span>
                    </div>
                    @if (request.amountMinor !== null && request.currency) { <p class="mt-3 font-extrabold text-slate-900">{{ money(request.amountMinor, request.currency) }}</p> }
                    @if (request.resultReady) { <a routerLink="/me/tests" class="mt-3 inline-flex font-bold text-brand-700">View result →</a> }
                    @else if (request.type === 'PRESCRIPTION') { <a routerLink="/me/prescriptions" class="mt-3 inline-flex font-bold text-brand-700">Open prescription →</a> }
                    @else { <a routerLink="/me/tests" class="mt-3 inline-flex font-bold text-brand-700">Open request →</a> }
                  </article>
                }
              </div>
            } @else {
              <div class="mt-5 rounded-2xl bg-emerald-50 p-5"><p class="font-black text-emerald-900">Nothing waiting for you ✓</p><p class="mt-1 text-sm text-emerald-800">New requests from this hospital will appear here automatically.</p></div>
            }
          } @else {
            <p class="mt-3 rounded-2xl bg-amber-50 p-4 text-amber-900">Your hospital companion is temporarily unavailable. Your hospital connection is still safe.</p>
          }
          <div class="mt-5 flex flex-wrap gap-3">
            <a routerLink="/me/request-care" [queryParams]="{ journey: 'doctor' }" class="rounded-xl bg-white px-4 py-3 font-bold text-brand-900 ring-1 ring-slate-200">Book care</a>
            <a routerLink="/me/health-records" class="rounded-xl bg-white px-4 py-3 font-bold text-brand-900 ring-1 ring-slate-200">My hospital records</a>
          </div>
        </section>
      }
      <details class="mt-6 rounded-2xl border bg-white p-5"><summary class="cursor-pointer font-bold text-brand-800">Hospital connection details</summary><section class="mt-5">
        <dl class="grid gap-5 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-500">Provider</dt>
            <dd class="font-bold">{{ c.provider.displayName }}</dd>
            <dd>{{ c.provider.providerType }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Original request</dt>
            <dd>{{ path(c.originalIntent) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Current path</dt>
            <dd>{{ path(c.currentPath) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Created</dt>
            <dd>{{ date(c.createdAt) }}</dd>
          </div>
          @if (c.externalPatientReference) {
            <div>
              <dt class="text-sm text-slate-500">Hospital Patient Number</dt>
              <dd class="break-all font-bold">{{ c.externalPatientReference }}</dd>
            </div>
          }
        </dl></section></details>
      <section class="mt-6 rounded-2xl border bg-white p-6">
        <h2 class="text-xl font-bold">Connection payment</h2>
        @if (funding(); as f) {
          <div class="mt-4 grid gap-3">
            @for (item of f.fundings; track item.purpose) {
              <div class="flex flex-wrap justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <p class="font-bold">
                    {{
                      item.purpose === 'INITIAL'
                        ? 'Initial connection'
                        : 'Additional registration funding'
                    }}
                  </p>
                  <p>{{ label(item.fundingStatus) }}</p>
                </div>
                <strong>{{ money(item.amountMinor, item.currency) }}</strong>
              </div>
            }
          </div>
          @if (f.fundingSatisfied) {
            <p class="mt-4 font-bold text-green-800">
              {{
                f.fundings.every((x) => x.fundingStatus === 'SATISFIED_FREE')
                  ? 'No payment required'
                  : 'Payment confirmed'
              }}
            </p>
          } @else {
            <app-payment-contact-email />
            <button
              type="button"
              (click)="pay()"
              [disabled]="paying()"
              class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
            >
              {{ paying() ? 'Preparing payment…' : 'Pay securely' }}
            </button>
          }
        }
      </section>
      @if (c.status === 'SUBMITTED') {
        <section class="mt-6 rounded-2xl bg-brand-50 p-6">
          <h2 class="text-xl font-bold">Registration sent</h2>
          <p class="mt-2">Your registration or record-linking request has been sent to the hospital.</p>
        </section>
      }
      @if (c.status === 'UNABLE_TO_VERIFY') {
        <section class="mt-6 rounded-2xl bg-amber-50 p-6">
          <h2 class="text-xl font-bold">We couldn't verify your existing patient record</h2>
          <p class="mt-2">The hospital was unable to verify the information submitted.</p>
          <label class="mt-4 grid gap-2 font-bold"
            >Correct Hospital Patient Number<input
              [formControl]="correctedReference"
              maxlength="160"
              placeholder="e.g. UCH/2026/001234"
              class="rounded-xl border p-3" /></label
          ><button
            type="button"
            (click)="resubmit()"
            [disabled]="actioning()"
            class="mt-3 rounded-xl border px-4 py-3 font-bold"
          >
            Correct details & try again
          </button>
          @if (c.currentPath === 'EXISTING_PATIENT_LINK' && conversionSupported()) {
            <label class="mt-5 flex gap-3"
              ><input type="checkbox" [formControl]="conversionConsent" /> I consent to register as
              a new patient instead.</label
            ><button
              type="button"
              (click)="convert()"
              [disabled]="actioning() || !conversionConsent.value"
              class="mt-3 rounded-xl bg-brand-700 px-4 py-3 font-bold text-white"
            >
              Register as a new patient instead
            </button>
          }
        </section>
      }
      @if (canCancel(c)) {
        <button
          type="button"
          (click)="cancel()"
          [disabled]="actioning()"
          class="mt-6 font-bold text-red-700 underline"
        >
          Cancel request
        </button>
      }
      @if (error()) {
        <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4">{{ error() }}</p>
      }
    }
  </main>`,
})
export class ProviderConnectionDetailPageComponent {
  @ViewChild(PaymentContactEmailComponent) private paymentContact?: PaymentContactEmailComponent;
  private readonly api = inject(PatientProviderConnectionsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly reference = this.route.snapshot.paramMap.get('reference') ?? '';
  readonly returnUrl = this.safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  readonly connection = signal<PatientProviderConnection | null>(null);
  readonly funding = signal<PatientProviderConnectionFundingResponse | null>(null);
  readonly companion = signal<HospitalCompanionView | null>(null);  readonly companionLoading = signal(false);
  readonly settling = signal(false);
  readonly servicePass = signal<HospitalWalletSettlementResponse['servicePass'] | null>(null);
  readonly loading = signal(true);
  readonly paying = signal(false);
  readonly actioning = signal(false);
  readonly error = signal('');
  readonly correctedReference = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly conversionConsent = new FormControl(false, { nonNullable: true });
  readonly conversionSupported = signal(false);
  popup = new PaystackPop();
  constructor() {
    this.load();
  }
  private safeReturnUrl(value: string | null) {
    return value?.startsWith('/me/') && !value.startsWith('//') ? value : null;
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      connection: this.api.getMine(this.reference),
      funding: this.api.funding(this.reference),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.connection.set(r.connection);
          this.funding.set(r.funding);
          this.api.directory(r.connection.provider.displayName, 1, 100).subscribe({
            next: (page) =>
              this.conversionSupported.set(
                page.items.find(
                  (provider) =>
                    provider.providerReference === r.connection.provider.providerReference,
                )?.newPatientRegistration.enabled ?? false,
              ),
            error: () => this.conversionSupported.set(false),
          });
        },
        error: () => this.error.set('Unable to load this hospital connection.'),
      });
  }
  loadCompanion() {
       this.companionLoading.set(true);
      this.api.companion(this.reference).pipe(finalize(() => this.companionLoading.set(false))).subscribe({ next: value => this.companion.set(value), error: () => this.companion.set(null) });
     }
    payAllWallet(){if(this.settling())return;this.settling.set(true);this.error.set('');this.api.settleWallet(this.reference).pipe(finalize(()=>this.settling.set(false))).subscribe({next:r=>{this.servicePass.set(r.servicePass);this.loadCompanion();},error:e=>this.error.set(e?.error?.message||'Unable to complete this wallet payment.')});}
  refreshPass(){const pass=this.servicePass();if(!pass)return;this.api.servicePassToken(pass.reference).subscribe({next:p=>this.servicePass.set(p),error:()=>this.error.set('Unable to refresh this Service Pass.')});}
  requestTitle(type: string) { return type === 'LABORATORY' ? '🧪 Laboratory request' : type === 'IMAGING' ? '🩻 Imaging request' : type === 'PRESCRIPTION' ? '💊 Prescription' : type === 'PROCEDURE' ? '🏥 Procedure' : '↗ Referral'; }
 pay() {
    const paymentEmail = this.paymentContact?.request();
    if (paymentEmail === null) return;
    const pending = [...(this.funding()?.fundings ?? [])]
      .reverse()
      .find((item) => item.fundingStatus === 'PENDING');
    if (!pending || this.paying()) return;
    this.paying.set(true);
    this.error.set('');
    const initialization = paymentEmail
      ? this.api.initializeFunding(this.reference, paymentEmail)
      : this.api.initializeFunding(this.reference);
    initialization.pipe(finalize(() => this.paying.set(false))).subscribe({
      next: (r) => {
        if (r.provider === 'OPAY' && r.checkoutUrl) {
          window.location.assign(r.checkoutUrl);
          return;
        }
        if (!r.accessCode) {
          this.error.set('Unable to start secure payment.');
          return;
        }
        this.popup.resumeTransaction(r.accessCode, {
          onSuccess: () => this.verify(),
          onError: () => this.error.set('Payment was not completed. You can safely retry.'),
        });
      },
      error: (error) =>
        this.error.set(
          error?.status === 400 &&
            error?.error?.message === 'A valid payment email is required to continue'
            ? error.error.message
            : 'Unable to start secure payment.',
        ),
    });
  }
  verify() {
    this.paying.set(true);
    this.api
      .verifyFunding(this.reference)
      .pipe(finalize(() => this.paying.set(false)))
      .subscribe({
        next: (f) => {
          this.funding.set(f);
          this.api.getMine(this.reference).subscribe((c) => this.connection.set(c));
        },
        error: () => this.error.set('Payment could not be confirmed yet. Try again.'),
      });
  }
  resubmit() {
    const value = this.correctedReference.value.trim();
    if (!value || this.actioning()) return;
    this.actioning.set(true);
    this.api
      .resubmit(this.reference, value)
      .pipe(finalize(() => this.actioning.set(false)))
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('Unable to resubmit these details.'),
      });
  }
  convert() {
    if (!this.conversionConsent.value || this.actioning()) return;
    this.actioning.set(true);
    this.api
      .convert(this.reference)
      .pipe(finalize(() => this.actioning.set(false)))
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('Unable to convert this request.'),
      });
  }
  cancel() {
    if (!confirm('Cancel this hospital connection request?') || this.actioning()) return;
    this.actioning.set(true);
    this.api
      .cancel(this.reference)
      .pipe(finalize(() => this.actioning.set(false)))
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('Unable to cancel this request.'),
      });
  }
  canCancel(c: PatientProviderConnection) {
    return !['CONNECTED', 'REJECTED', 'CANCELLED'].includes(c.status);
  }
  path(v: string) {
    return v === 'NEW_PATIENT_REGISTRATION' ? 'New patient registration' : 'Existing patient link';
  }
  label(v: string) {
    return v
      .split('_')
      .map((x) => x[0] + x.slice(1).toLowerCase())
      .join(' ');
  }
  money(v: number, c: string) {
    return formatMinor(v, c);
  }
  date(v: string) {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(v),
    );
  }
}
