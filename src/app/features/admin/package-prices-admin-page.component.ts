import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import {
  CreatePackagePriceRequest,
  PackagePrice,
  PackagePriceFilters,
} from '../../core/models/package-price.model';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { PackagePricesApiService } from '../../core/services/package-prices-api.service';

const AMOUNT_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

function validDateRange(control: AbstractControl): ValidationErrors | null {
  const from = control.get('effectiveFrom')?.value as string | undefined;
  const to = control.get('effectiveTo')?.value as string | undefined;
  return from && to && to <= from ? { dateOrder: true } : null;
}

function futureDate(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) return null;
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return control.value > todayValue ? null : { futureDate: true };
}

@Component({
  selector: 'app-package-prices-admin-page',
  imports: [ReactiveFormsModule],
  templateUrl: './package-prices-admin-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackagePricesAdminPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly pricesApi = inject(PackagePricesApiService);
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  private readonly modesApi = inject(FulfilmentModesApiService);
  private readonly router = inject(Router);

  readonly packages = signal<HealthCheckPackage[]>([]);
  readonly modes = signal<FulfilmentMode[]>([]);
  readonly prices = signal<PackagePrice[]>([]);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal<string | null>(null);
  readonly pendingDeactivateId = signal<string | null>(null);

  readonly filtersForm = this.formBuilder.group({
    healthCheckPackageId: [''],
    fulfilmentModeId: [''],
    activeState: this.formBuilder.control<'' | 'true' | 'false'>(''),
  });

  readonly createForm = this.createPriceForm(false);
  readonly scheduleForm = this.createPriceForm(true);

  constructor() {
    this.loadInitialData();
  }

  applyFilters(): void {
    this.loadPrices();
  }

  clearFilters(): void {
    this.filtersForm.reset({ healthCheckPackageId: '', fulfilmentModeId: '', activeState: '' });
    this.loadPrices();
  }

  createPrice(): void {
    this.runMutation(this.createForm, false);
  }

  schedulePrice(): void {
    this.runMutation(this.scheduleForm, true);
  }

  requestDeactivation(id: string): void {
    this.pendingDeactivateId.set(id);
    this.status.set(null);
  }

  cancelDeactivation(): void {
    this.pendingDeactivateId.set(null);
  }

  confirmDeactivation(id: string): void {
    if (this.mutating()) return;
    this.mutating.set(true);
    this.error.set(null);
    this.pricesApi
      .deactivatePackagePrice(id)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: () => {
          this.pendingDeactivateId.set(null);
          this.status.set('The package price was deactivated. Historical data was preserved.');
          this.loadPrices();
        },
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  packageName(id: string): string {
    return this.packages().find((item) => item.id === id)?.name ?? id;
  }

  modeName(id: string): string {
    return this.modes().find((item) => item.id === id)?.name ?? id;
  }

  private loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      packages: this.packagesApi.getPackages(),
      modes: this.modesApi.getFulfilmentModes(),
      prices: this.pricesApi.getPackagePrices(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ packages, modes, prices }) => {
          this.packages.set(packages);
          this.modes.set(modes);
          this.prices.set(prices);
        },
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  private loadPrices(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const value = this.filtersForm.getRawValue();
    const filters: PackagePriceFilters = {
      ...(value.healthCheckPackageId && { healthCheckPackageId: value.healthCheckPackageId }),
      ...(value.fulfilmentModeId && { fulfilmentModeId: value.fulfilmentModeId }),
      ...(value.activeState && { isActive: value.activeState === 'true' }),
    };
    this.pricesApi
      .getPackagePrices(filters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (prices) => this.prices.set(prices),
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  private createPriceForm(schedule: boolean) {
    return this.formBuilder.group(
      {
        healthCheckPackageId: ['', Validators.required],
        fulfilmentModeId: ['', Validators.required],
        amount: ['', [Validators.required, Validators.pattern(AMOUNT_PATTERN)]],
        currency: this.formBuilder.control<'NGN'>('NGN'),
        effectiveFrom: ['', schedule ? [Validators.required, futureDate] : Validators.required],
        effectiveTo: [''],
      },
      { validators: validDateRange },
    );
  }

  private runMutation(form: typeof this.createForm, schedule: boolean): void {
    this.status.set(null);
    this.error.set(null);
    if (form.invalid || this.mutating()) {
      form.markAllAsTouched();
      return;
    }
    this.mutating.set(true);
    const value = form.getRawValue();
    const request: CreatePackagePriceRequest = {
      healthCheckPackageId: value.healthCheckPackageId,
      fulfilmentModeId: value.fulfilmentModeId,
      amount: value.amount,
      currency: 'NGN',
      effectiveFrom: value.effectiveFrom,
      ...(value.effectiveTo && { effectiveTo: value.effectiveTo }),
    };
    const operation = schedule
      ? this.pricesApi.schedulePackagePrice(request)
      : this.pricesApi.createPackagePrice(request);
    operation.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: () => {
        this.status.set(
          schedule
            ? 'The future package price was scheduled and pricing history was preserved.'
            : 'The package price was created.',
        );
        form.reset({
          healthCheckPackageId: '',
          fulfilmentModeId: '',
          amount: '',
          currency: 'NGN',
          effectiveFrom: '',
          effectiveTo: '',
        });
        this.loadPrices();
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 403) {
      void this.router.navigate(['/admin/access-denied']);
      return;
    }
    const message: Record<number, string> = {
      400: 'Check the price details and dates, then try again.',
      404: 'That package price could not be found. Refresh the list and try again.',
      409: 'This price conflicts with an existing active or scheduled price.',
      422: 'This price cannot be applied under the current pricing policy.',
    };
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (message[error.status] ?? 'Pricing could not be updated right now. Please try again.'),
    );
  }
}
