import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';

@Component({
  selector: 'app-package-selection-page',
  templateUrl: './package-selection-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackageSelectionPageComponent {
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly packages = signal<HealthCheckPackage[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadPackages();
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
