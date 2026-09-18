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
    <p class="text-sm font-bold uppercase text-brand-600">Patient portal</p>
    <h1 class="mt-2 text-3xl font-bold">Prescriptions</h1>
    <p class="mt-2 text-slate-600">Issued prescriptions from your General Care appointments.</p>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading prescriptions…</p>
    } @else if (error()) {
      <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        We couldn't load prescriptions.
        <button (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (!items().length) {
      <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
        <h2 class="text-xl font-bold">No prescriptions yet.</h2>
      </section>
    } @else {
      <div class="mt-8 overflow-x-auto rounded-2xl border bg-white">
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
                    >View</a
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
