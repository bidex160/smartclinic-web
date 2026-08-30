import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  FulfillmentDispensingSummary,
  FulfillmentFundingSummary,
  PharmacyQuote,
  ProviderOrderFulfillment,
  UpsertPharmacyQuoteRequest,
} from '../../core/models/pharmacy-fulfillment.model';

type OperationalState = {
  readonly status: ProviderOrderFulfillment['status'];
  readonly funding: FulfillmentFundingSummary | null;
  readonly dispensing: FulfillmentDispensingSummary | null;
};
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
@Component({
  selector: 'app-provider-pharmacy-order-detail-page',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-5xl px-5 py-10 sm:px-8">
    <a routerLink="/provider/pharmacy-orders" class="font-bold text-brand-700 underline"
      >← Pharmacy Orders</a
    >
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border p-6">Loading pharmacy order…</p>
    } @else if (error() && !fulfillment()) {
      <p role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        {{ error() }} <button (click)="load()" class="font-bold underline">Try again</button>
      </p>
    } @else if (fulfillment(); as f) {
      <header class="mt-6">
        <p class="break-all text-sm font-bold text-brand-700">{{ f.reference }}</p>
        <h1 class="mt-2 text-3xl font-bold">Pharmacy fulfillment</h1>
        <p class="mt-2">{{ f.status }}</p>
      </header>
      <section class="mt-6 rounded-2xl border bg-white p-6">
        <dl class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-500">Patient</dt>
            <dd class="font-bold">{{ f.patient.givenName }} {{ f.patient.familyName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Ordering Provider</dt>
            <dd>{{ f.clinicalOrder.orderingProvider.displayName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Pharmacy unit</dt>
            <dd>{{ f.fulfiller.serviceUnitName }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Prescription</dt>
            <dd class="break-all">{{ f.clinicalOrder.reference }}</dd>
          </div>
        </dl>
      </section>
      <section class="mt-6 rounded-2xl border bg-white p-6">
        <h2 class="text-xl font-bold">Prescription instructions</h2>
        @for (i of f.clinicalOrder.prescription?.items || []; track i.sortOrder) {
          <article class="mt-4 border-t pt-4">
            <strong>{{ i.medicationName }} {{ i.strength || '' }}</strong>
            <p>{{ i.dosage }} · {{ i.frequency }} · {{ i.duration || 'Duration not specified' }}</p>
            <p>
              Prescribed quantity: {{ i.quantity || 'Not specified' }}
              @if (i.instructions) {
                · {{ i.instructions }}
              }
            </p>
          </article>
        }
      </section>
      @if (f.status === 'SELECTED') {
        <button
          (click)="accept()"
          [disabled]="pending()"
          class="mt-6 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
        >
          Accept Prescription
        </button>
      } @else if (f.status === 'ACCEPTED') {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Pharmacy quote</h2>
          @if (quote(); as q) {
            <p class="mt-2 font-bold">{{ q.status }} · {{ money(q.totalMinor, q.currency) }}</p>
            @if (q.status === 'DRAFT') {
              <button
                (click)="editQuote(q)"
                [disabled]="pending()"
                class="mt-4 rounded-xl border px-5 py-3 font-bold"
              >
                Edit quote
              </button>
              <button
                (click)="submitQuote(q.reference)"
                [disabled]="pending()"
                class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >
                Submit quote
              </button>
            } @else {
              <div class="mt-4">
                @for (i of q.items; track i.prescriptionItem.sortOrder) {
                  <p class="mt-2">
                    {{ i.quotedMedicationLabel }} — {{ i.availability }} —
                    {{ money(i.lineTotalMinor, q.currency) }}
                  </p>
                }
              </div>
            }
          } @else {
            <form [formGroup]="quoteForm" (ngSubmit)="saveQuote()" class="mt-4 grid gap-4">
              <label class="font-bold"
                >Currency<input
                  formControlName="currency"
                  maxlength="3"
                  class="mt-1 block min-h-11 w-full rounded-lg border px-3" /></label
              ><label class="font-bold"
                >Quote expires<input
                  type="datetime-local"
                  formControlName="expiresAt"
                  class="mt-1 block min-h-11 w-full rounded-lg border px-3"
              /></label>
              <div formArrayName="items">
                @for (row of quoteItems.controls; track $index) {
                  <fieldset [formGroupName]="$index" class="mt-4 rounded-xl border p-4">
                    <legend class="font-bold">
                      {{ f.clinicalOrder.prescription!.items[$index].medicationName }}
                    </legend>
                    <p class="text-sm">
                      {{
                        f.clinicalOrder.prescription!.items[$index].quantity ||
                          'Quantity not specified'
                      }}
                      ·
                      {{
                        f.clinicalOrder.prescription!.items[$index].instructions ||
                          'No additional instructions'
                      }}
                    </p>
                    <div class="mt-3 grid gap-3 sm:grid-cols-3">
                      <label
                        >Availability<select
                          formControlName="availability"
                          (change)="availabilityChanged($index)"
                          class="block min-h-11 w-full rounded-lg border"
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="UNAVAILABLE">Unavailable</option>
                        </select></label
                      ><label
                        >Quantity supplied<input
                          type="number"
                          min="0"
                          formControlName="quantitySupplied"
                          class="block min-h-11 w-full rounded-lg border px-3" /></label
                      ><label
                        >Unit price<input
                          inputmode="decimal"
                          formControlName="unitPrice"
                          placeholder="0.00"
                          class="block min-h-11 w-full rounded-lg border px-3"
                      /></label>
                    </div>
                    <label class="mt-3 block"
                      >Note
                      <input
                        formControlName="note"
                        maxlength="500"
                        class="block min-h-11 w-full rounded-lg border px-3"
                    /></label>
                  </fieldset>
                }
              </div>
              @if (error()) {
                <p role="alert" class="rounded-xl bg-red-50 p-4">{{ error() }}</p>
              }
              <button
                [disabled]="pending() || quoteForm.invalid"
                class="rounded-xl border px-5 py-3 font-bold"
              >
                Save draft quote
              </button>
            </form>
          }
        </section>
      }
      @if (patientState(); as s) {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Dispensing</h2>
          <p class="mt-2">Funding: {{ s.funding?.status || 'No accepted quote' }}</p>
          <p>Dispensing: {{ s.dispensing?.status || 'Not started' }}</p>
          <div class="mt-4 flex flex-wrap gap-3">
            @if (s.dispensing?.status === 'READY_TO_DISPENSE') {
              <button
                (click)="command('start-dispensing')"
                class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >
                Start Dispensing
              </button>
            }
            @if (s.dispensing?.status === 'DISPENSING') {
              <button
                (click)="command('ready-for-pickup')"
                class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >
                Mark Ready for Pickup
              </button>
            }
            @if (s.dispensing?.status === 'READY_FOR_PICKUP') {
              <button
                (click)="command('complete')"
                class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >
                Complete Handover
              </button>
            }
            @if (s.status === 'SELECTED' || s.status === 'ACCEPTED') {
              <button
                (click)="cannot()"
                class="rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
              >
                Cannot Fulfill
              </button>
            }
          </div>
          @if (s.funding?.status === 'REQUIRES_REFUND_REVIEW') {
            <p class="mt-4 rounded-xl bg-amber-50 p-4 font-bold">
              Refund review required. This does not mean a refund has completed.
            </p>
          }
        </section>
      }
    }
  </main>`,
})
export class ProviderPharmacyOrderDetailPageComponent {
  private api = inject(PharmacyFulfillmentApiService);
  private fb = inject(FormBuilder);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference')!;
  readonly fulfillment = signal<ProviderOrderFulfillment | null>(null);
  readonly quote = signal<PharmacyQuote | null>(null);
  readonly editingQuoteReference = signal<string | null>(null);
  readonly patientState = signal<OperationalState | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly quoteForm = this.fb.group({
    currency: ['NGN', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    expiresAt: ['', Validators.required],
    items: new FormArray<FormGroup>([]),
  });
  get quoteItems() {
    return this.quoteForm.controls.items;
  }
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    forkJoin({ f: this.api.getFulfillment(this.reference), q: this.api.listQuotes(this.reference) })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (x) => {
          this.fulfillment.set(x.f);
          this.quote.set(x.q[0] ?? null);
          this.patientState.set({
            status: x.f.status,
            funding: x.f.funding,
            dispensing: x.f.dispensing,
          });
          this.buildRows(x.f);
        },
        error: () => this.error.set('This pharmacy order is unavailable.'),
      });
  }
  private buildRows(f: ProviderOrderFulfillment) {
    this.quoteItems.clear();
    for (const i of f.clinicalOrder.prescription?.items ?? [])
      this.quoteItems.push(
        this.fb.group({
          availability: ['AVAILABLE', Validators.required],
          quantitySupplied: [0, [Validators.required, Validators.min(0)]],
          unitPrice: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
          note: ['', [Validators.maxLength(500)]],
          sortOrder: [i.sortOrder],
        }),
      );
  }
  accept() {
    this.run(this.api.acceptFulfillment(this.reference), () => this.load());
  }
  availabilityChanged(i: number) {
    const r = this.quoteItems.at(i);
    if (r.controls['availability'].value === 'UNAVAILABLE')
      r.patchValue({ quantitySupplied: 0, unitPrice: '0' });
  }
  minor(v: string): number | null {
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(v.trim());
    if (!m) return null;
    return Number(BigInt(m[1]) * 100n + BigInt((m[2] ?? '').padEnd(2, '0')));
  }
  saveQuote() {
    if (this.quoteForm.invalid) return;
    const v = this.quoteForm.getRawValue();
    const items = v.items.map((i: any) => ({
      sortOrder: i.sortOrder,
      availability: i.availability,
      quantitySupplied: Number(i.quantitySupplied),
      unitPriceMinor: this.minor(i.unitPrice)!,
      note: i.note?.trim() || null,
    }));
    const body: UpsertPharmacyQuoteRequest = {
      currency: v.currency!,
      expiresAt: new Date(v.expiresAt!).toISOString(),
      items,
    };
    const editing = this.editingQuoteReference();
    this.run(
      editing ? this.api.updateQuote(editing, body) : this.api.createQuote(this.reference, body),
      (q) => {
        this.editingQuoteReference.set(null);
        this.quote.set(q);
      },
    );
  }
  editQuote(q: PharmacyQuote) {
    this.editingQuoteReference.set(q.reference);
    this.quoteForm.patchValue({
      currency: q.currency,
      expiresAt: new Date(q.expiresAt).toISOString().slice(0, 16),
    });
    for (const [index, item] of q.items.entries()) {
      this.quoteItems.at(index)?.patchValue({
        availability: item.availability,
        quantitySupplied: item.quantitySupplied,
        unitPrice: this.major(item.unitPriceMinor),
        note: item.note ?? '',
      });
    }
    this.quote.set(null);
  }
  submitQuote(ref: string) {
    if (confirm('Once submitted, this quote can no longer be edited.'))
      this.run(this.api.submitQuote(ref), (q) => this.quote.set(q));
  }
  command(a: 'start-dispensing' | 'ready-for-pickup' | 'complete') {
    this.run(this.api.dispensing(this.reference, a), (s) => this.patientState.set(s));
  }
  cannot() {
    if (confirm('Mark this prescription as unable to fulfill?'))
      this.run(this.api.dispensing(this.reference, 'cannot-fulfill'), (s) =>
        this.patientState.set(s),
      );
  }
  private run(o: any, next: (x: any) => void) {
    this.pending.set(true);
    this.error.set(null);
    o.pipe(finalize(() => this.pending.set(false))).subscribe({
      next,
      error: () => this.error.set('The action could not be completed. Refresh and try again.'),
    });
  }
  money(n: number, c: string) {
    return n === 0
      ? 'Free'
      : new Intl.NumberFormat('en-NG', { style: 'currency', currency: c }).format(n / 100);
  }
  major(minor: number) {
    const whole = Math.trunc(minor / 100);
    const fraction = String(minor % 100).padStart(2, '0');
    return fraction === '00' ? String(whole) : `${whole}.${fraction}`;
  }
}
