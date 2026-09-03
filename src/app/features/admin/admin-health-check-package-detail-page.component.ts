import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminHealthCheckPackageDetail,
  AdminPackageIncludedContent,
} from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';

@Component({
  selector: 'app-admin-health-check-package-detail-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
    <a routerLink="/admin/health-checks/packages" class="font-bold text-brand-700 underline"
      >← Packages</a
    >
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl bg-white p-6">Loading package…</p>
    } @else if (!pkg()) {
      <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6 text-red-900">
        <p>{{ error() || 'Package not found.' }}</p>
        <button type="button" (click)="load()" class="mt-3 font-bold underline">Try again</button>
      </div>
    } @else if (pkg(); as item) {
      <header class="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="font-mono text-sm text-slate-600">{{ item.code }}</p>
          <h1 class="text-3xl font-bold">{{ item.name }}</h1>
        </div>
        <button
          type="button"
          [disabled]="mutating()"
          (click)="togglePackage(item.isActive)"
          class="min-h-11 rounded-xl border px-5 font-bold disabled:opacity-50"
        >
          {{ item.isActive ? 'Deactivate package' : 'Activate package' }}
        </button>
      </header>
      @if (feedback()) {
        <p role="status" class="mt-4 rounded-xl bg-green-50 p-4 text-green-900">{{ feedback() }}</p>
      }
      @if (error()) {
        <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ error() }}</p>
      }

      <section class="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 class="text-xl font-bold">Package information</h2>
        <form
          [formGroup]="packageForm"
          (ngSubmit)="savePackage()"
          class="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <div>
            <span class="font-bold">Package code</span>
            <p class="mt-2 rounded-xl bg-slate-50 p-3 font-mono">{{ item.code }}</p>
            <small class="text-slate-600">Package codes are permanent and cannot be changed.</small>
          </div>
          <label class="grid gap-2 font-bold"
            >Package name<input
              formControlName="name"
              placeholder="e.g. Essential Health Check"
              class="rounded-xl border p-3 font-normal"
          /></label>
          <label class="grid gap-2 font-bold sm:col-span-2"
            >Package description<textarea
              formControlName="description"
              rows="3"
              placeholder="Describe the purpose and scope of this Health Check package"
              class="rounded-xl border p-3 font-normal"
            ></textarea>
          </label>
          <label class="grid gap-2 font-bold sm:col-span-2"
            >Benefits<textarea
              formControlName="benefits"
              rows="3"
              placeholder="e.g. Routine health monitoring and early risk identification"
              class="rounded-xl border p-3 font-normal"
            ></textarea
            ><small class="font-normal text-slate-600"
              >Enter one patient benefit per line.</small
            ></label
          >
          <label class="grid gap-2 font-bold"
            >Estimated duration<input
              type="number"
              min="1"
              max="1440"
              formControlName="estimatedDurationMinutes"
              class="rounded-xl border p-3 font-normal"
            /><small class="font-normal text-slate-600">Duration in minutes.</small></label
          >
          <p class="self-end text-sm text-slate-600">
            Inactive packages are not available for new Health Check configurations.
          </p>
          <button
            type="submit"
            [disabled]="packageForm.invalid || mutating()"
            class="min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50 sm:col-span-2"
          >
            Save package information
          </button>
        </form>
      </section>

      <section class="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 class="text-xl font-bold">Included contents</h2>
        <p class="mt-1 text-sm text-slate-600">
          Included contents are part of the package and should not also be active as optional
          add-ons.
        </p>
        <form
          [formGroup]="includedForm"
          (ngSubmit)="addIncluded()"
          class="mt-4 flex flex-wrap items-end gap-3"
        >
          <label class="grid min-w-64 flex-1 gap-2 font-bold"
            >Clinical content<select
              formControlName="reference"
              class="rounded-xl border p-3 font-normal"
            >
              <option value="">Select clinical content</option>
              @for (content of options(); track content.reference) {
                <option [value]="content.reference">{{ content.name }} ({{ content.code }})</option>
              }
            </select></label
          ><button
            type="submit"
            [disabled]="includedForm.invalid || mutating()"
            class="min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50"
          >
            Add included content
          </button>
        </form>
        <div class="mt-4 grid gap-3">
          @for (content of item.includedContents; track content.reference; let index = $index) {
            <article class="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto]">
              <div>
                <h3 class="font-bold">
                  {{ content.name }}
                  <span class="font-mono text-sm font-normal">{{ content.code }}</span>
                </h3>
                <p class="text-sm text-slate-600">
                  {{ content.category }} · {{ content.resultType }} ·
                  {{ content.unit || 'No unit' }} · Order {{ content.sortOrder }}
                </p>
                <p class="text-sm">
                  Relationship: {{ content.compositionActive ? 'Active' : 'Inactive' }} · Canonical
                  content: {{ content.canonicalContentActive ? 'Active' : 'Inactive' }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  (click)="move(content, -1)"
                  [disabled]="index === 0 || mutating()"
                  aria-label="Move up"
                  class="min-h-11 px-3 font-bold disabled:opacity-40"
                >
                  ↑</button
                ><button
                  type="button"
                  (click)="move(content, 1)"
                  [disabled]="index === item.includedContents.length - 1 || mutating()"
                  aria-label="Move down"
                  class="min-h-11 px-3 font-bold disabled:opacity-40"
                >
                  ↓</button
                ><button
                  type="button"
                  (click)="setIncluded(content.reference, !content.compositionActive)"
                  [disabled]="mutating()"
                  class="min-h-11 rounded-xl border px-3 font-bold"
                >
                  {{ content.compositionActive ? 'Deactivate' : 'Activate' }}
                </button>
              </div>
            </article>
          } @empty {
            <p class="rounded-xl bg-slate-50 p-4">No included contents.</p>
          }
        </div>
      </section>

      <section class="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 class="text-xl font-bold">Optional add-ons</h2>
        <p class="mt-1 text-sm text-slate-600">
          Approved add-ons can be offered and priced individually by eligible providers.
        </p>
        <p class="text-sm text-slate-600">
          Providers may offer and price this item only after SmartClinic approves it for this
          package.
        </p>
        <form
          [formGroup]="addonForm"
          (ngSubmit)="addAddon()"
          class="mt-4 flex flex-wrap items-end gap-3"
        >
          <label class="grid min-w-64 flex-1 gap-2 font-bold"
            >Clinical content<select
              formControlName="reference"
              class="rounded-xl border p-3 font-normal"
            >
              <option value="">Select clinical content</option>
              @for (content of options(); track content.reference) {
                <option [value]="content.reference">{{ content.name }} ({{ content.code }})</option>
              }
            </select></label
          ><button
            type="submit"
            [disabled]="addonForm.invalid || mutating()"
            class="min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50"
          >
            Add optional add-on
          </button>
        </form>
        <div class="mt-4 grid gap-3">
          @for (content of item.optionalAddons; track content.reference) {
            <article class="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto]">
              <div>
                <h3 class="font-bold">
                  {{ content.name }}
                  <span class="font-mono text-sm font-normal">{{ content.code }}</span>
                </h3>
                <p class="text-sm text-slate-600">
                  {{ content.category }} · {{ content.resultType }} ·
                  {{ content.unit || 'No unit' }}
                </p>
                <p class="text-sm">
                  Eligibility: {{ content.eligibilityActive ? 'Active' : 'Inactive' }} · Canonical
                  content: {{ content.canonicalContentActive ? 'Active' : 'Inactive' }}
                </p>
              </div>
              <button
                type="button"
                (click)="setAddon(content.reference, !content.eligibilityActive)"
                [disabled]="mutating()"
                class="min-h-11 rounded-xl border px-3 font-bold"
              >
                {{ content.eligibilityActive ? 'Deactivate' : 'Activate' }}
              </button>
            </article>
          } @empty {
            <p class="rounded-xl bg-slate-50 p-4">No optional add-ons.</p>
          }
        </div>
      </section>
    }
  </main>`,
})
export class AdminHealthCheckPackageDetailPageComponent {
  private readonly api = inject(AdminHealthCheckCatalogueApiService);
  private readonly code = inject(ActivatedRoute).snapshot.paramMap.get('code') ?? '';
  readonly pkg = signal<AdminHealthCheckPackageDetail | null>(null);
  readonly options = signal<readonly { reference: string; name: string; code: string }[]>([]);
  readonly loading = signal(true);
  readonly mutating = signal(false);
  readonly error = signal('');
  readonly feedback = signal('');
  readonly packageForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(4000)],
    }),
    benefits: new FormControl('', { nonNullable: true }),
    estimatedDurationMinutes: new FormControl<number | null>(null, [
      Validators.min(1),
      Validators.max(1440),
    ]),
  });
  readonly includedForm = new FormGroup({
    reference: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  readonly addonForm = new FormGroup({
    reference: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  constructor() {
    this.load();
    this.api
      .listClinicalContents({ isActive: true, page: 1, limit: 100 })
      .subscribe({
        next: (x) => this.options.set(x.items),
        error: () => this.error.set('The clinical-content selector could not be loaded.'),
      });
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .packageDetail(this.code)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (x) => this.accept(x),
        error: () => this.error.set('We could not load this Health Check package.'),
      });
  }
  savePackage(): void {
    if (this.packageForm.invalid || this.mutating()) return;
    const v = this.packageForm.getRawValue();
    this.mutate(
      this.api.updatePackage(this.code, {
        name: v.name,
        description: v.description || null,
        benefits: v.benefits
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean),
        estimatedDurationMinutes: v.estimatedDurationMinutes,
      }),
      'Package information saved.',
    );
  }
  togglePackage(active: boolean): void {
    if (
      !confirm(
        active
          ? 'Deactivate this package? Existing bookings are preserved.'
          : 'Activate this package for new Health Check configurations?',
      )
    )
      return;
    this.mutate(
      this.api.setPackageActive(this.code, !active),
      active ? 'Package deactivated.' : 'Package activated.',
    );
  }
  addIncluded(): void {
    if (this.includedForm.invalid || this.mutating()) return;
    this.mutate(
      this.api.addIncludedContent(this.code, this.includedForm.controls.reference.value),
      'Included content added.',
      () => this.includedForm.reset({ reference: '' }),
    );
  }
  setIncluded(reference: string, active: boolean): void {
    if (!active && !confirm('Deactivate this included-content relationship?')) return;
    this.mutate(
      this.api.setIncludedContentActive(this.code, reference, active),
      `Included content ${active ? 'activated' : 'deactivated'}.`,
    );
  }
  move(content: AdminPackageIncludedContent, direction: -1 | 1): void {
    const current = [...(this.pkg()?.includedContents ?? [])];
    const index = current.findIndex((x) => x.reference === content.reference);
    const target = index + direction;
    if (target < 0 || target >= current.length || this.mutating()) return;
    [current[index], current[target]] = [current[target], current[index]];
    this.mutate(
      this.api.reorderIncludedContents(this.code, {
        items: current.map((x, i) => ({ clinicalContentReference: x.reference, sortOrder: i })),
      }),
      'Included contents reordered.',
    );
  }
  addAddon(): void {
    if (this.addonForm.invalid || this.mutating()) return;
    this.mutate(
      this.api.addOptionalAddon(this.code, this.addonForm.controls.reference.value),
      'Optional add-on approved.',
      () => this.addonForm.reset({ reference: '' }),
    );
  }
  setAddon(reference: string, active: boolean): void {
    if (!active && !confirm('Deactivate this optional add-on eligibility?')) return;
    this.mutate(
      this.api.setOptionalAddonActive(this.code, reference, active),
      `Optional add-on ${active ? 'activated' : 'deactivated'}.`,
    );
  }
  private accept(value: AdminHealthCheckPackageDetail): void {
    this.pkg.set(value);
    this.packageForm.reset({
      name: value.name,
      description: value.description ?? '',
      benefits: value.benefits.join('\n'),
      estimatedDurationMinutes: value.estimatedDurationMinutes,
    });
  }
  private mutate(
    request: ReturnType<AdminHealthCheckCatalogueApiService['packageDetail']>,
    success: string,
    after?: () => void,
  ): void {
    if (this.mutating()) return;
    this.mutating.set(true);
    this.error.set('');
    this.feedback.set('');
    request.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: (x) => {
        this.accept(x);
        this.feedback.set(success);
        after?.();
      },
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
