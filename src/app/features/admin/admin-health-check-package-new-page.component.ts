import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CreateAdminHealthCheckPackageRequest } from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';

function requiredTrimmed(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}

@Component({
  selector: 'app-admin-health-check-package-new-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
      <a routerLink="/admin/health-checks/packages" class="font-bold text-brand-700 underline"
        >Back to packages</a
      >
      <header class="mt-5">
        <p class="text-sm font-bold uppercase tracking-wider text-brand-700">Health Checks</p>
        <h1 class="mt-2 text-3xl font-bold text-brand-950">New Health Check package</h1>
        <p class="mt-2 text-slate-600">
          New packages start inactive. After creation, configure included clinical contents and
          optional add-ons, then activate the package from its detail page.
        </p>
      </header>

      @if (error()) {
        <p role="alert" class="mt-6 rounded-xl bg-red-50 p-4 text-red-900">{{ error() }}</p>
      }

      <form
        [formGroup]="form"
        (ngSubmit)="create()"
        class="mt-6 grid gap-5 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-7"
      >
        <label class="grid gap-2 font-bold">
          Package name *
          <input
            formControlName="name"
            placeholder="Executive Health Check"
            class="rounded-xl border p-3 font-normal"
          />
          @if (form.controls.name.touched && form.controls.name.invalid) {
            <small class="font-normal text-red-700"
              >Enter a package name of up to 160 characters.</small
            >
          }
        </label>

        <label class="grid gap-2 font-bold">
          Code *
          <input
            formControlName="code"
            (input)="normalizeCode()"
            placeholder="EXECUTIVE"
            autocomplete="off"
            class="rounded-xl border p-3 font-mono font-normal uppercase"
          />
          <small class="font-normal text-slate-600">
            Use an uppercase code such as EXECUTIVE or CORPORATE_WELLNESS. The code cannot be
            changed after the package is created.
          </small>
          @if (form.controls.code.touched && form.controls.code.invalid) {
            <small class="font-normal text-red-700">
              Use 2–80 uppercase letters, numbers or underscores, beginning with a letter.
            </small>
          }
        </label>

        <label class="grid gap-2 font-bold">
          Description
          <textarea
            formControlName="description"
            rows="4"
            placeholder="Describe who this Health Check is for and what it offers."
            class="rounded-xl border p-3 font-normal"
          ></textarea>
        </label>

        <label class="grid gap-2 font-bold">
          Estimated duration (minutes)
          <input
            type="number"
            min="1"
            max="1440"
            formControlName="estimatedDurationMinutes"
            placeholder="e.g. 60"
            class="rounded-xl border p-3 font-normal"
          />
          @if (
            form.controls.estimatedDurationMinutes.touched &&
            form.controls.estimatedDurationMinutes.invalid
          ) {
            <small class="font-normal text-red-700">Enter a whole number from 1 to 1440.</small>
          }
        </label>

        <fieldset class="grid gap-3" formArrayName="benefits">
          <legend class="font-bold">Benefits</legend>
          @for (benefit of benefits.controls; track $index) {
            <div class="flex items-start gap-2">
              <label class="grid min-w-0 flex-1 gap-2 font-bold">
                <span class="sr-only">Benefit {{ $index + 1 }}</span>
                <input
                  [formControlName]="$index"
                  placeholder="Broader preventive health screening"
                  class="w-full rounded-xl border p-3 font-normal"
                />
                @if (benefit.touched && benefit.hasError('maxlength')) {
                  <small class="font-normal text-red-700"
                    >Benefits may contain up to 240 characters.</small
                  >
                }
              </label>
              <button
                type="button"
                (click)="removeBenefit($index)"
                class="min-h-11 rounded-xl border px-3 font-bold"
                [attr.aria-label]="'Remove benefit ' + ($index + 1)"
              >
                Remove
              </button>
            </div>
          }
          <button
            type="button"
            (click)="addBenefit()"
            class="min-h-11 justify-self-start rounded-xl border px-4 font-bold"
          >
            + Add benefit
          </button>
        </fieldset>

        <div class="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50"
          >
            {{ submitting() ? 'Creating package…' : 'Create package' }}
          </button>
          <a
            routerLink="/admin/health-checks/packages"
            class="min-h-11 px-3 py-3 font-bold underline"
            >Cancel</a
          >
        </div>
      </form>
    </main>
  `,
})
export class AdminHealthCheckPackageNewPageComponent {
  private readonly api = inject(AdminHealthCheckCatalogueApiService);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [requiredTrimmed, Validators.maxLength(160)],
    }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(80),
        Validators.pattern(/^[A-Z][A-Z0-9_]{1,79}$/),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4000),
    }),
    estimatedDurationMinutes: new FormControl<number | null>(null, {
      validators: [Validators.min(1), Validators.max(1440), Validators.pattern(/^\d+$/)],
    }),
    benefits: new FormArray<FormControl<string>>([]),
  });

  get benefits(): FormArray<FormControl<string>> {
    return this.form.controls.benefits;
  }

  normalizeCode(): void {
    const control = this.form.controls.code;
    const normalized = control.value.trim().toUpperCase();
    if (normalized !== control.value) control.setValue(normalized, { emitEvent: false });
  }

  addBenefit(): void {
    this.benefits.push(
      new FormControl('', { nonNullable: true, validators: Validators.maxLength(240) }),
    );
  }

  removeBenefit(index: number): void {
    this.benefits.removeAt(index);
  }

  create(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request: CreateAdminHealthCheckPackageRequest = {
      code: value.code.trim().toUpperCase(),
      name: value.name.trim(),
      ...(value.description.trim() ? { description: value.description.trim() } : {}),
      benefits: value.benefits.map((benefit) => benefit.trim()).filter(Boolean),
      estimatedDurationMinutes: value.estimatedDurationMinutes,
    };
    this.submitting.set(true);
    this.error.set('');
    this.api
      .createPackage(request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) =>
          void this.router.navigate(['/admin/health-checks/packages', created.code]),
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.error.set(
            (error.status === 400 || error.status === 409) && typeof message === 'string'
              ? message
              : 'We could not create this Health Check package. Try again.',
          );
        },
      });
  }
}
