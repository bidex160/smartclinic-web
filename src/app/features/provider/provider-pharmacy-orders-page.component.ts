import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProviderOrderFulfillment } from '../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
@Component({
  selector: 'app-provider-pharmacy-orders-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase text-brand-600">Provider operations</p>
    <h1 class="mt-2 text-3xl font-bold">Pharmacy Orders</h1>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading pharmacy orders…</p>
    } @else if (error()) {
      <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        Orders could not be loaded.
        <button (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (!items().length) {
      <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
        <h2 class="text-xl font-bold">No prescriptions have been assigned to this pharmacy yet.</h2>
      </section>
    } @else {
      <div class="mt-8 overflow-x-auto rounded-2xl border bg-white">
        <table class="min-w-full divide-y">
          <thead>
            <tr>
              @for (
                h of [
                  'Fulfillment',
                  'Patient',
                  'Prescription',
                  'Ordering Provider',
                  'Pharmacy unit',
                  'Status',
                  'Date',
                  'Action',
                ];
                track h
              ) {
                <th class="p-4 text-left text-xs font-bold uppercase text-slate-500">{{ h }}</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (f of items(); track f.reference) {
              <tr>
                <td class="break-all p-4 font-bold">{{ f.reference }}</td>
                <td class="p-4">{{ f.patient.givenName }} {{ f.patient.familyName }}</td>
                <td class="break-all p-4">{{ f.clinicalOrder.reference }}</td>
                <td class="p-4">{{ f.clinicalOrder.orderingProvider.displayName }}</td>
                <td class="p-4">{{ f.fulfiller.serviceUnitName }}</td>
                <td class="p-4">{{ f.status }}</td>
                <td class="p-4">{{ date(f.createdAt) }}</td>
                <td class="p-4">
                  <a
                    [routerLink]="['/provider/pharmacy-orders', f.reference]"
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
export class ProviderPharmacyOrdersPageComponent {
  private api = inject(PharmacyFulfillmentApiService);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly items = signal<readonly ProviderOrderFulfillment[]>([]);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api
      .listFulfillments()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (p) => this.items.set(p.items), error: () => this.error.set(true) });
  }
  date(v: string) {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(v));
  }
}
