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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminClinicalContentPage,
  CreateAdminClinicalContentRequest,
  HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES,
  HealthCheckClinicalResultType,
  isHealthCheckClinicalContentCategory,
} from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';

@Component({
  selector: 'app-admin-health-check-clinical-contents-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase tracking-wider text-brand-700">Health Checks</p>
        <h1 class="mt-2 text-3xl font-bold">Clinical Contents</h1>
        <p class="mt-2 max-w-3xl text-slate-600">
          Manage the canonical clinical and service contents used by SmartClinic Health Check
          packages.
        </p>
      </div>
      <button
        type="button"
        (click)="creating.set(!creating())"
        class="min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white"
      >
        New clinical content
      </button>
    </header>
    @if (creating()) {
      <form
        [formGroup]="createForm"
        (ngSubmit)="create()"
        class="mt-6 grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:grid-cols-2"
      >
        <h2 class="text-xl font-bold sm:col-span-2">New clinical content</h2>
        <label class="grid gap-2 font-bold"
          >Clinical content code<input
            formControlName="code"
            placeholder="e.g. CLINICIAN_CONSULTATION"
            autocomplete="off"
            class="rounded-xl border p-3 font-normal"
          /><small class="font-normal text-slate-600"
            >Use uppercase letters, numbers and underscores. Codes cannot be changed after
            creation.</small
          ></label
        >
        <label class="grid gap-2 font-bold"
          >Clinical content name<input
            formControlName="name"
            placeholder="e.g. Clinician consultation"
            class="rounded-xl border p-3 font-normal"
        />
      <span class="text-sm font-normal">&nbsp;</span>  
      </label>
        <label class="grid gap-2 font-bold sm:col-span-2"
          >Description<textarea
            formControlName="description"
            placeholder="Describe what this Health Check content represents"
            rows="3"
            class="rounded-xl border p-3 font-normal"
          ></textarea>
        </label>
        <label for="clinical-content-category" class="grid gap-2 font-bold"
          >Category
          <select
            id="clinical-content-category"
            formControlName="category"
            class="rounded-xl border p-3 font-normal"
          >
            <option value="" disabled>Select category</option>
            @for (category of clinicalContentCategories; track category.value) {
              <option [value]="category.value">{{ category.label }}</option>
            }
          </select>
          <span class="text-sm font-normal">&nbsp;</span>
          </label
        >
        <label class="grid gap-2 font-bold"
          >Display order<input
            type="number"
            min="0"
            max="32767"
            formControlName="displayOrder"
            class="rounded-xl border p-3 font-normal"
          /><small class="font-normal text-slate-600"
            >Controls the canonical catalogue display order.</small
          ></label
        >
        <div class="rounded-xl bg-slate-50 p-4 sm:col-span-2">
          <strong>Result type: None</strong>
          <p class="mt-1 text-sm text-slate-600">
            New catalogue items are currently limited to non-measurement content until dynamic
            clinical result capture is enabled.
          </p>
        </div>
        <label class="flex items-center gap-3 font-bold"
          ><input type="checkbox" formControlName="isActive" /> Active after creation</label
        >
        <div class="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            [disabled]="createForm.invalid || mutating()"
            class="min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50"
          >
            {{ mutating() ? 'Creating…' : 'Create clinical content' }}</button
          ><button type="button" (click)="creating.set(false)" class="min-h-11 px-3 font-bold">
            Cancel
          </button>
        </div>
      </form>
    }
    <form
      [formGroup]="filters"
      (ngSubmit)="applyFilters()"
      class="mt-6 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-5"
    >
      <label class="grid gap-1 font-bold lg:col-span-2"
        >Search<input
          formControlName="search"
          placeholder="Search by code or name"
          class="rounded-xl border p-3 font-normal"
      /></label>
      <label class="grid gap-1 font-bold"
        >Status<select formControlName="isActive" class="rounded-xl border p-3 font-normal">
          <option value="">Select status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select></label
      >
      <label class="grid gap-1 font-bold"
        >Category
        <!-- <input
          formControlName="category"
          placeholder="Filter by exact category"
          class="rounded-xl border p-3 font-normal"
      /> -->
        <select
            id="category"
            formControlName="category"
            class="rounded-xl border p-3 font-normal"
          >
            <option value="" disabled>Select category</option>
            @for (category of clinicalContentCategories; track category.value) {
              <option [value]="category.value">{{ category.label }}</option>
            }
          </select>
      </label>
      <label class="grid gap-1 font-bold"
        >Result type<select formControlName="resultType" class="rounded-xl border p-3 font-normal">
          <option value="">Select result type</option>
          <option value="NONE">None</option>
          <option value="SINGLE_NUMERIC">Single numeric</option>
          <option value="BLOOD_PRESSURE">Blood pressure</option>
        </select></label
      >
      <div class="flex flex-wrap gap-2 lg:col-span-5">
        <button type="submit" class="min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white">
          Apply filters</button
        ><button type="button" (click)="clearFilters()" class="min-h-11 px-4 font-bold underline">
          Clear filters
        </button>
      </div>
    </form>
    @if (feedback()) {
      <p role="status" class="mt-4 rounded-xl bg-green-50 p-4 text-green-900">{{ feedback() }}</p>
    }
    @if (error()) {
      <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ error() }}</p>
    }
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl bg-white p-6">Loading clinical contents…</p>
    } @else if (page(); as result) {
      @if (result.items.length === 0) {
        <p class="mt-6 rounded-2xl bg-white p-6">
          {{
            hasFilters()
              ? 'No clinical contents match the current filters.'
              : 'No catalogue contents exist yet.'
          }}
        </p>
      } @else {
        <div class="mt-6 grid gap-3">
          @for (item of result.items; track item.reference) {
            <article
              class="grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-bold">{{ item.name }}</h2>
                  <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{{
                    item.isActive ? 'Active' : 'Inactive'
                  }}</span>
                </div>
                <p class="font-mono text-sm">{{ item.code }}</p>
                <p class="mt-2 text-sm text-slate-600">
                  {{ item.category }} · {{ resultTypeLabel(item.resultType) }} ·
                  {{ item.unit || 'No unit' }} · Order {{ item.displayOrder }}
                </p>
              </div>
              <a
                [routerLink]="['/admin/health-checks/clinical-contents', item.reference]"
                class="self-center font-bold text-brand-700 underline"
                >View and edit</a
              >
            </article>
          }
        </div>
        <nav aria-label="Clinical content pages" class="mt-5 flex items-center justify-between">
          <button
            type="button"
            (click)="goTo(result.page - 1)"
            [disabled]="result.page <= 1 || loading()"
            class="min-h-11 rounded-xl border px-4 font-bold disabled:opacity-50"
          >
            Previous</button
          ><span
            >Page {{ result.page }} of {{ result.totalPages || 1 }} · {{ result.total }} items</span
          ><button
            type="button"
            (click)="goTo(result.page + 1)"
            [disabled]="result.page >= result.totalPages || loading()"
            class="min-h-11 rounded-xl border px-4 font-bold disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      }
    }
  </main>`,
})
export class AdminHealthCheckClinicalContentsPageComponent {
  private readonly api = inject(AdminHealthCheckCatalogueApiService);
  readonly page = signal<AdminClinicalContentPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly feedback = signal('');
  readonly mutating = signal(false);
  readonly creating = signal(false);
  readonly currentPage = signal(1);
  readonly clinicalContentCategories = HEALTH_CHECK_CLINICAL_CONTENT_CATEGORIES;
  private readonly supportedCategory = (control: AbstractControl): ValidationErrors | null =>
    isHealthCheckClinicalContentCategory(control.value) ? null : { unsupportedCategory: true };
  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    isActive: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
    resultType: new FormControl('', { nonNullable: true }),
  });
  readonly createForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]{1,79}$/)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(4000)],
    }),
    category: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.supportedCategory],
    }),
    displayOrder: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(32767)],
    }),
    isActive: new FormControl(true, { nonNullable: true }),
  });
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    const v = this.filters.getRawValue();
    this.api
      .listClinicalContents({
        page: this.currentPage(),
        limit: 25,
        search: v.search.trim() || undefined,
        category: v.category.trim() || undefined,
        isActive: v.isActive === '' ? undefined : v.isActive === 'true',
        resultType: (v.resultType || undefined) as HealthCheckClinicalResultType | undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (x) => this.page.set(x),
        error: () => this.error.set('We could not load clinical contents. Try again.'),
      });
  }
  applyFilters(): void {
    this.currentPage.set(1);
    this.load();
  }
  clearFilters(): void {
    this.filters.reset({ search: '', isActive: '', category: '', resultType: '' });
    this.applyFilters();
  }
  goTo(page: number): void {
    if (page < 1) return;
    this.currentPage.set(page);
    this.load();
  }
  hasFilters(): boolean {
    const v = this.filters.getRawValue();
    return Boolean(v.search || v.isActive || v.category || v.resultType);
  }
  create(): void {
    if (this.createForm.invalid || this.mutating()) return;
    this.mutating.set(true);
    this.error.set('');
    const v = this.createForm.getRawValue();
    const request: CreateAdminClinicalContentRequest = {
      code: v.code,
      name: v.name,
      description: v.description || null,
      category: v.category,
      resultType: 'NONE',
      unit: null,
      displayOrder: v.displayOrder,
      isActive: v.isActive,
    };
    this.api
      .createClinicalContent(request)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: () => {
          this.feedback.set('Clinical content created.');
          this.creating.set(false);
          this.createForm.reset({
            code: '',
            name: '',
            description: '',
            category: '',
            displayOrder: 0,
            isActive: true,
          });
          this.load();
        },
        error: (e: HttpErrorResponse) =>
          this.error.set(this.safeError(e, 'We could not create this clinical content.')),
      });
  }
  resultTypeLabel(value: string): string {
    return value
      .split('_')
      .map((x) => x[0] + x.slice(1).toLowerCase())
      .join(' ');
  }
  private safeError(error: HttpErrorResponse, fallback: string): string {
    const message = error.error?.message;
    return (error.status === 400 || error.status === 409) && typeof message === 'string'
      ? message
      : fallback;
  }
}
