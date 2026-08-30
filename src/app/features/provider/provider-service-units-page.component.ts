import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  ProviderServiceUnit,
  ProviderServiceUnitType,
} from '../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
@Component({
  selector: 'app-provider-service-units-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <div class="flex flex-wrap justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase text-brand-600">Provider setup</p>
        <h1 class="mt-2 text-3xl font-bold">Service Units</h1>
        <p class="mt-2 text-slate-600">
          Configure operational departments such as your pharmacy. Service Units are separate from
          Provider locations.
        </p>
      </div>
      <button (click)="open()" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">
        Add Service Unit
      </button>
    </div>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border p-6">Loading service units…</p>
    } @else if (error()) {
      <p role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        {{ error() }} <button (click)="load()" class="font-bold underline">Try again</button>
      </p>
    } @else if (!items().length) {
      <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
        <h2 class="text-xl font-bold">No service units configured.</h2>
      </section>
    } @else {
      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        @for (u of items(); track u.reference) {
          <article class="rounded-2xl border bg-white p-6">
            <div class="flex justify-between">
              <div>
                <h2 class="text-xl font-bold">{{ u.name }}</h2>
                <p>{{ u.code }} · {{ label(u.type) }}</p>
              </div>
              <span class="font-bold">{{ u.status }}</span>
            </div>
            @if (u.description) {
              <p class="mt-3 text-slate-600">{{ u.description }}</p>
            }
            <p class="mt-3">{{ u.location?.name || 'No specific location' }}</p>
            <div class="mt-4 flex gap-3">
              <button (click)="open(u)" class="font-bold text-brand-700 underline">Edit</button
              ><button (click)="toggle(u)" class="font-bold underline">
                {{ u.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </article>
        }
      </div>
    }
    @if (editor()) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
        <section
          role="dialog"
          class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6"
        >
          <h2 class="text-xl font-bold">{{ editing() ? 'Edit' : 'Add' }} Service Unit</h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="mt-5 grid gap-4">
            <label class="font-bold"
              >Name<input
                formControlName="name"
                maxlength="160"
                class="mt-1 block min-h-11 w-full rounded-lg border px-3" /></label
            ><label class="font-bold"
              >Code<input
                formControlName="code"
                maxlength="80"
                class="mt-1 block min-h-11 w-full rounded-lg border px-3"
              /><span class="text-sm font-normal text-slate-500"
                >Uppercase letters, numbers and underscores.</span
              ></label
            ><label class="font-bold"
              >Type<select
                formControlName="type"
                class="mt-1 block min-h-11 w-full rounded-lg border px-3"
              >
                @for (t of types; track t) {
                  <option [value]="t">{{ label(t) }}</option>
                }
              </select></label
            ><label class="font-bold"
              >Description <span class="font-normal">(optional)</span
              ><textarea
                formControlName="description"
                maxlength="4000"
                class="mt-1 block w-full rounded-lg border p-3"
              ></textarea>
            </label>
            @if (error()) {
              <p role="alert" class="rounded-xl bg-red-50 p-4">{{ error() }}</p>
            }
            <div class="flex justify-end gap-3">
              <button
                type="button"
                (click)="editor.set(false)"
                class="rounded-xl border px-5 py-3 font-bold"
              >
                Cancel</button
              ><button
                [disabled]="pending() || form.invalid"
                class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >
                Save Service Unit
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  </main>`,
})
export class ProviderServiceUnitsPageComponent {
  private api = inject(PharmacyFulfillmentApiService);
  private fb = inject(FormBuilder);
  readonly types: ProviderServiceUnitType[] = [
    'GENERAL',
    'PHARMACY',
    'LABORATORY',
    'RADIOLOGY',
    'PROCEDURE',
    'SPECIALIST',
    'OTHER',
  ];
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<readonly ProviderServiceUnit[]>([]);
  readonly editor = signal(false);
  readonly editing = signal<ProviderServiceUnit | null>(null);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]{1,79}$/)]],
    type: ['PHARMACY' as ProviderServiceUnitType, Validators.required],
    description: ['', [Validators.maxLength(4000)]],
  });
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listServiceUnits()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => this.items.set(p.items),
        error: () => this.error.set('Service Units could not be loaded.'),
      });
  }
  open(u: ProviderServiceUnit | null = null) {
    this.editing.set(u);
    this.form.reset({
      name: u?.name ?? '',
      code: u?.code ?? '',
      type: u?.type ?? 'PHARMACY',
      description: u?.description ?? '',
    });
    this.editor.set(true);
  }
  save() {
    if (this.form.invalid) return;
    this.pending.set(true);
    const v = this.form.getRawValue(),
      body = { ...v, description: v.description.trim() || null };
    const call = this.editing()
      ? this.api.updateServiceUnit(this.editing()!.reference, body)
      : this.api.createServiceUnit(body);
    call.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: () => {
        this.editor.set(false);
        this.load();
      },
      error: () => this.error.set('The Service Unit could not be saved.'),
    });
  }
  toggle(u: ProviderServiceUnit) {
    this.api
      .setServiceUnitActive(u.reference, u.status !== 'ACTIVE')
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('The Service Unit status could not be changed.'),
      });
  }
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (x) => x.toUpperCase());
  }
}
