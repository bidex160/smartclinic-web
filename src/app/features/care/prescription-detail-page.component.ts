import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import PaystackPop from '@paystack/inline-js';
import { finalize } from 'rxjs';
import {
  ClinicalOrder,
  FulfillmentDirectoryItem,
  PatientOrderFulfillment,
  ProviderOrderFulfillment,
} from '../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
@Component({
  selector: 'app-prescription-detail-page',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-5xl px-5 py-10 sm:px-8">
    <a routerLink="/me/prescriptions" class="font-bold text-brand-700 underline">← Prescriptions</a>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border p-6">Loading prescription…</p>
    } @else if (error() && !order()) {
      <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        {{ error() }} <button (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (order(); as o) {
      <header class="mt-6">
        <p class="break-all text-sm font-bold text-brand-700">{{ o.reference }}</p>
        <h1 class="mt-2 text-3xl font-bold">Prescription</h1>
        <p class="mt-2">
          {{ o.orderingProvider.displayName }} · {{ date(o.issuedAt) }} · {{ o.status }}
        </p>
      </header>
      @if (o.status === 'CANCELLED') {
        <p class="mt-5 rounded-xl bg-red-50 p-4 font-bold">
          Prescription Cancelled
          @if (o.cancellationReason) {
            : {{ o.cancellationReason }}
          }
        </p>
      }
      <section class="mt-6 overflow-x-auto rounded-2xl border bg-white p-5">
        <table class="min-w-full">
          <thead>
            <tr>
              @for (
                h of [
                  'Medication',
                  'Strength',
                  'Dosage',
                  'Frequency',
                  'Duration',
                  'Quantity',
                  'Route',
                  'Instructions',
                ];
                track h
              ) {
                <th class="border-b p-3 text-left text-xs uppercase">{{ h }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (i of o.prescription?.items || []; track i.sortOrder) {
              <tr>
                <td class="p-3 font-bold">{{ i.medicationName }}</td>
                <td class="p-3">{{ i.strength || '—' }}</td>
                <td class="p-3">{{ i.dosage }}</td>
                <td class="p-3">{{ i.frequency }}</td>
                <td class="p-3">{{ i.duration || '—' }}</td>
                <td class="p-3">{{ i.quantity || '—' }}</td>
                <td class="p-3">{{ i.route || '—' }}</td>
                <td class="p-3">{{ i.instructions || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
      @if (fulfillment(); as f) {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Pharmacy fulfillment</h2>
          <p class="mt-2">
            <strong>{{ f.pharmacy.displayName }}</strong> · {{ f.pharmacy.serviceUnitName }}
          </p>
          <p class="mt-2">{{ status(f.status) }}</p>
          @if (f.quote; as q) {
            <div class="mt-5 border-t pt-5">
              <h3 class="font-bold">Pharmacy quote</h3>
              @for (i of q.items; track i.prescriptionItem.sortOrder) {
                <div class="mt-3 flex justify-between gap-4">
                  <span>{{ i.quotedMedicationLabel }} · {{ i.availability }}</span
                  ><strong>{{ money(i.lineTotalMinor, q.currency) }}</strong>
                </div>
              }
              <p class="mt-4 text-xl font-bold">Total: {{ money(q.totalMinor, q.currency) }}</p>
              @if (q.status === 'SUBMITTED') {
                @if (hasUnavailable(q.items)) {
                  <label class="mt-4 flex gap-3"
                    ><input
                      type="checkbox"
                      [checked]="acknowledge()"
                      (change)="acknowledge.set($any($event.target).checked)"
                    /><span
                      >I understand that one or more prescribed medicines are unavailable from this
                      pharmacy.</span
                    ></label
                  >
                }
                <button
                  type="button"
                  (click)="acceptQuote(q.reference)"
                  [disabled]="pending() || (hasUnavailable(q.items) && !acknowledge())"
                  class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
                >
                  Accept quote
                </button>
              }
            </div>
          }
          @if (f.funding; as funding) {
            <div class="mt-5 rounded-xl bg-slate-50 p-4">
              <strong>Payment: {{ fundingLabel(funding.status) }}</strong>
              <p>{{ money(funding.amountMinor, funding.currency) }}</p>
              @if (funding.status === 'PENDING') {
                <button
                  type="button"
                  (click)="pay(f.quote!.reference)"
                  [disabled]="pending()"
                  class="mt-3 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
                >
                  Pay now
                </button>
              }
            </div>
          }
          @if (f.dispensing; as d) {
            <div class="mt-5">
              <h3 class="font-bold">Pickup progress</h3>
              <p class="mt-2">{{ dispensingLabel(d.status) }}</p>
            </div>
          }
          @if (f.status !== 'ACCEPTED' && !f.funding?.satisfied) {
            <button
              type="button"
              (click)="changePharmacy(f.reference)"
              class="mt-4 font-bold text-brand-700 underline"
            >
              Choose another pharmacy
            </button>
          }
        </section>
      } @else if (o.status === 'ISSUED') {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Choose a pharmacy</h2>
          <p class="mt-2 text-slate-600">
            Search eligible pharmacy service units. Your care provider's recommendation is optional.
          </p>
          <form [formGroup]="searchForm" (ngSubmit)="search()" class="mt-4 flex gap-3">
            <input
              formControlName="q"
              placeholder="Search pharmacy or unit"
              class="min-h-12 flex-1 rounded-xl border px-3"
            /><button class="rounded-xl border px-5 font-bold">Search</button>
          </form>
          @if (directoryLoading()) {
            <p role="status" class="mt-4">Searching pharmacies…</p>
          } @else if (directoryError()) {
            <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4">
              Pharmacies could not be loaded.
              <button (click)="search()" class="font-bold underline">Try again</button>
            </p>
          } @else if (!pharmacies().length) {
            <p class="mt-4 text-slate-600">No eligible pharmacies match your search.</p>
          } @else {
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              @for (p of pharmacies(); track p.providerServiceUnitReference) {
                <article class="rounded-xl border p-4">
                  <h3 class="font-bold">{{ p.displayName }}</h3>
                  <p>{{ p.unitName }}</p>
                  <p class="text-sm text-slate-600">
                    {{ p.location.city }}, {{ p.location.stateOrRegion }} ·
                    {{ p.location.countryCode }}
                  </p>
                  <button
                    type="button"
                    (click)="select(p)"
                    [disabled]="pending()"
                    class="mt-3 rounded-lg bg-brand-700 px-4 py-2 font-bold text-white"
                  >
                    Select pharmacy
                  </button>
                </article>
              }
            </div>
          }
        </section>
      }
      @if (error()) {
        <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4">{{ error() }}</p>
      }
    }
  </main>`,
})
export class PrescriptionDetailPageComponent {
  private api = inject(PharmacyFulfillmentApiService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  readonly reference = this.route.snapshot.paramMap.get('reference')!;
  readonly order = signal<ClinicalOrder | null>(null);
  readonly fulfillment = signal<PatientOrderFulfillment | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pending = signal(false);
  readonly directoryLoading = signal(false);
  readonly directoryError = signal(false);
  readonly pharmacies = signal<readonly FulfillmentDirectoryItem[]>([]);
  readonly acknowledge = signal(false);
  readonly searchForm = this.fb.nonNullable.group({ q: '' });
  popup = new PaystackPop();
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api
      .getPatientOrder(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (o) => {
          this.order.set(o);
          this.search();
        },
        error: () => this.error.set('This prescription is unavailable.'),
      });
  }
  search() {
    this.directoryLoading.set(true);
    this.directoryError.set(false);
    this.api
      .searchPharmacies({ q: this.searchForm.controls.q.value, page: 1, limit: 20 })
      .pipe(finalize(() => this.directoryLoading.set(false)))
      .subscribe({
        next: (p) => this.pharmacies.set(p.items),
        error: () => this.directoryError.set(true),
      });
  }
  select(p: FulfillmentDirectoryItem) {
    this.pending.set(true);
    this.api
      .selectPharmacy(this.reference, p.providerServiceUnitReference)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (x: any) =>
          this.api.getPatientFulfillment(x.reference).subscribe((f) => this.fulfillment.set(f)),
        error: () => this.error.set('The pharmacy could not be selected. Refresh and try again.'),
      });
  }
  changePharmacy(ref: string) {
    if (confirm('Cancel this selection and choose another pharmacy?'))
      this.api
        .cancelPatientFulfillment(ref)
        .subscribe({
          next: () => this.fulfillment.set(null),
          error: () => this.error.set('The pharmacy selection could not be changed.'),
        });
  }
  acceptQuote(ref: string) {
    this.pending.set(true);
    this.api
      .acceptQuote(ref, this.acknowledge())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (f) => this.fulfillment.set(f),
        error: () =>
          this.error.set('This quote could not be accepted. It may have changed or expired.'),
      });
  }
  pay(ref: string) {
    this.pending.set(true);
    this.api.getFunding(ref).subscribe({
      next: (state) => {
        if (state.paid) {
          this.refreshFulfillment();
          this.pending.set(false);
          return;
        }
        this.api.initializeFunding(ref).subscribe({
          next: (init) => {
            if (init.fundingStatus === 'SATISFIED_FREE') {
              this.refreshFulfillment();
              this.pending.set(false);
              return;
            }
            if (!init.accessCode) {
              this.error.set('Payment could not be initialized.');
              this.pending.set(false);
              return;
            }
            this.popup.resumeTransaction(init.accessCode, {
              onSuccess: () =>
                this.api.verifyFunding(ref).subscribe({
                  next: () => {
                    this.refreshFulfillment();
                    this.pending.set(false);
                  },
                  error: () => {
                    this.error.set('Payment verification is still pending. Refresh and try again.');
                    this.pending.set(false);
                  },
                }),
              onCancel: () => this.pending.set(false),
              onError: () => {
                this.error.set('Payment could not be opened.');
                this.pending.set(false);
              },
            });
          },
          error: () => {
            this.error.set('Payment could not be initialized.');
            this.pending.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Funding state could not be loaded.');
        this.pending.set(false);
      },
    });
  }
  private refreshFulfillment() {
    const f = this.fulfillment();
    if (f) this.api.getPatientFulfillment(f.reference).subscribe((x) => this.fulfillment.set(x));
  }
  hasUnavailable(items: any[] | readonly any[]) {
    return items.some((i) => i.availability === 'UNAVAILABLE');
  }
  date(v: string | null) {
    return v ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(v)) : '—';
  }
  money(n: number, c: string) {
    return n === 0
      ? 'Free'
      : new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n / 100);
  }
  status(s: string) {
    return (
      (
        {
          PROPOSED: 'Pharmacy recommended',
          SELECTED: 'Pharmacy selected',
          ACCEPTED: 'Pharmacy accepted your prescription',
          CANCELLED: 'Pharmacy fulfillment cancelled',
        } as Record<string, string>
      )[s] || s
    );
  }
  fundingLabel(s: string) {
    return (
      (
        {
          PENDING: 'Awaiting payment',
          PAID: 'Paid',
          SATISFIED_FREE: 'No payment required',
          CANCELLED: 'Cancelled',
          REQUIRES_REFUND_REVIEW: 'Refund review required',
        } as Record<string, string>
      )[s] || s
    );
  }
  dispensingLabel(s: string) {
    return (
      (
        {
          READY_TO_DISPENSE: 'Ready to begin dispensing',
          DISPENSING: 'Dispensing',
          READY_FOR_PICKUP: 'Ready for pickup',
          COMPLETED: 'Completed',
          CANCELLED: 'Cancelled',
          REQUIRES_REFUND_REVIEW: 'Refund review required',
        } as Record<string, string>
      )[s] || s
    );
  }
}
