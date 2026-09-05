import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CareRequest, CareRequestFunding } from '../../core/models/find-care.model';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { CareChatApiService } from '../../core/services/care-chat-api.service';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from './care-delivery-mode';
import { formatMinor } from '../provider/care-money';
import PaystackPop from '@paystack/inline-js';
import { PaymentContactEmailComponent } from '../../shared/components/payment-contact-email.component';

@Component({
  selector: 'app-care-detail-page',
  imports: [RouterLink, PaymentContactEmailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <a routerLink="/me/care" class="font-bold text-brand-700 underline">← My Care</a>
      @if (loading()) {
        <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading Care Request…</p>
      } @else if (error()) {
        <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
          We couldn't load this Care Request.
          <button type="button" (click)="load()" class="font-bold underline">Try again</button>
        </div>
      } @else if (request(); as r) {
        <header class="mt-6">
          <p class="text-sm font-bold uppercase text-brand-600">Care Request {{ r.reference }}</p>
          <h1 class="mt-2 text-3xl font-bold">{{ r.service.name }}</h1>
          <p class="mt-2 text-lg">{{ label(r.status) }}</p>
        </header>
        <section class="mt-7 rounded-2xl border bg-white p-6">
          <dl class="grid gap-5 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-slate-500">Delivery</dt>
              <dd>{{ deliveryModeLabel(r.deliveryMode) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Service price</dt>
              <dd class="font-semibold">
                {{
                  r.service.price
                    ? formatPrice(r.service.price.priceMinor, r.service.price.currency)
                    : 'Not set yet'
                }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Provider</dt>
              <dd class="font-semibold">
                {{
                  r.assignedProvider?.displayName ||
                    r.preferredProvider?.displayName ||
                    'SmartClinic is helping choose'
                }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Location</dt>
              <dd>
                @if (r.geography; as geography) {
                  {{ geography.city }}, {{ geography.stateOrRegion }},
                  {{ geography.countryCode }}
                } @else {
                  Virtual care
                }
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Requested appointment</dt>
              <dd>
                {{
                  r.preferredDate
                    ? utils.formatAppointment(r.preferredDate, r.preferredTime)
                    : 'No date requested'
                }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Contact method</dt>
              <dd>{{ r.contactMethod }}</dd>
            </div>
            @if (r.notes) {
              <div class="sm:col-span-2">
                <dt class="text-sm text-slate-500">Request notes</dt>
                <dd class="whitespace-pre-wrap">{{ r.notes }}</dd>
              </div>
            }
          </dl>
          <p class="mt-6 rounded-xl bg-slate-50 p-4">{{ nextStep(r.status) }}</p>
        </section>
        @if (r.status === 'PROVIDER_ACCEPTED' || r.funding) {
          <section
            class="mt-6 rounded-2xl border bg-white p-6"
            aria-labelledby="care-payment-title"
          >
            <h2 id="care-payment-title" class="text-xl font-bold">Payment</h2>
            @if (fundingLoading()) {
              <p role="status" class="mt-3 text-slate-600">Loading payment status…</p>
            } @else if (funding(); as payment) {
              <dl class="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-sm text-slate-500">Service price</dt>
                  <dd class="font-bold">
                    {{
                      payment.amountMinor !== null && payment.currency
                        ? formatPrice(payment.amountMinor, payment.currency)
                        : 'Not available'
                    }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm text-slate-500">Payment status</dt>
                  <dd class="font-bold">{{ fundingLabel(payment) }}</dd>
                </div>
              </dl>
              @if (payment.fundingStatus === 'SATISFIED_FREE') {
                <p class="mt-4 rounded-xl bg-green-50 p-4 font-semibold text-green-950">
                  No payment required. Your provider can schedule your care.
                </p>
              } @else if (payment.fundingStatus === 'PAID') {
                <p class="mt-4 rounded-xl bg-green-50 p-4 font-semibold text-green-950">
                  Payment confirmed. Your provider can schedule your care.
                </p>
              } @else if (r.status === 'PROVIDER_ACCEPTED' && payment.initializationAllowed) {
                <app-payment-contact-email />
                <button
                  type="button"
                  (click)="payNow()"
                  [disabled]="paymentPending()"
                  class="mt-4 min-h-12 rounded-xl bg-brand-700 px-6 py-3 font-bold text-white disabled:opacity-60"
                >
                  {{ paymentPending() ? 'Preparing secure payment…' : 'Pay now' }}
                </button>
              }
            } @else if (r.status === 'PROVIDER_ACCEPTED') {
              <button
                type="button"
                (click)="loadFunding()"
                class="mt-4 rounded-xl border px-5 py-3 font-bold"
              >
                Refresh payment status
              </button>
            }
            @if (paymentError()) {
              <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">
                {{ paymentError() }}
              </p>
            }
          </section>
        }
        @if (r.appointment; as a) {
          <section class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
            <h2 class="text-xl font-bold">Your appointment</h2>
            <p class="mt-3 font-semibold">
              {{ deliveryModeLabel(a.deliveryMode) }} · {{ appointmentLabel(a.status) }}
            </p>
            @if (a.scheduledDate) {
              <p class="mt-2">
                {{
                  utils.formatAppointment(a.scheduledDate, a.scheduledTimeFrom, a.scheduledTimeTo)
                }}
                @if (a.timezone) {
                  · {{ a.timezone }}
                }
              </p>
            }
            <p class="mt-1">
              {{
                a.deliveryMode === 'VIRTUAL'
                  ? a.hasMeetingLink
                    ? 'Meeting link ready'
                    : 'Meeting link pending'
                  : a.deliveryMode === 'HOME_VISIT'
                    ? 'Home visit'
                    : a.providerLocation?.name || 'Provider location pending'
              }}
            </p>
            <a
              [routerLink]="['/me/care/appointments', a.reference]"
              class="mt-4 inline-block font-bold text-brand-700 underline"
              >View appointment</a
            >
          </section>
        }
        @if (canCancelRequest(r.status) && !r.appointment) {
          <button
            type="button"
            (click)="cancelOpen.set(true)"
            class="mt-6 rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
          >
            Cancel Care Request
          </button>
        }
        @if (chatAvailable()) {
          <section class="mt-6 rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">Communication</h2>
            <p class="mt-2 text-slate-600">Message your provider about this Care Request.</p>
            <a
              [routerLink]="['/me/care', r.reference, 'chat']"
              class="mt-4 inline-flex min-h-12 items-center rounded-xl border border-brand-300 px-5 py-3 font-bold text-brand-800"
              >Open care chat
              @if (chatUnread() > 0) {
                <span class="ml-2 rounded-full bg-brand-700 px-2 py-0.5 text-xs text-white">{{
                  chatUnread()
                }}</span>
              }
            </a>
          </section>
        }
        @if (fastTrackEligible()) {
          <section class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
            <h2 class="text-xl font-bold">FastTrack available</h2>
            <p class="mt-2">
              Request priority appointment handling with this provider. Clinical urgency and medical
              triage always take priority.
            </p>
            @if (actionError()) {
              <p role="alert" class="mt-3 text-red-700">{{ actionError() }}</p>
            }
            <button
              type="button"
              (click)="createFastTrack()"
              [disabled]="creating()"
              class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {{ creating() ? 'Creating FastTrack request…' : 'Request FastTrack' }}
            </button>
          </section>
        }
      }
      @if (cancelOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-care-title"
            class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="cancel-care-title" class="text-xl font-bold">Cancel this Care Request?</h2>
            <p class="mt-2 text-slate-600">
              SmartClinic will stop working on this request. This action does not cancel a scheduled
              appointment.
            </p>
            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                (click)="cancelOpen.set(false)"
                [disabled]="cancelling()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Keep request</button
              ><button
                type="button"
                (click)="cancelRequest()"
                [disabled]="cancelling()"
                class="rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ cancelling() ? 'Cancelling…' : 'Cancel Care Request' }}
              </button>
            </div>
          </section>
        </div>
      }
    </main>
  `,
})
export class CareDetailPageComponent {
  @ViewChild(PaymentContactEmailComponent) private paymentContact?: PaymentContactEmailComponent;
  private readonly api = inject(CareRequestsApiService);
  private readonly chatApi = inject(CareChatApiService);
  private readonly find = inject(FindCareApiService);
  private readonly fast = inject(FastTrackApiService);
  private readonly router = inject(Router);
  readonly utils = inject(UtilsService);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly request = signal<CareRequest | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly fastTrackEligible = signal(false);
  readonly creating = signal(false);
  readonly cancelling = signal(false);
  readonly cancelOpen = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly chatAvailable = signal(false);
  readonly chatUnread = signal(0);
  readonly funding = signal<CareRequestFunding | null>(null);
  readonly fundingLoading = signal(false);
  readonly paymentPending = signal(false);
  readonly paymentError = signal<string | null>(null);
  popup = new PaystackPop();
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api.get(this.reference).subscribe({
      next: (r) => {
        this.request.set(r);
        if (r.status === 'PROVIDER_ACCEPTED') this.loadFunding();
        else this.funding.set(r.funding ? this.summaryFunding(r) : null);
        this.loading.set(false);
        this.checkFastTrack(r);
        this.chatApi.getChat('patient', this.reference).subscribe({
          next: (chat) => {
            this.chatAvailable.set(true);
            this.chatUnread.set(chat.unreadCount);
          },
          error: () => {
            this.chatAvailable.set(false);
            this.chatUnread.set(0);
          },
        });
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
  loadFunding(preserveError = false): void {
    if (this.fundingLoading()) return;
    this.fundingLoading.set(true);
    if (!preserveError) this.paymentError.set(null);
    this.api
      .getFunding(this.reference)
      .pipe(finalize(() => this.fundingLoading.set(false)))
      .subscribe({
        next: (funding) => this.funding.set(funding),
        error: () =>
          this.paymentError.set('We could not load the authoritative payment status. Try again.'),
      });
  }
  payNow(): void {
    const paymentEmail = this.paymentContact?.request();
    if (paymentEmail === null) return;
    const funding = this.funding();
    if (
      this.paymentPending() ||
      !funding?.initializationAllowed ||
      funding.paid ||
      funding.amountMinor === 0
    )
      return;
    this.paymentPending.set(true);
    this.paymentError.set(null);
    const initialization = paymentEmail
      ? this.api.initializeFunding(this.reference, paymentEmail)
      : this.api.initializeFunding(this.reference);
    initialization
      .pipe(finalize(() => this.paymentPending.set(false)))
      .subscribe({
        next: (initialized) => {
          this.funding.set(initialized);
          if (
            initialized.fundingStatus === 'PAID' ||
            initialized.fundingStatus === 'SATISFIED_FREE'
          ) {
            this.refreshAfterPayment();
            return;
          }
          if (!initialized.accessCode) {
            this.paymentError.set(
              'Secure payment could not be started. Refresh the payment status and try again.',
            );
            return;
          }
          this.popup.resumeTransaction(initialized.accessCode, {
            onSuccess: () => this.verifyPayment(),
            onError: () => {
              this.paymentError.set('Payment was not completed. You can safely try again.');
              this.loadFunding(true);
            },
          });
        },
        error: (error) => {
          this.paymentError.set(this.paymentFailureMessage(error));
          this.loadFunding(true);
        },
      });
  }
  verifyPayment(): void {
    if (this.paymentPending()) return;
    this.paymentPending.set(true);
    this.paymentError.set(null);
    this.api
      .verifyLatestFunding(this.reference)
      .pipe(finalize(() => this.paymentPending.set(false)))
      .subscribe({
        next: (funding) => {
          this.funding.set(funding);
          this.refreshAfterPayment();
          if (funding.fundingStatus !== 'PAID')
            this.paymentError.set('Payment has not been confirmed yet. You can retry safely.');
        },
        error: () => {
          this.paymentError.set(
            'We could not confirm the payment yet. Refresh the payment status or try again.',
          );
          this.loadFunding(true);
        },
      });
  }
  fundingLabel(funding: CareRequestFunding): string {
    if (funding.fundingStatus === 'PAID') return 'Paid';
    if (funding.fundingStatus === 'SATISFIED_FREE') return 'Free';
    return 'Awaiting payment';
  }
  private refreshAfterPayment(): void {
    this.api.getFunding(this.reference).subscribe({ next: (value) => this.funding.set(value) });
    this.api.get(this.reference).subscribe({ next: (value) => this.request.set(value) });
  }
  private summaryFunding(request: CareRequest): CareRequestFunding {
    return {
      careRequestReference: request.reference,
      fundingRequired: request.funding?.status !== 'SATISFIED_FREE',
      amountMinor: request.service.price?.priceMinor ?? null,
      currency: request.service.price?.currency ?? null,
      fundingStatus: request.funding?.status ?? null,
      paid: request.funding?.satisfied ?? false,
      initializationAllowed: false,
      paymentAttemptStatus: null,
      paymentReference: null,
      checkoutUrl: null,
      accessCode: null,
      paidAt: null,
    };
  }
  private paymentFailureMessage(error: { status?: number; error?: { message?: unknown } }): string {
    const message = typeof error?.error?.message === 'string' ? error.error.message : '';
    if (error?.status === 409 && message) return message;
    if (error?.status === 400 && message === 'A valid payment email is required to continue')
      return message;
    if (error?.status === 400) return 'Check your payment details and try again.';
    return 'We could not start payment. Refresh the Care Request and try again.';
  }
  private checkFastTrack(r: CareRequest) {
    if (r.status !== 'PROVIDER_ACCEPTED' || !r.assignedProvider) return;
    this.find.getProvider(r.assignedProvider.providerReference).subscribe({
      next: (p) =>
        this.fastTrackEligible.set(
          !!p.services.find((s) => s.code === r.service.code && s.supportsFastTrack),
        ),
      error: () => this.fastTrackEligible.set(false),
    });
  }
  createFastTrack() {
    if (this.creating()) return;
    this.creating.set(true);
    this.actionError.set(null);
    this.fast
      .createForCareRequest(this.reference)
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (r) => void this.router.navigate(['/me/fasttrack', r.reference]),
        error: () =>
          this.actionError.set(
            'FastTrack is not currently available for this Care Request. Refresh the request or try again later.',
          ),
      });
  }
  canCancelRequest(status: string) {
    return [
      'SUBMITTED',
      'MATCHING',
      'PROVIDER_SELECTED',
      'AWAITING_PROVIDER_RESPONSE',
      'DECLINED',
      'UNFULFILLABLE',
    ].includes(status);
  }
  cancelRequest() {
    if (this.cancelling()) return;
    this.cancelling.set(true);
    this.actionError.set(null);
    this.api
      .cancel(this.reference)
      .pipe(finalize(() => this.cancelling.set(false)))
      .subscribe({
        next: () => {
          this.cancelOpen.set(false);
          this.load();
        },
        error: () => {
          this.cancelOpen.set(false);
          this.actionError.set(
            'This Care Request could not be cancelled. We refreshed its current status.',
          );
          this.load();
        },
      });
  }
  label(s: string) {
    return (
      (
        {
          MATCHING: 'Finding a provider',
          AWAITING_PROVIDER_RESPONSE: 'Waiting for provider',
          PROVIDER_ACCEPTED: 'Provider accepted',
        } as Record<string, string>
      )[s] ??
      s
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
  nextStep(s: string) {
    return (
      (
        {
          MATCHING: 'SmartClinic is looking for an eligible provider.',
          AWAITING_PROVIDER_RESPONSE: 'The selected provider is reviewing your request.',
          PROVIDER_ACCEPTED: 'Your provider has accepted this Care Request.',
          UNFULFILLABLE: 'SmartClinic operations needs to review provider availability.',
        } as Record<string, string>
      )[s] ?? 'Check this page for the latest backend-confirmed status.'
    );
  }
  appointmentLabel(s: string) {
    return s === 'IN_PROGRESS'
      ? 'In progress'
      : s === 'NO_SHOW'
        ? 'No-show'
        : s.charAt(0) + s.slice(1).toLowerCase();
  }
  deliveryModeLabel = careDeliveryModeLabel;
  formatPrice = formatMinor;
}
