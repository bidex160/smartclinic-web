import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { BookingFlowStateService } from '../booking/booking-flow-state.service';
import { BookingProgressComponent } from '../booking/booking-progress.component';

@Component({
  selector: 'app-package-selection-page',
  imports: [BookingProgressComponent],
  templateUrl: './package-selection-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackageSelectionPageComponent {
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly bookingFlow = inject(BookingFlowStateService);

  readonly loading = signal(false);
  readonly packages = signal<HealthCheckPackage[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadPackages();
  }

  selectPackage(healthCheckPackage: HealthCheckPackage): void {
    this.bookingFlow.selectPackage(healthCheckPackage);
    void this.router.navigate(['/book/fulfilment']);
  }

  loadPackages(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.packagesApi
      .getPackages()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (packages) => this.packages.set(packages),
        error: (error: HttpErrorResponse) => this.error.set(this.getErrorMessage(error)),
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    return error.status === 0
      ? 'We could not reach SmartClinic. Check your connection and try again.'
      : 'We could not load the health check packages right now. Please try again.';
  }
}
