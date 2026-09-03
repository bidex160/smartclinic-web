import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminClinicalContentDetail,
  HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES,
  isHealthCheckClinicalContentCategory,
} from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';

@Component({
  selector: 'app-admin-health-check-clinical-content-detail-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
    <a
      routerLink="/admin/health-checks/clinical-contents"
      class="font-bold text-brand-700 underline"
      >← Clinical contents</a
    >
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl bg-white p-6">Loading clinical content…</p>
    } @else if (!content()) {
      <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6 text-red-900">
        <p>{{ error() || 'Clinical content not found.' }}</p>
        <button type="button" (click)="load()" class="mt-3 font-bold underline">Try again</button>
      </div>
    } @else if (content(); as item) {
      <header class="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="font-mono text-sm">{{ item.reference }}</p>
          <h1 class="text-3xl font-bold">{{ item.name }}</h1>
        </div>
        <button
          type="button"
          [disabled]="mutating()"
          (click)="toggle(item.isActive)"
          class="min-h-11 rounded-xl border px-5 font-bold disabled:opacity-50"
        >
          {{ item.isActive ? 'Deactivate content' : 'Activate content' }}
        </button>
      </header>
      @if (feedback()) {
        <p role="status" class="mt-4 rounded-xl bg-green-50 p-4 text-green-900">{{ feedback() }}</p>
      }
      @if (error()) {
        <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ error() }}</p>
      }
      <section class="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 class="text-xl font-bold">Clinical content information</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span class="font-bold">Clinical content code</span>
            <p class="mt-2 rounded-xl bg-slate-50 p-3 font-mono">{{ item.code }}</p>
            <small class="text-slate-600">Codes cannot be changed after creation.</small>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class="font-bold">Result type</span>
              <p class="mt-2 rounded-xl bg-slate-50 p-3">{{ resultTypeLabel(item.resultType) }}</p>
            </div>
            <div>
              <span class="font-bold">Unit</span>
              <p class="mt-2 rounded-xl bg-slate-50 p-3">{{ item.unit || 'Not applicable' }}</p>
            </div>
            <small class="col-span-2 text-slate-600">Result type and unit are immutable.</small>
          </div>
          <label class="grid gap-2 font-bold"
            >Clinical content name<input
              formControlName="name"
              placeholder="e.g. Clinician consultation"
              class="rounded-xl border p-3 font-normal" /></label
          >
          <label for="clinical-content-category" class="grid gap-2 font-bold"
            >Category<select
              id="clinical-content-category"
              formControlName="category"
              class="rounded-xl border p-3 font-normal"
            >
              <option value="" disabled>Select category</option>
              @if (historicalCategory(); as category) {
                <option [value]="category" disabled>{{ category }} (historical)</option>
              }
              @for (category of clinicalContentCategories; track category.value) {
                <option [value]="category.value">{{ category.label }}</option>
              }
            </select></label>

          <label class="grid gap-2 font-bold sm:col-span-2"
            >Description<textarea
              formControlName="description"
              rows="3"
              placeholder="Describe what this Health Check content represents"
              class="rounded-xl border p-3 font-normal"
            ></textarea></label
          ><label class="grid gap-2 font-bold"
            >Display order<input
              type="number"
              min="0"
              max="32767"
              formControlName="displayOrder"
              class="rounded-xl border p-3 font-normal"
          /></label>
          <button
            type="submit"
            [disabled]="form.invalid || mutating()"
            class="min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50 sm:col-span-2"
          >
            Save clinical content
          </button>
        </form>
      </section>
      <section class="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 class="text-xl font-bold">Current usage</h2>
        <dl class="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt class="text-sm text-slate-600">Included in packages</dt>
            <dd class="text-2xl font-bold">{{ item.includedInPackages.length }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Optional for packages</dt>
            <dd class="text-2xl font-bold">{{ item.optionalForPackages.length }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Active provider offerings</dt>
            <dd class="text-2xl font-bold">{{ item.activeProviderOfferingCount }}</dd>
          </div>
        </dl>
        @if (item.includedInPackages.length) {
          <h3 class="mt-5 font-bold">Included in packages</h3>
          <ul class="mt-2 list-disc pl-6">
            @for (usage of item.includedInPackages; track usage.packageCode) {
              <li>
                {{ usage.packageName }} ({{ usage.packageCode }}) — order {{ usage.sortOrder }},
                {{ usage.isActive ? 'active' : 'inactive' }}
              </li>
            }
          </ul>
        }
        @if (item.optionalForPackages.length) {
          <h3 class="mt-5 font-bold">Optional for packages</h3>
          <ul class="mt-2 list-disc pl-6">
            @for (usage of item.optionalForPackages; track usage.packageCode) {
              <li>
                {{ usage.packageName }} ({{ usage.packageCode }}) —
                {{ usage.isActive ? 'active' : 'inactive' }}
              </li>
            }
          </ul>
        }
      </section>
    }
  </main>`,
})
export class AdminHealthCheckClinicalContentDetailPageComponent {
  private readonly api = inject(AdminHealthCheckCatalogueApiService);
  private readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly content = signal<AdminClinicalContentDetail | null>(null);
  readonly loading = signal(true);
  readonly mutating = signal(false);
  readonly error = signal('');
  readonly feedback = signal('');
  readonly clinicalContentCategories = HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES;
  private readonly supportedOrCurrentCategory = (
    control: AbstractControl,
  ): ValidationErrors | null =>
    isHealthCheckClinicalContentCategory(control.value) || control.value === this.content()?.category
      ? null
      : { unsupportedCategory: true };
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    description: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4000) }),
    category: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.supportedOrCurrentCategory],
    }),
    displayOrder: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(32767)],
    }),
  });
  constructor() {
    this.load();
  }
  load(success = ''): void {
    this.loading.set(!this.content());
    this.error.set('');
    this.api
      .clinicalContentDetail(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (x) => {
          this.content.set(x);
          this.form.reset({
            name: x.name,
            description: x.description ?? '',
            category: x.category,
            displayOrder: x.displayOrder,
          });
          this.feedback.set(success);
        },
        error: () => this.error.set('We could not load this clinical content.'),
      });
  }
  save(): void {
    if (this.form.invalid || this.mutating()) return;
    const v = this.form.getRawValue();
    this.mutate(
      this.api.updateClinicalContent(this.reference, {
        name: v.name,
        description: v.description || null,
        category: v.category,
        displayOrder: v.displayOrder,
      }),
      'Clinical content saved.',
    );
  }
  toggle(active: boolean): void {
    const message = active
      ? 'Deactivating this content prevents it from being used in new Health Check configurations. Existing bookings and historical results are preserved.'
      : 'Activate this content for new Health Check configurations?';
    if (!confirm(message)) return;
    this.mutate(
      this.api.setClinicalContentActive(this.reference, !active),
      active ? 'Clinical content deactivated.' : 'Clinical content activated.',
    );
  }
  historicalCategory(): string | null {
    const category = this.content()?.category;
    return category && !isHealthCheckClinicalContentCategory(category) ? category : null;
  }
  resultTypeLabel(value: AdminClinicalContentDetail['resultType']): string {
    if (value === 'SINGLE_NUMERIC') return 'Single numeric value';
    if (value === 'BLOOD_PRESSURE') return 'Blood pressure';
    return 'None';
  }
  private mutate(
    request: ReturnType<AdminHealthCheckCatalogueApiService['updateClinicalContent']>,
    success: string,
  ): void {
    this.mutating.set(true);
    this.error.set('');
    request
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: () => this.load(success),
        error: (e: HttpErrorResponse) =>
          this.error.set(this.safeError(e, 'The change could not be saved.')),
      });
  }
  private safeError(error: HttpErrorResponse, fallback: string): string {
    const message = error.error?.message;
    return (error.status === 400 || error.status === 409) && typeof message === 'string'
      ? message
      : fallback;
  }
}
