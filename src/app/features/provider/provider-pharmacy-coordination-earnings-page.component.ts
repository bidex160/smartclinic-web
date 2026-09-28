import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PharmacyCoordinationEarnings } from '../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';

@Component({
  selector: 'app-provider-pharmacy-coordination-earnings-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <a routerLink="/provider/dashboard" class="font-bold text-brand-700 underline"
      >← Provider dashboard</a
    >
    <header class="mt-6">
      <p class="text-xs font-bold uppercase tracking-[.18em] text-brand-700">Smart Prescription</p>
      <h1 class="mt-2 text-3xl font-black text-brand-950">Prescription coordination earnings</h1>
      <p class="mt-2 max-w-3xl text-slate-600">
        These are separate from referral points and provider service earnings. A coordination
        earning is held after payment and becomes available only when the pharmacy completes the
        medicine handoff.
      </p>
    </header>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-5">Loading earnings…</p>
    } @else if (error()) {
      <p role="alert" class="mt-6 rounded-2xl bg-red-50 p-5">
        Earnings could not be loaded.
        <button (click)="load()" class="font-bold underline">Try again</button>
      </p>
    } @else if (data(); as d) {
      <section class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        @for (t of d.totals; track t.currency) {
          <article class="rounded-2xl border bg-white p-5">
            <p class="text-sm font-bold">{{ t.currency }}</p>
            <p class="mt-2 text-2xl font-black">{{ money(t.total, t.currency) }}</p>
            <dl class="mt-3 grid gap-1 text-sm">
              <div class="flex justify-between">
                <dt>Held</dt>
                <dd>{{ money(t.held, t.currency) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Available</dt>
                <dd>{{ money(t.payable, t.currency) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Settled</dt>
                <dd>{{ money(t.settled, t.currency) }}</dd>
              </div>
            </dl>
          </article>
        }
      </section>
      @if (!d.items.length) {
        <p class="mt-6 rounded-2xl border bg-white p-5 text-slate-600">
          No completed Smart Prescription payments yet.
        </p>
      } @else {
        <div class="mt-6 overflow-x-auto rounded-2xl border bg-white">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b bg-slate-50">
                <th class="p-4 text-left">Date</th>
                <th class="p-4 text-left">Type</th>
                <th class="p-4 text-left">Prescription</th>
                <th class="p-4 text-right">Rate</th>
                <th class="p-4 text-right">Earning</th>
                <th class="p-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (item of d.items; track item.id) {
                <tr class="border-b">
                  <td class="p-4">{{ date(item.createdAt) }}</td>
                  <td class="p-4">
                    {{ item.type === 'DOCTOR' ? 'Doctor coordination' : 'Hospital coordination' }}
                  </td>
                  <td class="p-4 font-semibold">{{ item.sourceOrderReference }}</td>
                  <td class="p-4 text-right">{{ item.bpsSnapshot / 100 }}%</td>
                  <td class="p-4 text-right font-bold">
                    {{ money(item.amountMinor, item.currency) }}
                  </td>
                  <td class="p-4">{{ item.status }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  </main>`,
})
export class ProviderPharmacyCoordinationEarningsPageComponent {
  private api = inject(PharmacyFulfillmentApiService);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly data = signal<PharmacyCoordinationEarnings | null>(null);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .getCoordinationEarnings()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (value) => this.data.set(value), error: () => this.error.set(true) });
  }
  money(value: number, currency: string) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(value / 100);
  }
  date(value: string) {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value));
  }
}
