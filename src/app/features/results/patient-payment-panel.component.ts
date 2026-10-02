import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import PaystackPop from '@paystack/inline-js';
import { EXTERNAL_NAVIGATOR } from '../../core/config/external-navigation.token';
import { HealthCheckRewardPreview } from '../../core/models/health-check-reward-redemption.model';
import {
  PublicBookingCheckoutOption,
  PublicBookingPaymentStatus,
} from '../../core/models/public-booking.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { safePaystackCheckoutUrl } from '../booking/paystack-checkout-url';
import { PaymentContactEmailComponent } from '../../shared/components/payment-contact-email.component';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-patient-payment-panel',
  imports: [ReactiveFormsModule, RouterLink, PaymentContactEmailComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <section
    class="rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm sm:p-8"
    aria-labelledby="patient-payment-heading"
  >
    <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">{{ 'booking.payment.eyebrow' | t }}</p>
    <h2 id="patient-payment-heading" class="font-display mt-2 text-2xl font-semibold text-ink">{{ 'booking.payment.title' | t }}</h2>
    <p class="mt-2 text-sm text-ink-soft">{{ 'booking.payment.intro' | t }}</p>
    @if (statusLoading()) {
      <p role="status" class="mt-4">{{ 'booking.payment.loadingStatus' | t }}</p>
    }
    @if (error()) {
      <div role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ error() }}</div>
    }
    @if (status(); as payment) {
      @if (payment.fundingStatus === 'SETTLED') {
        <div role="status" class="mt-4 rounded-xl bg-green-50 p-4 text-green-950">
          <strong>{{
            (payment.redemptionStatus === 'SETTLED' && isZero(payment.remainingExternalAmount)
              ? 'booking.payment.paidWithPoints'
              : 'booking.payment.confirmed') | t
          }}</strong>
          <p class="mt-1">
            {{
              payment.redemptionStatus === 'SETTLED' && isZero(payment.remainingExternalAmount)
                ? ('booking.payment.paidWithPointsBody' | t)
                : matchingCopy(payment.bookingStatus)
            }}
          </p>
          @if (payment.redemptionStatus === 'SETTLED' && isZero(payment.remainingExternalAmount)) {
            <p class="mt-1">{{ matchingCopy(payment.bookingStatus) }}</p>
          }
        </div>
        @if (payment.pointsReserved > 0) {
          <div class="mt-5 rounded-xl border p-4">
            <p class="flex justify-between gap-4">
              <span>{{ 'booking.payment.pointsUsed' | t }}</span><strong>{{ 'booking.payment.pointsCount' | t: { points: payment.pointsReserved } }}</strong>
            </p>
            <p class="mt-2 flex justify-between gap-4">
              <span>{{ 'booking.payment.rewardValue' | t }}</span
              ><strong>−{{ utils.formatMoney(payment.pointsAmount, payment.currency) }}</strong>
            </p>
          </div>
        }
      } @else if (!statusLoading()) {
        <section
          class="mt-5 rounded-xl border border-brand-100 bg-brand-50/40 p-5"
          aria-labelledby="patient-rewards-heading"
        >
          <h3 id="patient-rewards-heading" class="font-bold text-ink">{{ 'booking.payment.rewardsTitle' | t }}</h3>
          @if (rewardsLoading()) {
            <p role="status" class="mt-3">{{ 'booking.payment.loadingRewards' | t }}</p>
          } @else if (rewardsError()) {
            <div role="alert" class="mt-3">
              <p>{{ 'booking.payment.rewardsError' | t }}</p>
              <button
                type="button"
                (click)="loadRewards()"
                class="mt-2 font-bold text-brand-700 underline"
              >
                {{ 'booking.payment.rewardsRetry' | t }}
              </button>
            </div>
          } @else if (preview(); as rewards) {
            @if (activePoints() > 0 && redemptionStatus() === 'RESERVED') {
              <div>
                <p class="mt-3 text-lg font-bold">{{ (activeSource() === 'WELLNESS' ? 'booking.payment.reservedWellness' : 'booking.payment.reserved') | t: { points: activePoints() } }}</p>
                <p class="mt-1 text-sm text-ink-soft">
                  {{ 'booking.payment.reservedBody' | t }}
                </p>
                <button
                  type="button"
                  (click)="releasePoints()"
                  [disabled]="busy()"
                  class="mt-3 font-bold text-red-700 underline disabled:opacity-50"
                >
                  {{ (releasing() ? 'booking.payment.removing' : 'booking.payment.remove') | t }}
                </button>
              </div>
            } @else {
              @if (rewards.wellness; as w) {
                <div class="mt-3 rounded-xl bg-leaf-50 p-4 ring-1 ring-leaf-100" data-wellness-points>
                  <p class="font-semibold text-ink"><span aria-hidden="true">🌿</span> {{ 'booking.payment.wellnessBalance' | t: { points: w.availablePoints } }}</p>
                  @if (w.maximumRedeemablePoints > 0) {
                    <p class="mt-1 text-sm text-ink-soft">
                      {{ 'booking.payment.wellnessUseBefore' | t: { points: w.maximumRedeemablePoints } }}
                      <strong class="text-ink">{{ utils.formatMoney(wellnessValue(w.maximumRedeemablePoints, w.valuePerPoint), rewards.currency) }}</strong>
                      {{ 'booking.payment.wellnessUseAfter' | t: { percent: w.maxPercent } }}
                    </p>
                    <button type="button" (click)="useWellnessPoints()" [disabled]="busy()"
                      class="mt-3 min-h-11 rounded-full bg-leaf-700 px-5 font-bold text-white disabled:opacity-50" data-use-wellness>
                      {{ applying() ? ('booking.payment.applying' | t) : ('booking.payment.useWellness' | t: { points: w.maximumRedeemablePoints }) }}
                    </button>
                  } @else {
                    <p class="mt-1 text-sm text-ink-soft">
                      {{ 'booking.payment.earnMore' | t: { points: w.minimumPoints - w.availablePoints > 0 ? w.minimumPoints - w.availablePoints : 0 } }}
                      <a routerLink="/me/progress" class="font-semibold text-brand-700 underline">{{ 'booking.payment.howToEarn' | t }}</a>
                    </p>
                  }
                  <p class="mt-2 text-xs text-ink-muted">{{ 'booking.payment.wellnessNote' | t }}</p>
                </div>
              }
              @if (rewards.availablePoints === 0) {
                @if (!rewards.wellness) {
                  <p class="mt-3 text-ink-soft">{{ 'booking.payment.noPoints' | t }}</p>
                }
              } @else {
              <p class="mt-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">{{ 'booking.payment.referralTitle' | t }}</p>
              <p class="mt-1">
                <strong>{{ rewards.availablePoints }}</strong> {{ 'booking.payment.referralAvailable' | t }}
              </p>
              <p class="mt-1 text-sm text-ink-soft">
                {{ 'booking.payment.maxForCheck' | t: { points: rewards.maximumRedeemablePoints } }}
              </p>
              <form
                [formGroup]="pointsForm"
                (ngSubmit)="applyPoints()"
                class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <label class="flex-1 font-semibold"
                  >{{ 'booking.payment.pointsToUse' | t }}<input
                    type="number"
                    min="1"
                    step="1"
                    formControlName="points"
                    class="mt-1 w-full rounded-lg border bg-white p-3"
                    [placeholder]="'booking.payment.pointsPlaceholder' | t" /></label
                ><button
                  type="button"
                  (click)="useMaximum()"
                  [disabled]="busy()"
                  class="min-h-11 rounded-lg border border-brand-700 px-4 font-bold text-brand-700"
                >
                  {{ 'booking.payment.useMaximum' | t }}</button
                ><button
                  type="submit"
                  [disabled]="pointsForm.invalid || busy()"
                  class="min-h-11 rounded-lg bg-brand-700 px-4 font-bold text-white disabled:opacity-50"
                >
                  {{ (applying() ? 'booking.payment.applying' : 'booking.payment.apply') | t }}
                </button>
              </form>
              }
            }
            @if (pointsError()) {
              <p role="alert" class="mt-3 text-sm font-semibold text-red-800">
                {{ pointsError() }}
              </p>
            }
          }
        </section>

        <section class="mt-5 rounded-xl border p-5" aria-labelledby="payment-summary-heading">
          <h3 id="payment-summary-heading" class="font-bold">{{ 'booking.payment.summaryTitle' | t }}</h3>
          <dl class="mt-3 grid gap-2">
            @if (bookingTotal(); as total) {
              <div class="flex justify-between gap-4">
                <dt>{{ 'booking.payment.total' | t }}</dt>
                <dd class="font-bold">{{ utils.formatMoney(total, paymentCurrency()) }}</dd>
              </div>
            }
            @if (activePoints() > 0) {
              <div class="flex justify-between gap-4">
                <dt>{{ 'booking.payment.rewardPoints' | t }}</dt>
                <dd>{{ 'booking.payment.pointsCount' | t: { points: activePoints() } }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt>{{ 'booking.payment.rewardValue' | t }}</dt>
                <dd>−{{ utils.formatMoney(pointsAmount(), paymentCurrency()) }}</dd>
              </div>
            }
            <div class="flex justify-between gap-4 border-t pt-2">
              <dt class="font-bold">{{ 'booking.payment.remaining' | t }}</dt>
              <dd class="font-bold">
                {{ utils.formatMoney(remainingAmount(), paymentCurrency()) }}
              </dd>
            </div>
          </dl>
        </section>

        <fieldset [disabled]="busy()" class="mt-5">
          <legend class="text-xl font-bold text-ink">{{ 'booking.payment.howPay' | t }}</legend>
          <div class="mt-3 grid gap-3 md:grid-cols-3">
            @for (option of options; track option.value) {
              <label
                class="cursor-pointer rounded-xl border p-4 focus-within:ring-4 focus-within:ring-brand-200"
                [class.border-brand-700]="selected() === option.value"
                [class.bg-brand-50]="selected() === option.value"
                ><input
                  type="radio"
                  name="patient-payment-option"
                  [value]="option.value"
                  [checked]="selected() === option.value"
                  (change)="select(option.value)"
                /><strong class="ml-2">{{ option.labelKey | t }}</strong
                ><span class="mt-2 block text-sm text-ink-soft">{{
                  option.descriptionKey | t
                }}</span></label
              >
            }
          </div>
        </fieldset>
        <p class="mt-4 text-sm text-ink-soft">
          {{ 'booking.payment.requestNote' | t }}
        </p>
        @if (selected() !== 'PAY_LATER') {
          <app-payment-contact-email />
        }
        <button
          type="button"
          (click)="initiate()"
          [disabled]="busy() || isZero(remainingAmount())"
          class="mt-5 min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-60"
        >
          {{ pending() ? pendingLabel() : actionLabel() }}
        </button>
        @if (payLater()) {
          <div role="status" class="mt-5 rounded-xl bg-amber-50 p-4 text-amber-950">
            <strong>{{ 'booking.payment.payLaterTitle' | t }}</strong>
            @if (activePoints() > 0) {
              <p class="mt-1">{{ 'booking.payment.payLaterPoints' | t: { points: activePoints() } }}</p>
            }
            <p class="mt-1">
              {{ 'booking.payment.payLaterBody' | t }}
            </p>
          </div>
        }
        @if (checkoutUrl()) {
          <div class="mt-5 rounded-xl bg-brand-50 p-4">
            <h3 class="font-bold">{{ 'booking.payment.linkReady' | t }}</h3>
            <p class="mt-1 text-sm">
              {{ 'booking.payment.linkNote' | t }}
            </p>
            <input
              [attr.aria-label]="'booking.payment.linkLabel' | t"
              readonly
              [value]="checkoutUrl()"
              class="mt-3 w-full rounded-lg border bg-white p-3 text-sm"
            />
            <div class="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                (click)="openPaymentPage()"
                class="min-h-11 rounded-lg bg-brand-700 px-4 font-bold text-white"
              >
                {{ 'booking.payment.openPage' | t }}</button
              ><button
                type="button"
                (click)="copyLink()"
                class="min-h-11 rounded-lg border border-brand-700 px-4 font-bold text-brand-700"
              >
                {{ 'booking.payment.copyLink' | t }}
              </button>
            </div>
            <p aria-live="polite" class="mt-2 text-sm">{{ copyFeedback() }}</p>
          </div>
        }
        <button
          type="button"
          (click)="refreshAll()"
          [disabled]="refreshing()"
          class="mt-4 block font-bold text-brand-700 underline"
        >
          {{ (refreshing() ? 'booking.payment.checking' : 'booking.payment.check') | t }}
        </button>
      }
    }
  </section>`,
})
export class PatientPaymentPanelComponent implements OnInit {
  @ViewChild(PaymentContactEmailComponent) private paymentContact?: PaymentContactEmailComponent;
  @Input({ required: true }) reference = '';
  private lastReloadVerify: unknown;
  @Input() set reloadVerify(value: unknown) {
    if (value == null || value === false || !this.reference || Object.is(value, this.lastReloadVerify)) return;
    this.lastReloadVerify = value;
    this.verify();
  }
  @Output() readonly statusChanged = new EventEmitter<PublicBookingPaymentStatus>();
  private readonly api = inject(HealthCheckResultsApiService);
  private readonly navigateExternal = inject(EXTERNAL_NAVIGATOR);
  private readonly fb = inject(FormBuilder);
  readonly utils = inject(UtilsService);
  private readonly i18n = inject(TranslationService);
  popup = new PaystackPop();
  readonly selected = signal<PublicBookingCheckoutOption>('PAY_NOW');
  readonly status = signal<PublicBookingPaymentStatus | null>(null);
  readonly preview = signal<HealthCheckRewardPreview | null>(null);
  readonly statusLoading = signal(true);
  readonly rewardsLoading = signal(true);
  readonly rewardsError = signal(false);
  readonly refreshing = signal(false);
  readonly pending = signal(false);
  readonly applying = signal(false);
  readonly releasing = signal(false);
  readonly error = signal<string | null>(null);
  readonly pointsError = signal<string | null>(null);
  readonly checkoutUrl = signal<string | null>(null);
  readonly payLater = signal(false);
  readonly copyFeedback = signal('');
  readonly pointsForm = this.fb.nonNullable.group({
    points: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
  });
  readonly busy = computed(() => this.pending() || this.applying() || this.releasing());
  readonly options = [
    {
      value: 'PAY_NOW' as const,
      label: 'Pay now',
      description: 'Pay securely with Paystack.',
      labelKey: 'booking.payment.option.payNow',
      descriptionKey: 'booking.payment.option.payNowHint',
    },
    {
      value: 'PAYMENT_LINK' as const,
      label: 'Payment link',
      description: 'Open or share a secure hosted checkout link.',
      labelKey: 'booking.payment.option.paymentLink',
      descriptionKey: 'booking.payment.option.paymentLinkHint',
    },
    {
      value: 'PAY_LATER' as const,
      label: 'Pay later',
      description: 'Keep this booking awaiting payment and return later.',
      labelKey: 'booking.payment.option.payLater',
      descriptionKey: 'booking.payment.option.payLaterHint',
    },
  ];
  ngOnInit() {
    this.refresh();
    this.loadRewards();
  }
  select(option: PublicBookingCheckoutOption) {
    if (!this.busy()) {
      this.selected.set(option);
      this.error.set(null);
    }
  }
  activePoints() {
    return this.status()?.pointsReserved ?? this.preview()?.activeRedemption?.pointsReserved ?? 0;
  }
  activeSource() {
    return this.preview()?.activeRedemption?.pointSource ?? 'REFERRAL';
  }
  /** points × value per point, as a money string ("2000.00"). */
  wellnessValue(points: number, valuePerPoint: string) {
    const perMinor = Math.round(Number(valuePerPoint) * 100);
    return ((points * perMinor) / 100).toFixed(2);
  }
  useWellnessPoints() {
    const w = this.preview()?.wellness;
    if (!w || !w.maximumRedeemablePoints || this.busy()) return;
    this.applying.set(true);
    this.pointsError.set(null);
    this.api.applyMyHealthCheckRewards(this.reference, w.maximumRedeemablePoints, 'WELLNESS').subscribe({
      next: () => {
        this.applying.set(false);
        this.refreshAll();
      },
      error: (e: HttpErrorResponse) => {
        this.applying.set(false);
        this.pointsError.set(this.rewardMutationError(e));
      },
    });
  }
  redemptionStatus() {
    return this.status()?.redemptionStatus ?? this.preview()?.activeRedemption?.status ?? null;
  }
  bookingTotal() {
    return this.status()?.bookingTotal ?? this.preview()?.bookingOutstandingAmount ?? null;
  }
  pointsAmount() {
    return this.status()?.pointsAmount ?? this.preview()?.activeRedemption?.pointsAmount ?? '0.00';
  }
  remainingAmount() {
    return (
      this.status()?.remainingExternalAmount ??
      this.preview()?.activeRedemption?.remainingExternalAmount ??
      this.preview()?.bookingOutstandingAmount ??
      null
    );
  }
  paymentCurrency() {
    return this.status()?.currency ?? this.preview()?.currency ?? null;
  }
  isZero(amount: string | null | undefined) {
    return amount != null && /^0+(?:\.0+)?$/.test(amount);
  }
  actionLabel() {
    if (this.selected() === 'PAY_NOW') {
      const remaining = this.remainingAmount();
      return this.activePoints() > 0 && remaining
        ? this.i18n.t('booking.payment.action.payAmount', { amount: this.utils.formatMoney(remaining, this.paymentCurrency()) })
        : this.i18n.t('booking.payment.action.paySecurely');
    }
    return this.i18n.t(this.selected() === 'PAYMENT_LINK' ? 'booking.payment.action.getLink' : 'booking.payment.action.payLater');
  }
  pendingLabel() {
    return this.i18n.t(
      this.selected() === 'PAY_NOW'
        ? 'booking.payment.action.preparing'
        : this.selected() === 'PAYMENT_LINK'
          ? 'booking.payment.action.creatingLink'
          : 'booking.payment.action.saving',
    );
  }
  useMaximum() {
    const max = this.preview()?.maximumRedeemablePoints;
    if (max) this.pointsForm.controls.points.setValue(max);
  }
  applyPoints() {
    const rewards = this.preview();
    const points = this.pointsForm.controls.points.value;
    if (!rewards || this.pointsForm.invalid || this.busy()) return;
    if (points > rewards.maximumRedeemablePoints || points > rewards.availablePoints) {
      this.pointsError.set(
        this.i18n.t('booking.payment.errors.enterNoMore', { points: Math.min(rewards.maximumRedeemablePoints, rewards.availablePoints) }),
      );
      return;
    }
    this.applying.set(true);
    this.pointsError.set(null);
    this.api.applyMyHealthCheckRewards(this.reference, points).subscribe({
      next: (result) => {
        this.applying.set(false);
        if (!result.requiresExternalPayment || this.isZero(result.remainingExternalAmount)) {
          this.error.set(null);
        }
        this.refreshAll();
      },
      error: (e: HttpErrorResponse) => {
        this.applying.set(false);
        this.pointsError.set(this.rewardMutationError(e));
      },
    });
  }
  releasePoints() {
    if (this.busy() || this.redemptionStatus() !== 'RESERVED') return;
    this.releasing.set(true);
    this.pointsError.set(null);
    this.api.releaseMyHealthCheckRewards(this.reference).subscribe({
      next: () => {
        this.releasing.set(false);
        this.refreshAll();
      },
      error: (e: HttpErrorResponse) => {
        this.releasing.set(false);
        this.pointsError.set(
          e.status === 409
            ? this.i18n.t('booking.payment.errors.pointsLocked')
            : this.i18n.t('booking.payment.errors.removeFailed'),
        );
      },
    });
  }
  loadRewards() {
    if (!this.reference) return;
    this.rewardsLoading.set(true);
    this.rewardsError.set(false);
    this.api.previewMyHealthCheckRewards(this.reference).subscribe({
      next: (value) => {
        this.preview.set(value);
        this.rewardsLoading.set(false);
      },
      error: () => {
        this.rewardsLoading.set(false);
        this.rewardsError.set(true);
      },
    });
  }
  initiate() {
    if (
      !this.reference ||
      this.busy() ||
      this.status()?.fundingStatus === 'SETTLED' ||
      this.isZero(this.remainingAmount())
    )
      return;
    this.pending.set(true);
    this.error.set(null);
    this.checkoutUrl.set(null);
    this.payLater.set(false);
    const option = this.selected();
    if (this.redemptionStatus() === 'RESERVED') {
      this.api.getMyHealthCheckPayment(this.reference).subscribe({
        next: (latest) => {
          this.applyStatus(latest);
          if (latest.fundingStatus === 'SETTLED' || this.isZero(latest.remainingExternalAmount)) {
            this.pending.set(false);
            return;
          }
          this.startPayment(option);
        },
        error: () => {
          this.pending.set(false);
          this.fail(this.i18n.t('booking.payment.errors.refreshFailed'));
        },
      });
    } else this.startPayment(option);
  }
  private startPayment(option: PublicBookingCheckoutOption) {
    const paymentEmail = option === 'PAY_LATER' ? {} : this.paymentContact?.request();
    if (paymentEmail === null) {
      this.pending.set(false);
      return;
    }
    const initialization = paymentEmail
      ? this.api.initiateMyHealthCheckPayment(this.reference, option, paymentEmail)
      : this.api.initiateMyHealthCheckPayment(this.reference, option);
    initialization.subscribe({
      next: (result) => {
        this.pending.set(false);
        if (result.provider === 'OPAY' && result.checkoutUrl) {
          window.location.assign(result.checkoutUrl);
          return;
        }
        if (result.bookingReference !== this.reference || result.checkoutOption !== option)
          return this.fail(this.i18n.t('booking.payment.errors.startFailed'));
        if (option === 'PAY_LATER') {
          this.payLater.set(true);
          this.refreshAll();
          return;
        }
        if (option === 'PAYMENT_LINK') {
          const url = safePaystackCheckoutUrl(result.checkoutUrl);
          if (!url) return this.fail(this.i18n.t('booking.payment.errors.linkFailed'));
          this.checkoutUrl.set(url);
          this.refreshAll();
          return;
        }
        if (!result.accessCode) return this.fail(this.i18n.t('booking.payment.errors.startFailed'));
        this.popup.resumeTransaction(result.accessCode, {
          onSuccess: () => this.verify(),
          onError: () =>
            this.fail(this.i18n.t('booking.payment.errors.notCompleted')),
        });
      },
      error: (error: HttpErrorResponse) => {
        this.pending.set(false);
        this.fail(
          error.status === 400 &&
            error.error?.message === 'A valid payment email is required to continue'
            ? this.i18n.t('booking.payment.errors.emailRequired')
            : this.i18n.t('booking.payment.errors.startFailed'),
        );
      },
    });
  }
  verify() {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    this.error.set(null);
    this.api.verifyMyHealthCheckPayment(this.reference).subscribe({
      next: (s) => {
        this.applyStatus(s);
        this.refreshing.set(false);
        this.loadRewards();
      },
      error: () => {
        this.refreshing.set(false);
        this.fail(this.i18n.t('booking.payment.errors.verifyFailed'));
      },
    });
  }
  refresh() {
    if (!this.reference || this.refreshing()) return;
    this.refreshing.set(true);
    this.error.set(null);
    this.api.getMyHealthCheckPayment(this.reference).subscribe({
      next: (s) => {
        this.applyStatus(s);
        this.statusLoading.set(false);
        this.refreshing.set(false);
      },
      error: () => {
        this.statusLoading.set(false);
        this.refreshing.set(false);
        this.fail(this.i18n.t('booking.payment.errors.loadFailed'));
      },
    });
  }
  refreshAll() {
    this.refresh();
    this.loadRewards();
  }
  private applyStatus(s: PublicBookingPaymentStatus) {
    this.status.set(s);
    if (s.fundingStatus === 'SETTLED') this.statusChanged.emit(s);
  }
  private fail(message: string) {
    this.error.set(message);
  }
  private rewardMutationError(e: HttpErrorResponse) {
    if (e.status === 409)
      return this.i18n.t('booking.payment.errors.applyConflict');
    if (e.status === 404) return this.i18n.t('booking.payment.errors.applyGone');
    return this.i18n.t('booking.payment.errors.applyFailed');
  }
  openPaymentPage() {
    const url = safePaystackCheckoutUrl(this.checkoutUrl());
    if (url) this.navigateExternal(url);
  }
  async copyLink() {
    const url = this.checkoutUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.copyFeedback.set(this.i18n.t('booking.payment.copied'));
    } catch {
      this.copyFeedback.set(this.i18n.t('booking.payment.copyFailed'));
    }
  }
  matchingCopy(status: string) {
    return this.i18n.t(status === 'SCHEDULED' ? 'booking.payment.scheduled' : 'booking.payment.received');
  }
}
