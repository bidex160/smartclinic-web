import { ChangeDetectionStrategy, Component, input, inject, signal, effect } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  ClinicalOrder,
  UpsertPrescriptionRequest,
} from '../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';

@Component({
  selector: 'app-provider-prescription-section',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <section class="mt-6 rounded-2xl border bg-white p-6">
      <div class="flex flex-wrap justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold">Clinical orders</h2>
          <p class="mt-1 text-slate-600">Prescription</p>
        </div>
        @if (order(); as o) {
          <span class="font-bold">{{ o.status }}</span>
        }
      </div>
      @if (loading()) {
        <p role="status" class="mt-4">Loading prescription…</p>
      } @else if (error()) {
        <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4">
          {{ error() }}
          <button type="button" class="font-bold underline" (click)="load()">Try again</button>
        </p>
      } @else if (!order()) {
        @if (appointmentStatus() === 'IN_PROGRESS') {
          <button
            type="button"
            (click)="createDraft()"
            class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
          >
            Create Prescription
          </button>
        } @else {
          <p class="mt-4 text-slate-600">
            Prescription entry is available while the appointment is in progress.
          </p>
        }
      } @else if (order(); as o) {
        @if (o.status === 'DRAFT') {
          <p class="mt-4 rounded-xl bg-amber-50 p-4 font-semibold">
            You have an unfinished prescription. Issue or cancel it before completing this
            appointment.
          </p>
          <form [formGroup]="form" (ngSubmit)="save()" class="mt-5 grid gap-4">
            <label class="font-bold"
              >Clinical note <span class="font-normal">(optional)</span
              ><textarea
                formControlName="clinicalNote"
                maxlength="4000"
                class="mt-2 block w-full rounded-xl border p-3"
              ></textarea></label
            ><label class="font-bold"
              >Prescription notes <span class="font-normal">(optional)</span
              ><textarea
                formControlName="notes"
                maxlength="4000"
                class="mt-2 block w-full rounded-xl border p-3"
              ></textarea>
            </label>
            <div formArrayName="items" class="grid gap-4">
              @for (row of items.controls; track $index) {
                <fieldset [formGroupName]="$index" class="rounded-xl border p-4">
                  <div class="flex justify-between">
                    <legend class="font-bold">Medication {{ $index + 1 }}</legend>
                    @if (items.length > 1) {
                      <button
                        type="button"
                        (click)="items.removeAt($index)"
                        class="font-bold text-red-700 underline"
                      >
                        Remove
                      </button>
                    }
                  </div>
                  <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    @for (f of fields; track f.name) {
                      <label class="font-semibold"
                        >{{ f.label }}{{ f.required ? ' *' : ''
                        }}<input
                          [formControlName]="f.name"
                          [attr.maxlength]="f.max"
                          class="mt-1 min-h-11 w-full rounded-lg border px-3"
                      /></label>
                    }
                  </div>
                </fieldset>
              }
            </div>
            <button
              type="button"
              (click)="addItem()"
              class="justify-self-start font-bold text-brand-700 underline"
            >
              Add medication
            </button>
            @if (mutationError()) {
              <p role="alert" class="rounded-xl bg-red-50 p-4">{{ mutationError() }}</p>
            }
            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                [disabled]="pending() || form.invalid"
                class="rounded-xl border px-5 py-3 font-bold"
              >
                Save draft</button
              ><button
                type="button"
                (click)="issueOpen.set(true)"
                [disabled]="pending() || form.invalid"
                class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >
                Issue Prescription</button
              ><button
                type="button"
                (click)="cancel()"
                [disabled]="pending()"
                class="rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
              >
                Cancel draft
              </button>
            </div>
          </form>
        } @else {
          <p class="mt-4 text-slate-600">Issued {{ o.issuedAt ? date(o.issuedAt) : '' }}</p>
            @if (o.cancellationReason) {
              <p class="mt-2 rounded-xl bg-red-50 p-4">Cancelled: {{ o.cancellationReason }}</p>
            }
            @if (o.status === 'ISSUED') {
              <button
                type="button"
                (click)="cancel()"
                [disabled]="pending()"
                class="mt-4 rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
              >
                Cancel prescription
              </button>
            }
          <div class="mt-5 overflow-x-auto">
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
          </div>
        }
      }
    </section>
    @if (issueOpen()) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
        <section role="alertdialog" class="w-full max-w-lg rounded-2xl bg-white p-6">
          <h2 class="text-xl font-bold">Issue prescription?</h2>
          <p class="mt-2">Once issued, this prescription can no longer be edited.</p>
          <div class="mt-5 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-xl border px-4 py-3 font-bold"
              (click)="issueOpen.set(false)"
            >
              Keep draft</button
            ><button
              type="button"
              class="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white"
              (click)="issue()"
            >
              Issue Prescription
            </button>
          </div>
        </section>
      </div>
    }`,
})
export class ProviderPrescriptionSectionComponent {
  readonly appointmentReference = input.required<string>();
  readonly appointmentStatus = input.required<string>();
  private readonly api = inject(PharmacyFulfillmentApiService);
  private readonly fb = inject(FormBuilder);
  readonly order = signal<ClinicalOrder | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pending = signal(false);
  readonly mutationError = signal<string | null>(null);
  readonly issueOpen = signal(false);
  readonly fields = [
    { name: 'medicationName', label: 'Medication name', required: true, max: 200 },
    { name: 'strength', label: 'Strength', required: false, max: 120 },
    { name: 'dosage', label: 'Dosage', required: true, max: 200 },
    { name: 'frequency', label: 'Frequency', required: true, max: 200 },
    { name: 'duration', label: 'Duration', required: false, max: 120 },
    { name: 'quantity', label: 'Quantity', required: false, max: 120 },
    { name: 'route', label: 'Route', required: false, max: 120 },
    { name: 'instructions', label: 'Instructions', required: false, max: 2000 },
  ] as const;
  readonly form = this.fb.group({
    clinicalNote: ['', [Validators.maxLength(4000)]],
    notes: ['', [Validators.maxLength(4000)]],
    items: this.fb.array([this.itemGroup()]),
  });
  get items() {
    return this.form.controls.items;
  }
  constructor() {
    effect(() => {
      this.appointmentReference();
      this.load();
    });
  }
  private itemGroup() {
    return this.fb.group({
      medicationName: ['', [Validators.required, Validators.maxLength(200)]],
      strength: ['', [Validators.maxLength(120)]],
      dosage: ['', [Validators.required, Validators.maxLength(200)]],
      frequency: ['', [Validators.required, Validators.maxLength(200)]],
      duration: ['', [Validators.maxLength(120)]],
      quantity: ['', [Validators.maxLength(120)]],
      route: ['', [Validators.maxLength(120)]],
      instructions: ['', [Validators.maxLength(2000)]],
    });
  }
  addItem() {
    this.items.push(this.itemGroup());
  }
  load() {
    const ref = this.appointmentReference();
    if (!ref) return;
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listAppointmentOrders(ref)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => {
          const o = p.items.find((x) => x.type === 'PRESCRIPTION') ?? null;
          this.order.set(o);
          if (o) this.populate(o);
        },
        error: () => this.error.set('Prescription could not be loaded.'),
      });
  }
  private populate(o: ClinicalOrder) {
    this.items.clear();
    for (const i of o.prescription?.items ?? []) this.items.push(this.itemGroup());
    if (!this.items.length) this.addItem();
    this.form.patchValue({
      clinicalNote: o.clinicalNote ?? '',
      notes: o.prescription?.notes ?? '',
      items: (o.prescription?.items ?? []).map((i) => ({
        ...i,
        strength: i.strength ?? '',
        duration: i.duration ?? '',
        quantity: i.quantity ?? '',
        route: i.route ?? '',
        instructions: i.instructions ?? '',
      })),
    });
  }
  private body(): UpsertPrescriptionRequest {
    const v = this.form.getRawValue();
    return {
      clinicalNote: v.clinicalNote?.trim() || null,
      notes: v.notes?.trim() || null,
      items: v.items.map((i) => ({
        medicationName: i.medicationName!.trim(),
        strength: i.strength?.trim() || null,
        dosage: i.dosage!.trim(),
        frequency: i.frequency!.trim(),
        duration: i.duration?.trim() || null,
        quantity: i.quantity?.trim() || null,
        route: i.route?.trim() || null,
        instructions: i.instructions?.trim() || null,
      })),
    };
  }
  createDraft() {
    this.mutate(this.api.createPrescription(this.appointmentReference(), this.body()));
  }
  save() {
    if (this.form.invalid) return;
    const o = this.order();
    this.mutate(
      o
        ? this.api.updatePrescription(o.reference, this.body())
        : this.api.createPrescription(this.appointmentReference(), this.body()),
    );
  }
  issue() {
    if (this.form.invalid) return;
    const o = this.order();
    if (!o) return;
    this.pending.set(true);
    this.api.updatePrescription(o.reference, this.body()).subscribe({
      next: () =>
        this.api
          .issuePrescription(o.reference)
          .pipe(finalize(() => this.pending.set(false)))
          .subscribe({
            next: (x) => {
              this.order.set(x);
              this.issueOpen.set(false);
            },
            error: () =>
              this.mutationError.set(
                'Prescription could not be issued. Review the fields and try again.',
              ),
          }),
      error: () => {
        this.pending.set(false);
        this.mutationError.set('Prescription draft could not be saved.');
      },
    });
  }
  cancel() {
    const o = this.order();
    if (o && confirm(`Cancel this ${o.status === 'DRAFT' ? 'draft ' : ''}prescription?`))
      this.mutate(this.api.cancelPrescription(o.reference));
  }
  private mutate(obs: any) {
    this.pending.set(true);
    this.mutationError.set(null);
    obs.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: (x: ClinicalOrder) => {
        this.order.set(x);
        this.populate(x);
      },
      error: () => this.mutationError.set('Prescription could not be saved. Please try again.'),
    });
  }
  date(v: string) {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(v),
    );
  }
}
