import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { HealthCheckCataloguePackage } from '../../core/models/health-check-package.model';
import { PUBLIC_SITE_CONFIG } from '../../core/config/public-site-config.token';
import { AuthStateService } from '../../core/services/auth-state.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { formatMinor } from '../provider/care-money';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly catalogueApi = inject(HealthCheckPackagesApiService);
  private readonly authState = inject(AuthStateService);
  private readonly publicSiteConfig = inject(PUBLIC_SITE_CONFIG, { optional: true });

  readonly catalogue = signal<readonly HealthCheckCataloguePackage[]>([]);
  readonly catalogueLoading = signal(true);
  readonly catalogueError = signal(false);
  readonly mySmartClinicRoute = computed(() =>
    this.authState.isPatient() ? '/me/dashboard' : '/login',
  );
  readonly healthJourneyRoute = computed(() =>
    this.authState.isPatient() ? '/me/health-journey' : '/login',
  );
    readonly healthJourneyQueryParams = computed(() =>
    this.authState.isPatient() ? null : { returnUrl: '/me/health-journey' },
  );
    readonly requestCareRoute = computed(() =>
    this.authState.isPatient() ? '/me/request-care' : '/login',
  );
  readonly requestCareQueryParams = computed(() =>
    this.authState.isPatient() ? null : { returnUrl: '/me/request-care' },
  );
  readonly myHospitalRoute = computed(() =>
    this.authState.isPatient() ? '/me/providers/connect' : '/login',
  );
  readonly myHospitalQueryParams = computed(() =>
    this.authState.isPatient() ? null : { returnUrl: '/me/providers/connect' },
  );
  readonly healthCheckRoute = computed(() =>
    this.authState.isPatient() ? '/health-check/packages' : '/login',
  );

  readonly whatsappUrl = this.publicSiteConfig?.whatsappUrl?.trim() || null;

  constructor() {
    this.loadCatalogue();
  }

  loadCatalogue(): void {
    this.catalogueLoading.set(true);
    this.catalogueError.set(false);
    this.catalogueApi
      .getCatalogue()
      .pipe(finalize(() => this.catalogueLoading.set(false)))
      .subscribe({
        next: (items) =>
          this.catalogue.set(
            items
              .filter(
                (item) => item.isActive && (item.code === 'ESSENTIAL' || item.code === 'COMPLETE'),
              )
              .sort((a, b) => this.packageOrder(a.code) - this.packageOrder(b.code)),
          ),
        error: () => this.catalogueError.set(true),
      });
  }

  money(amountMinor: number, currency: string): string {
    return formatMinor(amountMinor, currency);
  }

  healthCheckQueryParams(packageCode: string): Record<string, string> {
    return this.authState.isPatient()
      ? { package: packageCode }
      : { returnUrl: `/health-check/packages?package=${packageCode}` };
  }

  private packageOrder(code: string): number {
    return code === 'ESSENTIAL' ? 0 : 1;
  }
}
