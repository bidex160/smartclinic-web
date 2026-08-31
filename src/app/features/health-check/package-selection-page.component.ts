import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import {
  HealthCheckCataloguePackage,
  HealthCheckPackage,
} from '../../core/models/health-check-package.model';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { BookingFlowStateService } from '../booking/booking-flow-state.service';
import { BookingProgressComponent } from '../booking/booking-progress.component';
import { formatEarningMoney } from '../provider/provider-earning-presentation';

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
  private readonly route = inject(ActivatedRoute);
  private readonly bookingFlow = inject(BookingFlowStateService);

  readonly loading = signal(false);
  readonly packages = signal<readonly HealthCheckCataloguePackage[]>([]);
  readonly legacyPackages = signal<readonly HealthCheckPackage[]>([]);
  readonly preselectedCode = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly formatPrice = formatEarningMoney;

  constructor() {
    this.loadPackages();
  }

  selectPackage(cataloguePackage: HealthCheckCataloguePackage): void {
    const healthCheckPackage = this.legacyPackages().find(
      (item) => item.code === cataloguePackage.code,
    );
    if (!healthCheckPackage) {
      this.error.set(
        'This package cannot be booked right now. Refresh the catalogue and try again.',
      );
      return;
    }
    this.bookingFlow.selectPackage(healthCheckPackage);
    void this.router.navigate(['/book/fulfilment']);
  }

  loadPackages(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    forkJoin({ catalogue: this.packagesApi.getCatalogue(), legacy: this.packagesApi.getPackages() })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ catalogue, legacy }) => {
          const supported = catalogue.filter(
            (item) => item.code === 'ESSENTIAL' || item.code === 'COMPLETE',
          );
          this.packages.set(supported);
          this.legacyPackages.set(legacy);
          const requested = this.route.snapshot.queryParamMap.get('package');
          this.preselectedCode.set(
            requested && supported.some((item) => item.code === requested) ? requested : null,
          );
        },
        error: (error: HttpErrorResponse) => this.error.set(this.getErrorMessage(error)),
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    return error.status === 0
      ? 'We could not reach SmartClinic. Check your connection and try again.'
      : 'We could not load the health check packages right now. Please try again.';
  }
}
