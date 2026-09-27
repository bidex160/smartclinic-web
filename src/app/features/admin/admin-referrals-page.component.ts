import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import {
  ReferralEarning,
  ReferralHistoryItem,
  ReferralStatus,
  ReferralTargetType,
} from '../../core/models/referral.model';
import { ReferralsApiService } from '../../core/services/referrals-api.service';
import { UtilsService } from '../../core/services/utils.service';
@Component({
  selector: 'app-admin-referrals-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Operations</p>
    <h1 class="mt-2 text-3xl font-bold">Referrals</h1>
    <form
      [formGroup]="form"
      (ngSubmit)="load()"
      class="mt-6 grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-5"
    >
      <label
        >Target type<select
          formControlName="targetType"
          class="mt-2 block w-full rounded-lg border p-3"
        >
          <option value="">All targets</option>
          <option value="PATIENT">Patient</option>
          <option value="CLINIC">Clinic</option>
          <option value="LABORATORY">Laboratory</option>
          <option value="PHARMACY">Pharmacy</option>
        </select></label
      ><label
        >Status<select formControlName="status" class="mt-2 block w-full rounded-lg border p-3">
          <option value="">All statuses</option>
          <option value="REGISTERED">Registered</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select></label
      ><label
        >Referrer email<input
          formControlName="referrerEmail"
          type="email"
          placeholder="e.g. ada@example.com"
          class="mt-2 block w-full rounded-lg border p-3" /></label
      ><label
        >Qualified from<input
          formControlName="qualifiedFrom"
          type="date"
          class="mt-2 block w-full rounded-lg border p-3" /></label
      ><label
        >Qualified to<input
          formControlName="qualifiedTo"
          type="date"
          class="mt-2 block w-full rounded-lg border p-3"
      /></label>
      <div class="flex gap-3">
        <button class="rounded-lg bg-brand-700 px-4 py-2 font-bold text-white">Apply</button
        ><button type="button" (click)="clear()" class="rounded-lg border px-4 py-2 font-bold">
          Clear
        </button>
      </div>
    </form>
    @if (loading()) {
      <p role="status" class="mt-5">Loading referrals…</p>
    }
    @if (error()) {
      <div role="alert" class="mt-5 rounded-xl bg-red-50 p-4">
        Referral history is unavailable right now.
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    }
    @if (!loading() && !error()) {
      <section class="mt-8" aria-labelledby="monetary-referrals-heading">
        <h2 id="monetary-referrals-heading" class="text-2xl font-bold">
          Monetary referral earnings
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          Read-only accounting; kept separate from reward points.
        </p>
        @if (monetaryEarnings().length) {
          <div class="mt-4 overflow-x-auto rounded-2xl border bg-white">
            <table class="min-w-[1100px] w-full text-left">
              <thead class="bg-slate-50">
                <tr>
                  <th class="p-3">Referrer</th>
                  <th class="p-3">Referral/code</th>
                  <th class="p-3">Patient/source</th>
                  <th class="p-3">Transaction</th>
                  <th class="p-3">Gross</th>
                  <th class="p-3">BPS</th>
                  <th class="p-3">Earning</th>
                  <th class="p-3">Status</th>
                  <th class="p-3">Dates</th>
                </tr>
              </thead>
              <tbody>
                @for (earning of monetaryEarnings(); track earning.id) {
                  <tr class="border-t">
                    <td class="p-3">{{ earning.referrerUserId }}</td>
                    <td class="p-3">
                      {{ earning.referralId }}<br /><span class="text-xs">{{
                        earning.referralCodeSnapshot
                      }}</span>
                    </td>
                    <td class="p-3">
                      {{ earning.patientId }}<br /><span class="text-xs"
                        >{{ earning.sourceType }} · {{ earning.sourceReference }}</span
                      >
                    </td>
                    <td class="p-3">{{ earning.paymentTransactionId }}</td>
                    <td class="p-3">
                      {{ moneyMinor(earning.grossAmountMinor, earning.currency) }}
                    </td>
                    <td class="p-3">{{ earning.referralBps }}</td>
                    <td class="p-3 font-bold">
                      {{ moneyMinor(earning.referralAmountMinor, earning.currency) }}
                    </td>
                    <td class="p-3">{{ statusLabel(earning.status) }}</td>
                    <td class="p-3 text-xs">
                      Created {{ utils.formatDateTime(earning.createdAt) }}<br />Payable
                      {{ utils.formatDateTime(earning.payableAt) }}<br />Settled
                      {{ utils.formatDateTime(earning.settledAt) }}<br />Reversed
                      {{ utils.formatDateTime(earning.reversedAt) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="mt-4 rounded-xl border bg-white p-6">No monetary referral earnings.</p>
        }
      </section>
      @if (items().length) {
        <div class="mt-5 overflow-x-auto rounded-2xl border bg-white">
          <table class="min-w-[650px] w-full text-left">
            <thead class="bg-slate-50">
              <tr>
                <th class="p-4">Target type</th>
                <th class="p-4">Status</th>
                <th class="p-4">Registered</th>
                <th class="p-4">Qualified</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track $index) {
                <tr class="border-t">
                  <td class="p-4">{{ label(item.targetType) }}</td>
                  <td class="p-4">{{ statusLabel(item.status) }}</td>
                  <td class="p-4">{{ utils.formatDate(item.registeredAt) }}</td>
                  <td class="p-4">
                    {{ item.qualifiedAt ? utils.formatDate(item.qualifiedAt) : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="mt-5 rounded-xl border bg-white p-6">No referrals match these filters.</p>
      }
    }
  </main>`,
})
export class AdminReferralsPageComponent {
  private readonly api = inject(ReferralsApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly utils = inject(UtilsService);
  readonly items = signal<ReferralHistoryItem[]>([]);
  readonly monetaryEarnings = signal<ReferralEarning[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly form = this.fb.group({
    targetType: '',
    status: '',
    referrerEmail: '',
    qualifiedFrom: '',
    qualifiedTo: '',
  });
  constructor() {
    this.load();
  }
  load() {
    if (this.loading()) return;
    const v = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      referrals: this.api.adminHistory({
        page: 1,
        limit: 20,
        ...(v.targetType && { targetType: v.targetType as ReferralTargetType }),
        ...(v.status && { status: v.status as ReferralStatus }),
        ...(v.referrerEmail.trim() && { referrerEmail: v.referrerEmail.trim() }),
        ...(v.qualifiedFrom && { qualifiedFrom: v.qualifiedFrom }),
        ...(v.qualifiedTo && { qualifiedTo: v.qualifiedTo }),
      }),
      earnings: this.api.adminEarnings(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.items.set(r.referrals.items);
          this.monetaryEarnings.set(r.earnings);
        },
        error: () => this.error.set(true),
      });
  }
  clear() {
    this.form.reset();
    this.load();
  }
  label(t: ReferralTargetType) {
    return (
      {
        PATIENT: 'Patient',
        CLINIC: 'Clinic',
        LABORATORY: 'Laboratory',
        PHARMACY: 'Pharmacy',
        INDIVIDUAL: 'Individuals',
      } as const
    )[t];
  }
  statusLabel(s: string) {
    return s.charAt(0) + s.slice(1).toLowerCase();
  }
  moneyMinor(minor: string, currency: string) {
    return this.utils.formatMoney((Number(minor) / 100).toFixed(2), currency);
  }
}
