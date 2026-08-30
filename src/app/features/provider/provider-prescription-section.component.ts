import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Observable,
  finalize,
  switchMap,
} from 'rxjs';

import {
  ClinicalOrder,
  UpsertPrescriptionRequest,
} from '../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';

@Component({
  selector: 'app-provider-prescription-section',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-6 rounded-2xl border bg-white p-6">
      <!-- Header -->
      <div class="flex flex-wrap justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold">Clinical orders</h2>
          <p class="mt-1 text-slate-600">Prescription</p>
        </div>

        @if (order(); as o) {
          <span class="font-bold">
            {{ o.status }}
          </span>
        } @else if (creatingPrescription()) {
          <span class="font-bold text-amber-700">
            NEW
          </span>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <p role="status" class="mt-4">
          Loading prescription…
        </p>
      }

      <!-- Error -->
      @else if (error()) {
        <p
          role="alert"
          class="mt-4 rounded-xl bg-red-50 p-4"
        >
          {{ error() }}

          <button
            type="button"
            class="font-bold underline"
            (click)="load()"
          >
            Try again
          </button>
        </p>
      }

      <!-- No prescription yet -->
      @else if (!order() && !creatingPrescription()) {
        @if (appointmentStatus() === 'IN_PROGRESS') {
          <div class="mt-4">
            <p class="text-slate-600">
              Create a prescription for this appointment.
            </p>

            <button
              type="button"
              (click)="startPrescription()"
              class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
            >
              Create Prescription
            </button>
          </div>
        } @else {
          <p class="mt-4 text-slate-600">
            Prescription entry is available while the appointment is in progress.
          </p>
        }
      }

      <!-- New local prescription OR existing backend draft -->
      @else if (creatingPrescription() || order()?.status === 'DRAFT') {
        @if (order()) {
          <p class="mt-4 rounded-xl bg-amber-50 p-4 font-semibold">
            You have an unfinished prescription.
            Issue or cancel it before completing this appointment.
          </p>
        } @else {
          <p class="mt-4 rounded-xl bg-blue-50 p-4 text-slate-700">
            Enter the prescription details below.
            Nothing will be saved until you click
            <strong>Save draft</strong>
            or
            <strong>Issue Prescription</strong>.
          </p>
        }

        <form
          [formGroup]="form"
          (ngSubmit)="save()"
          class="mt-5 grid gap-4"
        >
          <!-- Clinical note -->
          <label class="font-bold">
            Clinical note
            <span class="font-normal">
              (optional)
            </span>

            <textarea
              formControlName="clinicalNote"
              maxlength="4000"
              placeholder="Add relevant clinical context"
              class="mt-2 block w-full rounded-xl border p-3"
            ></textarea>
          </label>

          <!-- Prescription notes -->
          <label class="font-bold">
            Prescription notes
            <span class="font-normal">
              (optional)
            </span>

            <textarea
              formControlName="notes"
              maxlength="4000"
              placeholder="Add notes for the patient or pharmacy"
              class="mt-2 block w-full rounded-xl border p-3"
            ></textarea>
          </label>

          <!-- Medications -->
          <div
            formArrayName="items"
            class="grid gap-4"
          >
            @for (row of items.controls; track $index) {
              <fieldset
                [formGroupName]="$index"
                class="rounded-xl border p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <legend class="font-bold">
                    Medication {{ $index + 1 }}
                  </legend>

                  @if (items.length > 1) {
                    <button
                      type="button"
                      (click)="removeItem($index)"
                      class="font-bold text-red-700 underline"
                    >
                      Remove
                    </button>
                  }
                </div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                  @for (f of fields; track f.name) {
                    <label class="font-semibold">
                      {{ f.label }}

                      @if (f.required) {
                        <span class="text-red-600">*</span>
                      }

                      @if (f.name === 'instructions') {
                        <textarea
                          [formControlName]="f.name"
                          [attr.maxlength]="f.max"
                          [attr.placeholder]="f.placeholder"
                          rows="3"
                          class="mt-1 block w-full rounded-lg border px-3 py-2"
                        ></textarea>
                      } @else {
                        <input
                          type="text"
                          [formControlName]="f.name"
                          [attr.maxlength]="f.max"
                          [attr.placeholder]="f.placeholder"
                          class="mt-1 min-h-11 w-full rounded-lg border px-3"
                        />
                      }
                    </label>
                  }
                </div>
              </fieldset>
            }
          </div>

          <!-- Add medication -->
          <button
            type="button"
            (click)="addItem()"
            [disabled]="pending()"
            class="justify-self-start font-bold text-brand-700 underline disabled:opacity-50"
          >
            Add medication
          </button>

          <!-- Mutation error -->
          @if (mutationError()) {
            <p
              role="alert"
              class="rounded-xl bg-red-50 p-4 text-red-700"
            >
              {{ mutationError() }}
            </p>
          }

          <!-- Actions -->
          <div class="flex flex-wrap gap-3">
            <button
              type="submit"
              [disabled]="pending() || form.invalid"
              class="rounded-xl border px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (pending()) {
                Saving…
              } @else {
                Save draft
              }
            </button>

            <button
              type="button"
              (click)="openIssueConfirmation()"
              [disabled]="pending() || form.invalid"
              class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Issue Prescription
            </button>

            <button
              type="button"
              (click)="cancelPrescriptionEditing()"
              [disabled]="pending()"
              class="rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ order() ? 'Cancel draft' : 'Discard' }}
            </button>
          </div>
        </form>
      }

      <!-- Existing issued/cancelled prescription -->
      @else if (order(); as o) {
        <div class="mt-4">
          @if (o.status === 'ISSUED') {
            <p class="text-slate-600">
              Issued
              {{ o.issuedAt ? date(o.issuedAt) : '' }}
            </p>
          }

          @if (o.cancellationReason) {
            <p class="mt-2 rounded-xl bg-red-50 p-4">
              Cancelled:
              {{ o.cancellationReason }}
            </p>
          }

          @if (o.status === 'ISSUED') {
            <button
              type="button"
              (click)="cancel()"
              [disabled]="pending()"
              class="mt-4 rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700 disabled:opacity-50"
            >
              Cancel prescription
            </button>
          }
        </div>

        <!-- Prescription table -->
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
                    'Instructions'
                  ];
                  track h
                ) {
                  <th
                    class="border-b p-3 text-left text-xs uppercase"
                  >
                    {{ h }}
                  </th>
                }
              </tr>
            </thead>

            <tbody>
              @for (
                i of o.prescription?.items || [];
                track i.sortOrder
              ) {
                <tr>
                  <td class="p-3 font-bold">
                    {{ i.medicationName }}
                  </td>

                  <td class="p-3">
                    {{ i.strength || '—' }}
                  </td>

                  <td class="p-3">
                    {{ i.dosage }}
                  </td>

                  <td class="p-3">
                    {{ i.frequency }}
                  </td>

                  <td class="p-3">
                    {{ i.duration || '—' }}
                  </td>

                  <td class="p-3">
                    {{ i.quantity || '—' }}
                  </td>

                  <td class="p-3">
                    {{ i.route || '—' }}
                  </td>

                  <td class="p-3">
                    {{ i.instructions || '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <!-- Issue confirmation modal -->
    @if (issueOpen()) {
      <div
        class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      >
        <section
          role="alertdialog"
          aria-modal="true"
          class="w-full max-w-lg rounded-2xl bg-white p-6"
        >
          <h2 class="text-xl font-bold">
            Issue prescription?
          </h2>

          <p class="mt-2 text-slate-600">
            Once issued, this prescription can no longer be edited.
          </p>

          <div class="mt-5 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-xl border px-4 py-3 font-bold"
              [disabled]="pending()"
              (click)="issueOpen.set(false)"
            >
              Keep draft
            </button>

            <button
              type="button"
              class="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              [disabled]="pending()"
              (click)="issue()"
            >
              @if (pending()) {
                Issuing…
              } @else {
                Issue Prescription
              }
            </button>
          </div>
        </section>
      </div>
    }
  `,
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

  /**
   * Local-only state.
   *
   * true:
   * The doctor clicked "Create Prescription", but no prescription
   * has been persisted to the backend yet.
   *
   * false:
   * Either no creation is happening or a backend ClinicalOrder exists.
   */
  readonly creatingPrescription = signal(false);

  readonly fields = [
    {
      name: 'medicationName',
      label: 'Medication name',
      required: true,
      max: 200,
      placeholder: 'e.g. Amoxicillin',
    },
    {
      name: 'strength',
      label: 'Strength',
      required: false,
      max: 120,
      placeholder: 'e.g. 500 mg',
    },
    {
      name: 'dosage',
      label: 'Dosage',
      required: true,
      max: 200,
      placeholder: 'e.g. 1 capsule',
    },
    {
      name: 'frequency',
      label: 'Frequency',
      required: true,
      max: 200,
      placeholder: 'e.g. 3 times daily',
    },
    {
      name: 'duration',
      label: 'Duration',
      required: false,
      max: 120,
      placeholder: 'e.g. 7 days',
    },
    {
      name: 'quantity',
      label: 'Quantity',
      required: false,
      max: 120,
      placeholder: 'e.g. 21 capsules',
    },
    {
      name: 'route',
      label: 'Route',
      required: false,
      max: 120,
      placeholder: 'e.g. Oral',
    },
    {
      name: 'instructions',
      label: 'Instructions',
      required: false,
      max: 2000,
      placeholder: 'e.g. Take after meals',
    },
  ] as const;

  readonly form = this.fb.group({
    clinicalNote: [
      '',
      [Validators.maxLength(4000)],
    ],

    notes: [
      '',
      [Validators.maxLength(4000)],
    ],

    items: this.fb.array([
      this.itemGroup(),
    ]),
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
      medicationName: [
        '',
        [
          Validators.required,
          Validators.maxLength(200),
        ],
      ],

      strength: [
        '',
        [
          Validators.maxLength(120),
        ],
      ],

      dosage: [
        '',
        [
          Validators.required,
          Validators.maxLength(200),
        ],
      ],

      frequency: [
        '',
        [
          Validators.required,
          Validators.maxLength(200),
        ],
      ],

      duration: [
        '',
        [
          Validators.maxLength(120),
        ],
      ],

      quantity: [
        '',
        [
          Validators.maxLength(120),
        ],
      ],

      route: [
        '',
        [
          Validators.maxLength(120),
        ],
      ],

      instructions: [
        '',
        [
          Validators.maxLength(2000),
        ],
      ],
    });
  }

  addItem(): void {
    this.items.push(this.itemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length <= 1) {
      return;
    }

    this.items.removeAt(index);
  }

  /**
   * Load any existing prescription for the appointment.
   */
  load(): void {
    const ref = this.appointmentReference();

    if (!ref) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.mutationError.set(null);

    this.api
      .listAppointmentOrders(ref)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          const prescription =
            response.items.find(
              (item) => item.type === 'PRESCRIPTION',
            ) ?? null;

          this.order.set(prescription);

          if (prescription) {
            this.creatingPrescription.set(false);
            this.populate(prescription);
          }
        },

        error: () => {
          this.error.set(
            'Prescription could not be loaded.',
          );
        },
      });
  }

  /**
   * Clicking "Create Prescription" must NOT hit the backend.
   *
   * It simply opens an empty local form.
   */
  startPrescription(): void {
    if (this.appointmentStatus() !== 'IN_PROGRESS') {
      return;
    }

    this.mutationError.set(null);
    this.issueOpen.set(false);

    this.order.set(null);
    this.creatingPrescription.set(true);

    this.resetForm();
  }

  /**
   * Reset to one empty medication row.
   */
  private resetForm(): void {
    this.form.controls.clinicalNote.setValue('');
    this.form.controls.notes.setValue('');

    this.items.clear();
    this.items.push(this.itemGroup());

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  /**
   * Populate the editor from an existing backend order.
   */
  private populate(order: ClinicalOrder): void {
    this.items.clear();

    const prescriptionItems =
      order.prescription?.items ?? [];

    for (const item of prescriptionItems) {
      const group = this.itemGroup();

      group.patchValue({
        medicationName:
          item.medicationName ?? '',

        strength:
          item.strength ?? '',

        dosage:
          item.dosage ?? '',

        frequency:
          item.frequency ?? '',

        duration:
          item.duration ?? '',

        quantity:
          item.quantity ?? '',

        route:
          item.route ?? '',

        instructions:
          item.instructions ?? '',
      });

      this.items.push(group);
    }

    if (!this.items.length) {
      this.items.push(this.itemGroup());
    }

    this.form.controls.clinicalNote.setValue(
      order.clinicalNote ?? '',
    );

    this.form.controls.notes.setValue(
      order.prescription?.notes ?? '',
    );

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  /**
   * Create the exact request body expected by the backend.
   */
  private body(): UpsertPrescriptionRequest {
    const value = this.form.getRawValue();

    return {
      clinicalNote:
        value.clinicalNote?.trim() || null,

      notes:
        value.notes?.trim() || null,

      items: value.items.map((item) => ({
        medicationName:
          item.medicationName?.trim() ?? '',

        strength:
          item.strength?.trim() || null,

        dosage:
          item.dosage?.trim() ?? '',

        frequency:
          item.frequency?.trim() ?? '',

        duration:
          item.duration?.trim() || null,

        quantity:
          item.quantity?.trim() || null,

        route:
          item.route?.trim() || null,

        instructions:
          item.instructions?.trim() || null,
      })),
    };
  }

  /**
   * Save Draft behavior:
   *
   * No backend order:
   * POST create prescription.
   *
   * Existing DRAFT:
   * update existing prescription.
   */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentOrder = this.order();

    const request$ = currentOrder
      ? this.api.updatePrescription(
          currentOrder.reference,
          this.body(),
        )
      : this.api.createPrescription(
          this.appointmentReference(),
          this.body(),
        );

    this.mutate(request$);
  }

  /**
   * Validate before displaying the Issue confirmation.
   */
  openIssueConfirmation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.mutationError.set(null);
    this.issueOpen.set(true);
  }

  /**
   * Issue supports both:
   *
   * 1. Brand-new local prescription
   *    CREATE -> ISSUE
   *
   * 2. Existing DRAFT
   *    UPDATE -> ISSUE
   */
  issue(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.issueOpen.set(false);
      return;
    }

    if (this.pending()) {
      return;
    }

    const currentOrder = this.order();

    this.pending.set(true);
    this.mutationError.set(null);

    const save$ = currentOrder
      ? this.api.updatePrescription(
          currentOrder.reference,
          this.body(),
        )
      : this.api.createPrescription(
          this.appointmentReference(),
          this.body(),
        );

    save$
      .pipe(
        switchMap((savedOrder) =>
          this.api.issuePrescription(
            savedOrder.reference,
          ),
        ),

        finalize(() => {
          this.pending.set(false);
        }),
      )
      .subscribe({
        next: (issuedOrder) => {
          this.order.set(issuedOrder);
          this.creatingPrescription.set(false);
          this.issueOpen.set(false);

          this.populate(issuedOrder);
        },

        error: () => {
          this.issueOpen.set(false);

          this.mutationError.set(
            'Prescription could not be issued. Review the fields and try again.',
          );
        },
      });
  }

  /**
   * Discard local creation without calling the backend.
   *
   * If a backend DRAFT already exists, use the real cancel endpoint.
   */
  cancelPrescriptionEditing(): void {
    const currentOrder = this.order();

    if (!currentOrder) {
      const shouldDiscard = confirm(
        'Discard this prescription?',
      );

      if (!shouldDiscard) {
        return;
      }

      this.creatingPrescription.set(false);
      this.issueOpen.set(false);
      this.mutationError.set(null);

      this.resetForm();

      return;
    }

    this.cancel();
  }

  /**
   * Cancel an existing backend prescription.
   */
  cancel(): void {
    const currentOrder = this.order();

    if (!currentOrder) {
      return;
    }

    const message =
      currentOrder.status === 'DRAFT'
        ? 'Cancel this draft prescription?'
        : 'Cancel this prescription?';

    if (!confirm(message)) {
      return;
    }

    this.mutate(
      this.api.cancelPrescription(
        currentOrder.reference,
      ),
    );
  }

  /**
   * Shared mutation handler for save/cancel operations.
   */
  private mutate(
    request$: Observable<ClinicalOrder>,
  ): void {
    this.pending.set(true);
    this.mutationError.set(null);

    request$
      .pipe(
        finalize(() => {
          this.pending.set(false);
        }),
      )
      .subscribe({
        next: (updatedOrder) => {
          this.order.set(updatedOrder);
          this.creatingPrescription.set(false);

          this.populate(updatedOrder);
        },

        error: () => {
          this.mutationError.set(
            'Prescription could not be saved. Please try again.',
          );
        },
      });
  }

  date(value: string): string {
    return new Intl.DateTimeFormat(
      'en-NG',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    ).format(
      new Date(value),
    );
  }
}
