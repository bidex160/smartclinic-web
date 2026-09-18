import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClinicalOrder } from '../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
@Component({
  selector: 'app-prescriptions-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase text-brand-600">SmartClinic medicines</p>
    <h1 class="mt-2 text-3xl font-bold">Get Medicine</h1>
    <p class="mt-2 text-slate-600">Use a prescription already in SmartClinic, or choose another way to get started.</p>
    <section class="mt-6 grid gap-3 sm:grid-cols-3">
      <a routerLink="/me/request-care" [queryParams]="{ serviceCode: 'BASIC_MEDICATIONS' }" class="rounded-2xl bg-white p-5 font-bold text-brand-900 ring-1 ring-slate-200 hover:ring-brand-300">
        Find a Medicine
        <span class="mt-1 block text-sm font-normal text-slate-600">Start a medicine request if you do not already have a SmartClinic prescription.</span>
      </a>
      <div class="rounded-2xl bg-slate-50 p-5 font-bold text-slate-600 ring-1 ring-slate-200">
        Upload a Prescription
        <span class="mt-1 block text-sm font-normal">Coming when prescription upload is connected.</span>
      </div>
      <div class="rounded-2xl bg-slate-50 p-5 font-bold text-slate-600 ring-1 ring-slate-200">
        Refill Previous Medicine
        <span class="mt-1 block text-sm font-normal">Available when a previous prescription is eligible for refill.</span>
      </div>
    </section>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading prescriptions…</p>
    } @else if (error()) {
      <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        We couldn't load prescriptions.
        <button (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (!items().length) {
      <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
        <h2 class="text-xl font-bold">No SmartClinic prescriptions yet</h2>
        <p class="mt-2 text-slate-600">If a doctor sends you a prescription through SmartClinic, it will appear here automatically.</p>
      </section>
    } @else {
      <section class="mt-8">
        <h2 class="text-xl font-bold text-brand-950">Your prescriptions</h2>
        <p class="mt-1 text-sm text-slate-600">Choose a prescription to get the medicines from an available pharmacy.</p>
      </section>
      <div class="mt-4 overflow-x-auto rounded-2xl border bg-white">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              @for (
                h of [
                  'Prescription',
                  'Ordering provider',
                  'Issued',
                  'Status',
                  'Medicines',
                  'Action',
                ];
                track h
              ) {
                <th class="p-4 text-left text-xs font-bold uppercase text-slate-500">{{ h }}</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (o of items(); track o.reference) {
              <tr>
                <td class="break-all p-4 font-bold">{{ o.reference }}</td>
                <td class="p-4">{{ o.orderingProvider.displayName }}</td>
                <td class="p-4">{{ date(o.issuedAt) }}</td>
                <td class="p-4">{{ o.status }}</td>
                <td class="p-4">{{ o.prescription?.items?.length || 0 }}</td>
                <td class="p-4">
                  <a
                    [routerLink]="['/me/prescriptions', o.reference]"
                    class="font-bold text-brand-700 underline"
                    >Get medicines</a
                  >
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </main>`,
})
export class PrescriptionsPageComponent {
  private api = inject(PharmacyFulfillmentApiService);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly items = signal<readonly ClinicalOrder[]>([]);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .listPatientOrders()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (p) => this.items.set(p.items), error: () => this.error.set(true) });
  }
  date(v: string | null) {
    return v ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(v)) : '—';
  }
}
