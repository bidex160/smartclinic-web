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

  readonly faqs = [
    {
      question: 'What is SmartClinic?',
      answer:
        'SmartClinic is a personal health companion. It helps you stay well every day, find care when you need it, connect with participating providers and keep your health records together.',
    },
    {
      question: 'How do Health Checks work?',
      answer:
        'Choose an available package, review eligible provider and fulfilment options, then confirm your booking using the current quoted price.',
    },
    {
      question: 'Can I use SmartClinic from home?',
      answer:
        'You can begin with a Guided Self-Check from home. Home visits are also shown when a selected provider supports that fulfilment option.',
    },
    {
      question: 'How are providers selected?',
      answer:
        'Providers apply to the SmartClinic Network and are reviewed before eligible services are made available through the platform.',
    },
    {
      question: 'How do I access My SmartClinic?',
      answer:
        'Use Open My SmartClinic to sign in with the email address or phone number linked to your account.',
    },
    {
      question: 'How can I get help?',
      answer:
        'Sign in to review your current care activity. WhatsApp assistance will appear here when an authoritative support contact is configured.',
    },
  ] as const;

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
