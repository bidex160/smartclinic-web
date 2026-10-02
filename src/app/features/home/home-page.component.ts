import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LocalePickerComponent } from '../../shared/components/locale-picker/locale-picker.component';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { HealthCheckCataloguePackage } from '../../core/models/health-check-package.model';
import { PUBLIC_SITE_CONFIG } from '../../core/config/public-site-config.token';
import { AuthStateService } from '../../core/services/auth-state.service';
import { TranslatePipe } from '../../core/services/translation.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { formatMinor } from '../provider/care-money';
import { useImageFallback } from '../../shared/image-fallback';

@Component({
  selector: 'app-home-page',
  imports: [LocalePickerComponent, RouterLink, TranslatePipe],
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
  readonly healthPassportRoute = computed(() =>
    this.authState.isPatient() ? '/me/health-passport' : '/login',
  );
  readonly healthPassportQueryParams = computed(() =>
    this.authState.isPatient() ? null : { returnUrl: '/me/health-passport' },
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
  readonly doctorQueryParams = computed(() =>
    this.authState.isPatient()
      ? { serviceCode: 'EMERGENCY_CONSULTATION', journey: 'doctor' }
      : { returnUrl: '/me/request-care?serviceCode=EMERGENCY_CONSULTATION&journey=doctor' },
  );
  readonly medicineRoute = computed(() =>
    this.authState.isPatient() ? '/me/prescriptions' : '/login',
  );
  readonly medicineQueryParams = computed(() =>
    this.authState.isPatient() ? null : { returnUrl: '/me/prescriptions' },
  );
  readonly testRoute = computed(() =>
    this.authState.isPatient() ? '/me/lab-tests' : '/login',
  );
  readonly testQueryParams = computed(() =>
    this.authState.isPatient() ? null : { returnUrl: '/me/lab-tests' },
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

  /** Translation keys; the text lives in i18n/<lang>/home.ts. */
  readonly faqs = [
    { question: 'home.faq.whatIsQuestion', answer: 'home.faq.whatIsAnswer' },
    { question: 'home.faq.healthChecksQuestion', answer: 'home.faq.healthChecksAnswer' },
    { question: 'home.faq.fromHomeQuestion', answer: 'home.faq.fromHomeAnswer' },
    { question: 'home.faq.providersQuestion', answer: 'home.faq.providersAnswer' },
    { question: 'home.faq.accessQuestion', answer: 'home.faq.accessAnswer' },
    { question: 'home.faq.helpQuestion', answer: 'home.faq.helpAnswer' },
  ] as const;

  readonly photoFallback = useImageFallback;

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
        next: (items) => this.catalogue.set(items.filter((item) => item.isActive)),
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
}
