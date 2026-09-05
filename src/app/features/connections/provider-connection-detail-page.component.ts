import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import PaystackPop from '@paystack/inline-js';
import { finalize, forkJoin } from 'rxjs';
import {
  PatientProviderConnection,
  PatientProviderConnectionFundingResponse,
} from '../../core/models/patient-provider-connection.model';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { formatMinor } from '../provider/care-money';
import { PaymentContactEmailComponent } from '../../shared/components/payment-contact-email.component';
@Component({
  selector: 'app-provider-connection-detail-page',
  imports: [RouterLink, ReactiveFormsModule, PaymentContactEmailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/me/providers" class="font-bold text-brand-700 underline">← My Providers</a>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border p-6">Loading Provider connection…</p>
    } @else if (error() && !connection()) {
      <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        This Provider connection is unavailable.
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (connection(); as c) {
      <header class="mt-6">
        <p class="break-all text-sm font-bold text-brand-700">{{ c.reference }}</p>
        <h1 class="mt-2 text-3xl font-bold">{{ c.provider.displayName }}</h1>
        <p class="mt-2 text-lg font-bold">{{ label(c.status) }}</p>
      </header>
      @if (returnUrl) {
        <a [routerLink]="returnUrl" class="mt-4 inline-flex font-bold text-brand-700 underline">Return to access requests</a>
      }
      <section class="mt-6 rounded-2xl border bg-white p-6">
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
              <dt class="text-sm text-slate-500">Provider Patient Number</dt>
              <dd class="break-all font-bold">{{ c.externalPatientReference }}</dd>
            </div>
          }
        </dl>
      </section>
      <section class="mt-6 rounded-2xl border bg-white p-6">
        <h2 class="text-xl font-bold">Funding</h2>
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
          <h2 class="text-xl font-bold">Awaiting Provider action</h2>
          <p class="mt-2">Your registration or linking request has been sent to the Provider.</p>
        </section>
      }
      @if (c.status === 'UNABLE_TO_VERIFY') {
        <section class="mt-6 rounded-2xl bg-amber-50 p-6">
          <h2 class="text-xl font-bold">We couldn't verify your existing patient record</h2>
          <p class="mt-2">The Provider was unable to verify the information submitted.</p>
          <label class="mt-4 grid gap-2 font-bold"
            >Correct Provider Patient Number<input
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
          Cancel connection request
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
            next: (page) => this.conversionSupported.set(
              page.items.find((provider) => provider.providerReference === r.connection.provider.providerReference)?.newPatientRegistration.enabled ?? false,
            ),
            error: () => this.conversionSupported.set(false),
          });
        },
        error: () => this.error.set('Unable to load this Provider connection.'),
      });
  }
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
    initialization
      .pipe(finalize(() => this.paying.set(false)))
      .subscribe({
        next: (r) => {
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
    if (!confirm('Cancel this Provider connection request?') || this.actioning()) return;
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
