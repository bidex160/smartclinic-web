import { isAwaitingProviderApproval, ProviderApprovalNoticeComponent } from '../../../shared/components/provider-approval-notice/provider-approval-notice';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ProviderOrderFulfillment } from '../../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../../core/services/pharmacy-fulfillment-api.service';

/** Requests this lab or pharmacy passed on, and where each one is now. */
@Component({
  selector: 'app-provider-referred-out-page',
  imports: [ProviderApprovalNoticeComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <a routerLink="/provider/dashboard" class="text-sm font-semibold text-brand-700">← Dashboard</a>
      <h1 class="font-display mt-3 text-3xl font-semibold text-ink sm:text-4xl">Referred out</h1>
      <p class="mt-1 text-ink-soft">Requests you passed to another lab or pharmacy on SmartClinic. Results appear here once they’ve accepted.</p>
      <p class="mt-3 rounded-2xl bg-leaf-50 p-4 text-sm text-leaf-700 ring-1 ring-leaf-100" data-fee-explainer>You earn a referral fee on each job you refer, paid from the receiving facility’s share once the patient pays. The patient’s price doesn’t change.</p>

      @if (loading()) {
        <div role="status" class="mt-6 h-28 animate-pulse rounded-2xl bg-sand-200"><span class="sr-only">Loading…</span></div>
      } @else if (error()) {
        @if (awaitingApproval()) { <app-provider-approval-notice feature="Referring work to other facilities" /> } @else {
        <p role="alert" class="mt-6 rounded-2xl bg-clay-50 p-5 text-clay-700">Referrals couldn’t be loaded. <button type="button" (click)="load()" class="font-semibold underline">Try again</button></p>
        }
      } @else if (!items().length) {
        <section class="sc-card mt-6 p-8 text-center">
          <h2 class="font-display text-xl font-semibold text-ink">Nothing referred yet</h2>
          <p class="mx-auto mt-2 max-w-md text-ink-soft">When a test you don’t run or a medicine you don’t stock comes in, open the request and choose “Refer to another lab” or “pharmacy”.</p>
        </section>
      } @else {
        <ul class="mt-6 grid gap-3">
          @for (f of items(); track f.reference) {
            <li class="sc-card p-5" data-referred>
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{{ typeLabel(f.clinicalOrder.type) }} · {{ date(f.createdAt) }}</p>
                  <h2 class="mt-1 font-semibold text-ink">{{ f.patient.givenName }} {{ f.patient.familyName }}</h2>
                  <p class="mt-1 text-sm text-ink-soft">To <strong class="font-semibold text-ink">{{ f.fulfiller.displayName }}</strong> · {{ f.fulfiller.serviceUnitName }}</p>
                  @if (f.referral?.note) { <p class="mt-1 text-sm text-ink-muted">“{{ f.referral?.note }}”</p> }
                </div>
                <span class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 {{ toneClass(f) }}" data-status>{{ statusLabel(f) }}</span>
              </div>
              @if (f.referralFee; as fee) {
                <p class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sand-50 px-4 py-3 text-sm ring-1 ring-ink/[0.06]" data-referral-fee>
                  <span class="text-ink-soft">Your referral fee</span>
                  <span><strong class="font-semibold text-ink">{{ money(fee.amountMinor, fee.currency) }}</strong><span class="text-ink-muted"> · {{ feeStatus(fee.status) }}</span></span>
                </p>
              }
              @if (hasResults(f)) {
                <dl class="mt-4 grid gap-2 rounded-2xl bg-leaf-50 p-4 text-sm ring-1 ring-leaf-100" data-results>
                  @for (item of f.clinicalOrder.diagnosticItems ?? []; track item.sortOrder) {
                    <div class="rounded-xl bg-white p-3">
                      <dt class="font-semibold text-ink">{{ item.name }}</dt>
                      <dd class="mt-0.5 text-ink-soft">
                        @if (item.resultedAt) {
                          {{ item.resultValue || item.resultText || 'Result recorded' }} {{ item.resultUnit ?? '' }}
                          @if (item.referenceRange) { <span class="text-ink-muted"> · ref {{ item.referenceRange }}</span> }
                          @if (item.resultFlag) { <strong class="ml-1 text-clay-700">{{ item.resultFlag }}</strong> }
                        } @else { Waiting }
                      </dd>
                    </div>
                  }
                </dl>
              }
            </li>
          }
        </ul>
      }
    </main>
  `,
})
export class ProviderReferredOutPageComponent {
  private readonly api = inject(PharmacyFulfillmentApiService);
  readonly items = signal<readonly ProviderOrderFulfillment[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly awaitingApproval = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.awaitingApproval.set(false);
    this.api
      .listReferredOut()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (page) => this.items.set(page.items), error: (e: unknown) => { this.awaitingApproval.set(isAwaitingProviderApproval(e)); this.error.set(true); } });
  }

  hasResults(f: ProviderOrderFulfillment): boolean {
    return (f.clinicalOrder.diagnosticItems ?? []).some((item) => !!item.resultedAt);
  }

  statusLabel(f: ProviderOrderFulfillment): string {
    if (f.status === 'CANCELLED') return 'Not taken up';
    if (this.hasResults(f)) return 'Results ready';
    if (f.status === 'ACCEPTED') return f.dispensing?.status === 'COMPLETED' ? 'Dispensed' : 'Accepted';
    if (f.status === 'SELECTED') return 'Patient confirmed';
    return 'Waiting for patient';
  }

  toneClass(f: ProviderOrderFulfillment): string {
    if (f.status === 'CANCELLED') return 'bg-sand-100 text-ink-muted ring-ink/10';
    if (this.hasResults(f) || f.status === 'ACCEPTED') return 'bg-leaf-50 text-leaf-700 ring-leaf-100';
    if (f.status === 'SELECTED') return 'bg-brand-50 text-brand-800 ring-brand-100';
    return 'bg-ochre-50 text-ochre-700 ring-ochre-100';
  }

  typeLabel(type: string): string {
    return type === 'PRESCRIPTION' ? 'Prescription' : type === 'IMAGING' ? 'Imaging' : 'Lab tests';
  }

  money(amountMinor: number, currency: string): string {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN' }).format(amountMinor / 100);
  }

  feeStatus(status: string): string {
    return status === 'HELD' ? 'held until the job is done' : status === 'PAYABLE' ? 'ready for payout' : status === 'SETTLED' ? 'paid out' : status === 'VOIDED' ? 'cancelled' : status.toLowerCase();
  }

  date(value: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(value));
  }
}
