import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import PaystackPop from '@paystack/inline-js';
import { PaymentContactEmailComponent } from '../../shared/components/payment-contact-email.component';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HospitalCompanionView, HospitalWalletSettlementResponse, PatientProviderConnection } from '../../core/models/patient-provider-connection.model';
import { PatientWalletView } from '../../core/models/patient-wallet.model';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { PatientWalletApiService } from '../../core/services/patient-wallet-api.service';
import { formatMinor, minorToMajor } from '../provider/care-money';

interface BillGroup {
  readonly connection: PatientProviderConnection;
  readonly companion: HospitalCompanionView;
}

@Component({
  selector: 'app-patient-pay-bills-page',
  imports: [RouterLink, PaymentContactEmailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <a routerLink="/me/dashboard" class="font-bold text-brand-700">← Home</a>
      <header class="mt-5">
        <p class="text-sm font-bold uppercase tracking-wider text-brand-700">Payments</p>
        <h1 class="font-display mt-1 text-3xl font-semibold text-ink">Pay hospital bills</h1>
        <p class="mt-2 max-w-2xl text-ink-soft">
          SmartClinic brings the unpaid requests from each connected hospital together so you can review them and pay once.
        </p>
      </header>

      @if (loading()) {
        <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading your bills…</p>
      } @else if (error()) {
        <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-5 text-red-900">
          {{ error() }}
          <button type="button" (click)="load()" class="ml-2 font-bold underline">Try again</button>
        </div>
      } @else {
        @if (wallet(); as w) {
          <section class="mt-6 rounded-3xl sc-hero p-6 text-white">
            <p class="text-xs font-bold uppercase tracking-wider text-violet-200">SmartClinic Wallet</p>
            <p class="mt-2 text-3xl font-black">{{ balance(w.balanceMinor, w.currency) }}</p>
            <p class="mt-1 text-sm text-violet-100">Available balance</p>
            <p class="mt-4 max-w-xl text-sm leading-6 text-violet-100">Payment options will appear only after you choose a bill that is ready to pay.</p>
          </section>
        }

        @if (unavailableHospitalCount() > 0) {
          <div role="alert" class="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-950">
            {{ unavailableHospitalCount() }} connected hospital{{ unavailableHospitalCount() === 1 ? '' : 's' }} could not be checked right now. The bills shown below are only from hospitals that responded successfully.
            <button type="button" (click)="load()" class="ml-2 font-bold underline">Retry</button>
          </div>
        }

        @if (!groups().length) {
          <section class="mt-6 rounded-3xl border bg-white p-7 text-center">
            <h2 class="font-display text-xl font-semibold text-ink">No hospital bills waiting</h2>
            <p class="mt-2 text-ink-soft">When a connected hospital creates payable requests, they will appear here automatically.</p>
            <a routerLink="/me/providers" class="mt-4 inline-flex rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">My hospitals</a>
          </section>
        } @else {
          <div class="mt-6 grid gap-5">
            @for (group of groups(); track group.connection.reference) {
              <section class="overflow-hidden rounded-3xl border border-ink/[0.08] bg-white shadow-sm">
                <div class="h-2 bg-gradient-to-r from-brand-700 via-violet-500 to-emerald-500" aria-hidden="true"></div>
                <div class="p-5 sm:p-6">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="flex min-w-0 gap-3">
                    <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-100 font-black text-brand-800" aria-hidden="true">{{ providerInitials(group.connection.provider.displayName) }}</span>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2"><p class="text-xs font-bold uppercase tracking-wider text-brand-700">Connected hospital</p><span class="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">Connected ✓</span></div>
                      <h2 class="font-display mt-1 text-xl font-semibold text-ink">{{ group.connection.provider.displayName }}</h2>
                      <p class="mt-1 text-sm text-ink-soft">{{ providerTypeLabel(group.connection.provider.providerType) }}@if (group.connection.externalPatientReference) { · Hospital ID {{ group.connection.externalPatientReference }}}</p>
                    </div>
                  </div>
                  @if (group.companion.consolidatedPayment.itemCount > 0 && group.companion.consolidatedPayment.amountMinor !== null && group.companion.consolidatedPayment.currency) {
                    <div class="text-right">
                      <p class="text-sm text-ink-muted">{{ group.companion.consolidatedPayment.itemCount }} unpaid item{{ group.companion.consolidatedPayment.itemCount === 1 ? '' : 's' }}</p>
                      <p class="text-2xl font-black text-ink">{{ money(group.companion.consolidatedPayment.amountMinor, group.companion.consolidatedPayment.currency) }}</p>
                    </div>
                  }
                </div>

                @if (group.companion.requests.length) {
                  <div class="mt-5 divide-y rounded-2xl border border-ink/[0.08]">
                    @for (item of group.companion.requests; track item.orderReference) {
                      <div class="flex items-center justify-between gap-4 p-4">
                        <div>
                          <p class="font-bold text-ink">{{ requestLabel(item.type) }}</p>
                          <p class="text-sm text-ink-muted">{{ item.serviceUnit || 'Hospital service' }}</p>
                        </div>
                        <div class="text-right">
                          @if (item.amountMinor !== null && item.currency) {
                            <p class="font-bold">{{ money(item.amountMinor, item.currency) }}</p>
                          }
                          <p class="text-xs font-semibold" [class.text-emerald-700]="item.paymentStatus === 'PAID'" [class.text-amber-700]="item.paymentStatus !== 'PAID'">
                            {{ paymentStatusLabel(item.paymentStatus) }}
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                }

                @if (group.companion.consolidatedPayment.itemCount > 0 && group.companion.consolidatedPayment.amountMinor !== null && group.companion.consolidatedPayment.currency) {
                  <div class="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      (click)="payWallet(group)"
                      [disabled]="settlingReference() === group.connection.reference || !canWalletPay(group)"
                      class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {{ settlingReference() === group.connection.reference ? 'Confirming payment…' : 'Pay all from Wallet' }}
                    </button>
                    @if (!canWalletPay(group)) {
                      <button type="button" (click)="togglePaymentOptions(group.connection.reference)" [disabled]="payingReference() === group.connection.reference" class="rounded-xl bg-brand-950 px-5 py-3 font-bold text-white disabled:opacity-50">{{ choosingPaymentReference() === group.connection.reference ? 'Close payment options' : 'Choose payment method' }}</button>
                      <p class="w-full text-sm text-ink-soft">Review the payment provider only when you are ready. SmartClinic will fund the exact wallet shortfall and settle this hospital once.</p>
                      @if (choosingPaymentReference() === group.connection.reference) {
                        <section class="w-full rounded-2xl border border-brand-100 bg-violet-50/50 p-4" aria-label="Payment options">
                          <app-payment-contact-email />
                          <button type="button" (click)="paySecurely(group)" [disabled]="payingReference() === group.connection.reference" class="mt-4 min-h-12 w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50">{{ payingReference() === group.connection.reference ? 'Preparing secure payment…' : 'Continue to secure payment' }}</button>
                        </section>
                      }
                    }
                    <a [routerLink]="['/me/providers', group.connection.reference]" class="font-bold text-brand-700 underline">Open hospital</a>
                  </div>
                } @else if (hasPendingPricing(group)) {
                  <div class="mt-5 rounded-2xl bg-amber-50 p-4 text-amber-950">
                    <p class="font-bold">Price pending</p>
                    <p class="mt-1 text-sm leading-6">The hospital or pharmacy is preparing your quote. We’ll show the amount and payment options when it is ready.</p>
                  </div>
                } @else {
                  <p class="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">Nothing to pay at this hospital ✓</p>
                }

                @if (group.companion.servicePass; as persistedPass) {
                  @if (!passes()[group.connection.reference]) {
                  <div class="mt-5 rounded-2xl bg-emerald-50 p-5 text-emerald-950">
                    <p class="text-xs font-bold uppercase tracking-wider text-emerald-700">Latest payment receipt</p>
                    <p class="mt-1 text-lg font-black">SmartClinic Service Pass {{ persistedPass.reference }}</p>
                    <p class="mt-1 text-sm">{{ money(persistedPass.amountMinor, persistedPass.currency) }} paid {{ persistedPass.paidAt ? 'and confirmed' : '' }}.</p>
                  </div>
                  }
                }

                @if (passes()[group.connection.reference]; as pass) {
                  <div class="mt-5 rounded-2xl bg-emerald-50 p-5 text-emerald-950">
                    <p class="text-xs font-bold uppercase tracking-wider text-emerald-700">Payment confirmed</p>
                    <p class="mt-1 text-lg font-black">SmartClinic Service Pass {{ pass.servicePass.reference }}</p>
                    <p class="mt-1 text-sm">The hospital can verify that the covered bills are paid.</p>
                  </div>
                }
                </div>
              </section>
            }
          </div>
        }
      }
    </main>
  `,
})
export class PatientPayBillsPageComponent {
  @ViewChild(PaymentContactEmailComponent) private paymentContact?: PaymentContactEmailComponent;
  private readonly connectionsApi = inject(PatientProviderConnectionsApiService);
  private readonly walletApi = inject(PatientWalletApiService);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly wallet = signal<PatientWalletView | null>(null);
  readonly groups = signal<readonly BillGroup[]>([]);
  readonly settlingReference = signal<string | null>(null);
  readonly payingReference = signal<string | null>(null);
  readonly choosingPaymentReference = signal<string | null>(null);
  readonly passes = signal<Record<string, HospitalWalletSettlementResponse>>({});
  readonly unavailableHospitalCount = signal(0);

  popup = new PaystackPop();

  constructor() {
    const walletPayment = this.route.snapshot.queryParamMap.get('walletPayment');
    if (walletPayment) this.verifyReturnedPayment(walletPayment);
    else this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.unavailableHospitalCount.set(0);
    forkJoin({
      wallet: this.walletApi.mine().pipe(catchError(() => of(null))),
      connections: this.connectionsApi.listMine(1, 100),
    }).pipe(
      switchMap(({ wallet, connections }) => {
        this.wallet.set(wallet);
        const connected = connections.items.filter(item => item.status === 'CONNECTED');
        if (!connected.length) return of([] as BillGroup[]);
        return forkJoin(
          connected.map(connection =>
            this.connectionsApi.companion(connection.reference).pipe(
              map(companion => ({ connection, companion })),
              catchError(() => of(null)),
            ),
          ),
        ).pipe(map(items => { const available = items.filter((item): item is BillGroup => item !== null); this.unavailableHospitalCount.set(items.length - available.length); return available; }));
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: groups => this.groups.set(groups),
      error: () => this.error.set('Your hospital bills could not be loaded right now.'),
    });
  }

  canWalletPay(group: BillGroup): boolean {
    const wallet = this.wallet();
    const total = group.companion.consolidatedPayment.amountMinor;
    const currency = group.companion.consolidatedPayment.currency;
    return !!wallet && total !== null && !!currency && wallet.currency === currency && wallet.balanceMinor >= total;
  }

  togglePaymentOptions(connectionReference: string): void {
    this.choosingPaymentReference.update(current => current === connectionReference ? null : connectionReference);
  }

  hasPendingPricing(group: BillGroup): boolean {
    return group.companion.requests.some(item => item.paymentStatus === 'NOT_PRICED');
  }

  paySecurely(group: BillGroup): void {
    const total = group.companion.consolidatedPayment.amountMinor;
    const currency = group.companion.consolidatedPayment.currency;
    if (total === null || currency !== 'NGN' || this.payingReference()) return;
    const balance = this.wallet()?.currency === currency ? this.wallet()!.balanceMinor : 0;
    const shortfall = Math.max(0, total - balance);
    if (!shortfall) { this.payWallet(group); return; }
    const paymentRequest = this.paymentContact?.request();
    if (paymentRequest === null) return;
    this.payingReference.set(group.connection.reference);
    this.error.set('');
    this.walletApi.initializeTopUp(shortfall, group.connection.reference, paymentRequest)
      .pipe(finalize(() => this.payingReference.set(null)))
      .subscribe({
        next: payment => {
          if (payment.provider === 'OPAY' && payment.checkoutUrl) { window.location.assign(payment.checkoutUrl); return; }
          if (!payment.accessCode) { this.error.set('Unable to start secure payment.'); return; }
          this.popup.resumeTransaction(payment.accessCode, {
            onSuccess: () => this.verifyAndSettle(payment.reference, group.connection.reference),
            onError: () => this.error.set('Payment was not completed. You can safely retry.'),
          });
        },
        error: error => this.error.set(error?.error?.message || 'Unable to start secure payment.'),
      });
  }

  private verifyReturnedPayment(reference: string): void {
    this.loading.set(true);
    this.walletApi.verifyTopUp(reference).subscribe({
      next: payment => {
        if (payment.paid && payment.connectionReference) this.verifyAndSettle(reference, payment.connectionReference);
        else { this.error.set('Payment could not be confirmed yet. You can safely retry.'); this.load(); }
      },
      error: () => { this.error.set('Payment could not be confirmed yet. You can safely retry.'); this.load(); },
    });
  }

  private verifyAndSettle(reference: string, connectionReference: string): void {
    this.walletApi.verifyTopUp(reference).pipe(
      switchMap(payment => {
        if (!payment.paid) throw new Error('Payment is not confirmed');
        return this.connectionsApi.settleWallet(connectionReference);
      }),
    ).subscribe({
      next: result => { this.passes.update(current => ({ ...current, [connectionReference]: result })); this.load(); },
      error: error => { this.error.set(error?.error?.message || 'Payment was received, but the hospital settlement still needs confirmation. Your wallet balance is safe.'); this.load(); },
    });
  }

  payWallet(group: BillGroup): void {
    if (!this.canWalletPay(group) || this.settlingReference()) return;
    this.settlingReference.set(group.connection.reference);
    this.error.set('');
    this.connectionsApi.settleWallet(group.connection.reference)
      .pipe(finalize(() => this.settlingReference.set(null)))
      .subscribe({
        next: result => {
          this.passes.update(current => ({ ...current, [group.connection.reference]: result }));
          this.load();
        },
        error: error => this.error.set(error?.error?.message || 'The hospital bills could not be paid from your wallet.'),
      });
  }

  requestLabel(type: string): string {
    return type === 'LABORATORY' ? 'Laboratory' : type === 'IMAGING' ? 'Imaging' : type === 'PRESCRIPTION' ? 'Medicine' : type === 'PROCEDURE' ? 'Procedure' : 'Referral';
  }
  paymentStatusLabel(status: string): string {
    return status === 'PAID' ? 'Paid ✓' : status === 'NOT_PRICED' ? 'Price pending' : status === 'CANCELLED' ? 'Cancelled' : status === 'REQUIRES_REFUND_REVIEW' ? 'Refund review' : 'Payment needed';
  }
  providerInitials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'H'; }
  providerTypeLabel(type: string): string { return type === 'HOSPITAL' ? 'Hospital' : type.split('_').map(value => value[0] + value.slice(1).toLowerCase()).join(' '); }
  money(value: number, currency: string): string { return formatMinor(value, currency); }
  /** A wallet balance is never "Free": show ₦0.00 rather than the price formatter's zero label. */
  balance(value: number, currency: string): string {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minorToMajor(value, currency)));
  }
}
