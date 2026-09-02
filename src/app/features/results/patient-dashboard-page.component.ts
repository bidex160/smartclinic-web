import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PUBLIC_SITE_CONFIG } from '../../core/config/public-site-config.token';
import { HealthPassportOverview } from '../../core/models/health-passport.model';
import {
  PatientDashboard,
  PatientDashboardRecommendedAction,
  PatientDashboardRecommendedActionDetail,
} from '../../core/models/patient-dashboard.model';
import { PatientHealthCheckHistoryResponse } from '../../core/models/patient-health-check-history.model';
import { ReferralImpact } from '../../core/models/referral.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { HealthPassportApiService } from '../../core/services/health-passport-api.service';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { ReferralsApiService } from '../../core/services/referrals-api.service';

interface DashboardNextStep {
  readonly title: string;
  readonly message: string;
  readonly label: string;
  readonly route: string | string[];
}

@Component({
  selector: 'app-patient-dashboard-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
      @if (loading()) {
        <section role="status" aria-live="polite" class="animate-pulse space-y-4">
          <span class="sr-only">Loading your dashboard…</span>
          <div class="h-20 rounded-2xl bg-slate-200"></div>
          <div class="h-48 rounded-2xl bg-slate-200"></div>
        </section>
      } @else if (error()) {
        <section role="alert" class="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 class="text-2xl font-bold">Your dashboard is unavailable right now</h1>
          <p class="mt-2">Check your connection and try again.</p>
          <button
            type="button"
            (click)="load()"
            class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
          >
            Retry
          </button>
        </section>
      } @else if (dashboard(); as value) {
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-bold uppercase tracking-wider text-brand-700">Patient home</p>
            <h1 class="mt-1 text-2xl font-bold text-brand-950 sm:text-3xl">
              Welcome, {{ value.patient.firstName }}
            </h1>
            <p class="mt-1 text-sm text-slate-600">
              SmartClinic ID:
              <strong class="font-mono text-slate-900">{{ value.patient.patientReference }}</strong>
            </p>
          </div>
          <button
            type="button"
            (click)="copyPatientId()"
            class="min-h-11 rounded-xl border border-brand-200 px-4 text-sm font-bold text-brand-800 focus:ring-4 focus:ring-brand-200"
          >
            Copy ID
          </button>
          <p aria-live="polite" class="w-full text-sm font-semibold text-brand-700">
            {{ copyFeedback() }}
          </p>
        </header>

        <section
          class="mt-4 rounded-2xl bg-brand-900 p-5 text-white shadow-soft sm:p-6"
          aria-labelledby="next-step-heading"
        >
          <p class="text-sm font-bold uppercase tracking-wider text-brand-100">Your next step</p>
          <h2 id="next-step-heading" class="mt-1 text-2xl font-bold">
            {{ nextStep(value).title }}
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-brand-50 sm:text-base">
            {{ nextStep(value).message }}
          </p>
          <a
            [routerLink]="nextStep(value).route"
            class="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-5 font-bold text-brand-900 focus:ring-4 focus:ring-white/40"
            >{{ nextStep(value).label }} <span class="ml-2" aria-hidden="true">→</span></a
          >
        </section>

        <nav class="mt-4 grid grid-cols-3 gap-2" aria-label="Primary patient actions">
          <a
            routerLink="/me/health-journey"
            class="rounded-xl bg-white px-2 py-3 text-center text-sm font-bold text-brand-900 shadow-sm ring-1 ring-slate-200 focus:ring-4 focus:ring-brand-200 sm:text-base"
            >Stay Well</a
          >
          <a
            routerLink="/me/request-care"
            class="rounded-xl bg-white px-2 py-3 text-center text-sm font-bold text-brand-900 shadow-sm ring-1 ring-slate-200 focus:ring-4 focus:ring-brand-200 sm:text-base"
            >Find Care</a
          >
          <a
            routerLink="/me/providers/connect"
            class="rounded-xl bg-white px-2 py-3 text-center text-sm font-bold text-brand-900 shadow-sm ring-1 ring-slate-200 focus:ring-4 focus:ring-brand-200 sm:text-base"
            >My Hospital</a
          >
        </nav>

        <section class="mt-7" aria-labelledby="your-care-heading">
          <div class="flex items-end justify-between gap-3">
            <div>
              <h2 id="your-care-heading" class="text-2xl font-bold text-brand-950">Your Care</h2>
              <p class="mt-1 text-sm text-slate-600">Your current care connections and activity.</p>
            </div>
            <a routerLink="/me/care" class="font-bold text-brand-700 underline">View care</a>
          </div>
          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <article class="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <h3 class="font-bold">Hospital connection</h3>
              @if (value.setup.hasConnectedProvider) {
                <p class="mt-1 text-sm text-slate-600">You have a connected healthcare provider.</p>
                <a routerLink="/me/providers" class="mt-2 inline-block font-bold text-brand-700"
                  >View My Hospitals →</a
                >
              } @else if (value.setup.hasProviderConnection) {
                <p class="mt-1 text-sm text-slate-600">Your provider connection is in progress.</p>
                <a routerLink="/me/providers" class="mt-2 inline-block font-bold text-brand-700"
                  >View connection →</a
                >
              } @else {
                <p class="mt-1 text-sm text-slate-600">No hospital connected yet.</p>
                <a
                  routerLink="/me/providers/connect"
                  class="mt-2 inline-block font-bold text-brand-700"
                  >Choose My Hospital →</a
                >
              }
            </article>
            <article class="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <h3 class="font-bold">Care activity</h3>
              @if (value.setup.hasCareRequest) {
                <p class="mt-1 text-sm text-slate-600">You have care activity in My Care.</p>
                <a routerLink="/me/care" class="mt-2 inline-block font-bold text-brand-700"
                  >Open My Care →</a
                >
              } @else {
                <p class="mt-1 text-sm text-slate-600">No care request yet.</p>
                <a routerLink="/me/request-care" class="mt-2 inline-block font-bold text-brand-700"
                  >Find Care →</a
                >
              }
            </article>
          </div>
        </section>

        <section class="mt-7" aria-labelledby="health-check-summary-heading">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="health-check-summary-heading" class="text-2xl font-bold text-brand-950">
                Health Check summary
              </h2>
              <p class="mt-1 text-sm text-slate-600">Your preventive Health Check activity.</p>
            </div>
            <a routerLink="/me/health-checks" class="font-bold text-brand-700 underline"
              >View all</a
            >
          </div>
          @if (healthChecksLoading()) {
            <p role="status" class="mt-3 rounded-xl bg-white p-4">Loading your Health Checks…</p>
          } @else if (healthChecksError()) {
            <p role="alert" class="mt-3 rounded-xl bg-red-50 p-4">
              We couldn't load your Health Check summary.
              <button type="button" (click)="loadHealthChecks()" class="font-bold underline">
                Try again
              </button>
            </p>
          } @else {
            <div class="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              @for (item of healthCheckSummary(); track item.label) {
                <article
                  class="flex items-center justify-between gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-200"
                >
                  <p class="text-sm font-semibold text-slate-600">{{ item.label }}</p>
                  <p class="text-xl font-bold text-brand-900">{{ item.count }}</p>
                </article>
              }
            </div>
            @if (healthChecks()?.items?.length === 0) {
              <div
                class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 p-4"
              >
                <p>You haven't completed a Health Check yet.</p>
                <a routerLink="/me/health-journey" class="font-bold text-brand-700"
                  >Explore Health Checks →</a
                >
              </div>
            }
          }
        </section>

        <section
          class="mt-7 rounded-2xl bg-white p-5 ring-1 ring-slate-200"
          aria-labelledby="passport-heading"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="passport-heading" class="text-2xl font-bold text-brand-950">
                Smart Health Passport
              </h2>
              <p class="mt-1 text-sm text-slate-600">
                A concise view of your recorded health journey.
              </p>
            </div>
            <a
              routerLink="/me/health-passport"
              class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >Open Health Passport</a
            >
          </div>
          @if (passport(); as health) {
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              @if (health.currentNextAction; as action) {
                <div>
                  <p class="text-xs font-bold uppercase text-brand-700">Current action</p>
                  <p class="mt-1 font-bold">{{ action.title }}</p>
                </div>
              }
              @if (health.latestMeasurements[0]; as measurement) {
                <div>
                  <p class="text-xs font-bold uppercase text-brand-700">Latest measurement</p>
                  <p class="mt-1 font-bold">{{ measurementLabel(measurement.type) }}</p>
                  <p class="text-sm text-slate-600">
                    {{ provenanceLabel(measurement.provenance) }}
                  </p>
                </div>
              }
              @if (health.recentActivity[0]; as activity) {
                <div>
                  <p class="text-xs font-bold uppercase text-brand-700">Latest activity</p>
                  <p class="mt-1 font-bold">{{ activity.title }}</p>
                </div>
              }
            </div>
          }
        </section>

        <section class="mt-7 rounded-2xl bg-brand-50 p-5" aria-labelledby="impact-heading">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="impact-heading" class="text-2xl font-bold text-brand-950">
                Help someone access SmartClinic
              </h2>
              <p class="mt-1 max-w-2xl text-sm text-slate-600">
                Invite people or participating healthcare organisations and track your verified
                impact.
              </p>
            </div>
            <a routerLink="/me/impact" class="font-bold text-brand-700 underline">View Impact</a>
          </div>
          @if (referralsLoading()) {
            <p role="status" class="mt-4">Loading your impact…</p>
          } @else if (referralsError()) {
            <p role="alert" class="mt-4">
              We couldn't load your referral progress.
              <button type="button" (click)="loadReferrals()" class="font-bold underline">
                Try again
              </button>
            </p>
          } @else if (referrals(); as rewards) {
            <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <p class="text-xs text-slate-600">Available points</p>
                <p class="text-xl font-bold">{{ rewards.balances.availablePoints }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-600">Reserved points</p>
                <p class="text-xl font-bold">{{ rewards.balances.reservedPoints }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-600">Lifetime earned</p>
                <p class="text-xl font-bold">{{ rewards.balances.lifetimeEarnedPoints }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-600">Verified referrals</p>
                <p class="text-xl font-bold">{{ rewards.summary.qualifiedReferrals }}</p>
              </div>
              @if (rewards.leaderboard.optedIn) {
                <div>
                  <p class="text-xs text-slate-600">Leadership position</p>
                  <p class="text-xl font-bold">
                    {{ rewards.leaderboard.position === null ? 'Not ranked yet' : '#' + rewards.leaderboard.position }}
                  </p>
                </div>
              }
              <div>
                <p class="text-xs text-slate-600">Referral code</p>
                <p class="break-all font-mono font-bold">{{ rewards.referralCode }}</p>
              </div>
            </div>
            @if (rewards.levelProgress.nextLevel; as next) {
              <p class="mt-3 text-sm"><strong>Next achievement:</strong> {{ next.name }}</p>
            }
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                (click)="copyReferralCode()"
                class="min-h-11 rounded-xl bg-brand-700 px-4 font-bold text-white"
              >
                Copy referral code</button
              ><button
                type="button"
                (click)="copyReferralLink()"
                class="min-h-11 rounded-xl border border-brand-700 px-4 font-bold text-brand-800"
              >
                Copy invite link
              </button>
     @if (patientInviteUrl()) {
 <a
  [href]="whatsappReferralShareUrl()"
  target="_blank"
  rel="noopener noreferrer"
  class="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
>
  <svg
    class="h-5 w-5"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.371-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.625.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.99c-.003 5.45-4.437 9.889-9.885 9.889"
    />
  </svg>

  <span>Share on WhatsApp</span>
</a>
}
              <a
                routerLink="/me/referrals"
                class="inline-flex min-h-11 items-center px-2 font-bold text-brand-700 underline"
                >Referral activity</a
              >
            </div>
            <p aria-live="polite" class="mt-2 text-sm font-semibold text-brand-700">
              {{ referralFeedback() }}
            </p>
          }
        </section>

        @if (value.dashboardMode === 'GETTING_STARTED') {
          <section class="mt-7" aria-labelledby="getting-started-heading">
            <h2 id="getting-started-heading" class="text-xl font-bold text-brand-950">
              Getting started
            </h2>
            <ul class="mt-3 grid gap-2 sm:grid-cols-2">
              @for (step of checklist(value); track step.label) {
                <li class="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <span
                    aria-hidden="true"
                    class="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 font-bold"
                    >{{ step.complete ? '✓' : '○' }}</span
                  ><span
                    ><strong class="block text-sm">{{ step.label }}</strong
                    ><span class="text-xs text-slate-600">{{
                      step.complete ? 'Complete' : 'Not complete'
                    }}</span></span
                  >
                </li>
              }
            </ul>
          </section>
        }

        @if (supportWhatsappUrl) {
          <a
            [href]="supportWhatsappUrl"
            class="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 rounded-full bg-[#128c7e] px-5 py-3 font-bold text-white shadow-lg focus:ring-4 focus:ring-emerald-200 lg:bottom-4"
            >WhatsApp help</a
          >
        }
      }
    </main>
  `,
})
export class PatientDashboardPageComponent {
  private readonly api = inject(PatientDashboardApiService);
  private readonly healthChecksApi = inject(HealthCheckResultsApiService);
  private readonly referralsApi = inject(ReferralsApiService);
  private readonly passportApi = inject(HealthPassportApiService);
  private readonly publicSiteConfig = inject(PUBLIC_SITE_CONFIG, { optional: true });
  readonly dashboard = signal<PatientDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly healthChecks = signal<PatientHealthCheckHistoryResponse | null>(null);
  readonly healthChecksLoading = signal(false);
  readonly healthChecksError = signal(false);
  readonly referrals = signal<ReferralImpact | null>(null);
  readonly referralsLoading = signal(false);
  readonly referralsError = signal(false);
  readonly passport = signal<HealthPassportOverview | null>(null);
  readonly copyFeedback = signal('');
  readonly referralFeedback = signal('');
  readonly supportWhatsappUrl = this.publicSiteConfig?.whatsappUrl?.trim() || null;
  readonly healthCheckSummary = computed(() => {
    const items = this.healthChecks()?.items ?? [];
    const count = (category: string) =>
      items.filter((item) => item.portalCategory === category).length;
    return [
      { label: 'Awaiting payment', count: count('AWAITING_PAYMENT') },
      { label: 'Upcoming / active', count: count('UPCOMING_ACTIVE') },
      { label: 'Completed', count: count('COMPLETED_HISTORY') },
      { label: 'Needs attention', count: count('NEEDS_ATTENTION') },
    ];
  });

  constructor() {
    this.load();
    this.loadHealthChecks();
    this.loadReferrals();
    this.passportApi.overview().subscribe({ next: (value) => this.passport.set(value) });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .getDashboard()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (value) => this.dashboard.set(value), error: () => this.error.set(true) });
  }
  loadHealthChecks(): void {
    if (this.healthChecksLoading()) return;
    this.healthChecksLoading.set(true);
    this.healthChecksError.set(false);
    this.healthChecksApi
      .getMyHealthChecks({ page: 1, limit: 50 })
      .pipe(finalize(() => this.healthChecksLoading.set(false)))
      .subscribe({
        next: (value) => this.healthChecks.set(value),
        error: () => this.healthChecksError.set(true),
      });
  }
  loadReferrals(): void {
    if (this.referralsLoading()) return;
    this.referralsLoading.set(true);
    this.referralsError.set(false);
    this.referralsApi
      .getMyImpact()
      .pipe(finalize(() => this.referralsLoading.set(false)))
      .subscribe({
        next: (value) => this.referrals.set(value),
        error: () => this.referralsError.set(true),
      });
  }
  nextStep(value: PatientDashboard): DashboardNextStep {
    if (value.recommendedActionDetail) {
      return this.structuredNextStep(value.recommendedActionDetail);
    }

    return this.legacyNextStep(value.recommendedAction);
  }

  private structuredNextStep(
    detail: PatientDashboardRecommendedActionDetail,
  ): DashboardNextStep {
    const resource = detail.resource;
    const hasReference = Boolean(resource?.reference.trim());

    switch (detail.type) {
      case 'COMPLETE_PROFILE':
        return {
          title: 'Complete your profile',
          message: 'Finish your basic details so SmartClinic can support your care journey.',
          label: 'Complete Profile',
          route: '/me/profile',
        };
      case 'VIEW_APPOINTMENT':
        return {
          title: 'Your appointment is today',
          message: 'You have a scheduled care appointment today.',
          label: 'View Appointment',
          route:
            resource?.domain === 'CARE_APPOINTMENT' && hasReference
              ? ['/me/care/appointments', resource.reference]
              : '/me/care',
        };
      case 'COMPLETE_PAYMENT':
        return {
          title: 'Complete your payment',
          message: 'Finish the payment needed to continue this service.',
          label: 'Continue Payment',
          route: this.paymentContinuationRoute(resource),
        };
      case 'CONTINUE_SELF_CHECK':
        return {
          title: 'Continue your Self-Check',
          message: 'Pick up where you stopped and complete your health questions.',
          label: 'Continue Self-Check',
          route:
            resource?.domain === 'GUIDED_SELF_CHECK' && hasReference
              ? ['/me/self-checks', resource.reference]
              : '/me/self-checks',
        };
      case 'VIEW_HEALTH_CHECK':
        return {
          title: 'Your Health Check',
          message: 'You have an active Health Check to review.',
          label: 'View Health Check',
          route:
            resource?.domain === 'HEALTH_CHECK' && hasReference
              ? ['/me/health-checks', resource.reference]
              : '/me/health-checks',
        };
      case 'FIND_CARE':
        return {
          title: 'Continue finding care',
          message: 'Your care request needs your attention.',
          label: 'Continue',
          route:
            resource?.domain === 'CARE_REQUEST' && hasReference
              ? ['/me/care', resource.reference]
              : '/me/request-care',
        };
      case 'VIEW_PROVIDER_CONNECTION':
        return {
          title: 'Your hospital connection',
          message: 'Review or continue your hospital connection.',
          label: 'View Connection',
          route:
            resource?.domain === 'PROVIDER_CONNECTION' && hasReference
              ? ['/me/providers', resource.reference]
              : '/me/providers',
        };
      case 'NONE':
        return {
          title: 'Start with your health',
          message: 'Check in on your health and see what SmartClinic recommends for you.',
          label: 'Explore Stay Well',
          route: '/me/health-journey',
        };
      case 'CONNECT_PROVIDER':
        return this.legacyNextStep('CONNECT_PROVIDER');
    }
  }

  private paymentContinuationRoute(
    resource: PatientDashboardRecommendedActionDetail['resource'],
  ): string | string[] {
    if (!resource?.reference.trim()) return '/me/care';

    switch (resource.domain) {
      case 'GUIDED_SELF_CHECK':
        return ['/me/self-checks', resource.reference];
      case 'HEALTH_CHECK':
        return ['/me/health-checks', resource.reference];
      case 'CARE_REQUEST':
        return ['/me/care', resource.reference];
      case 'PROVIDER_CONNECTION':
        return ['/me/providers', resource.reference];
      case 'CARE_APPOINTMENT':
        return '/me/care';
      default:
        return '/me/care';
    }
  }

  private legacyNextStep(action: PatientDashboardRecommendedAction): DashboardNextStep {
    const actions: Record<PatientDashboardRecommendedAction, DashboardNextStep> = {
      COMPLETE_PROFILE: {
        title: 'Complete your profile',
        message: 'Add your basic details to finish setting up your SmartClinic account.',
        label: 'Complete profile',
        route: '/me/profile',
      },
      CONNECT_PROVIDER: {
        title: 'Connect your hospital',
        message:
          'Choose a hospital or healthcare provider and connect it to your SmartClinic account.',
        label: 'Choose My Hospital',
        route: '/me/providers/connect',
      },
      VIEW_PROVIDER_CONNECTION: {
        title: 'Continue your hospital connection',
        message: 'Review the latest status of the provider connection you started.',
        label: 'View connection',
        route: '/me/providers',
      },
      FIND_CARE: {
        title: 'Find the care you need',
        message: 'Tell SmartClinic what care you need and review appropriate options.',
        label: 'Find Care',
        route: '/me/request-care',
      },
      VIEW_APPOINTMENT: {
        title: 'Your appointment is today',
        message: 'You have a scheduled care appointment today.',
        label: 'View Appointment',
        route: '/me/care',
      },
      COMPLETE_PAYMENT: {
        title: 'Complete your payment',
        message: 'Finish the payment needed to continue this service.',
        label: 'Continue Payment',
        route: '/me/care',
      },
      CONTINUE_SELF_CHECK: {
        title: 'Continue your Self-Check',
        message: 'Pick up where you stopped and complete your health questions.',
        label: 'Continue Self-Check',
        route: '/me/self-checks',
      },
      VIEW_HEALTH_CHECK: {
        title: 'Your Health Check',
        message: 'You have an active Health Check to review.',
        label: 'View Health Check',
        route: '/me/health-checks',
      },
      NONE: {
        title: 'What would you like to do?',
        message: 'Choose preventive health, find care, or connect with your hospital.',
        label: 'Explore Stay Well',
        route: '/me/health-journey',
      },
    };
    return actions[action] ?? actions.NONE;
  }
  checklist(value: PatientDashboard) {
    return [
      { label: 'SmartClinic account created', complete: value.setup.accountCreated },
      { label: 'Complete your profile', complete: value.setup.profileComplete },
      { label: 'Connect to a healthcare provider', complete: value.setup.hasConnectedProvider },
      {
        label: 'Book or request your first care service',
        complete: value.setup.hasStartedCareJourney,
      },
    ];
  }
  measurementLabel(type: string): string {
    return type
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase());
  }
  provenanceLabel(value: string): string {
    return (
      (
        {
          REPORTED_BY_YOU: 'Reported by you',
          CHECKED_BY_PROVIDER: 'Checked by a provider',
          CONFIRMED_BY_LABORATORY: 'Confirmed by a laboratory',
        } as Record<string, string>
      )[value] ?? value
    );
  }

  patientInviteLink(): string {
  return this.referrals()?.inviteLinks.PATIENT ?? '';
}

patientInviteUrl(): string {
  const link = this.patientInviteLink();

  if (!link) {
    return '';
  }

  try {
    return new URL(link, window.location.origin).toString();
  } catch {
    return '';
  }
}
whatsappReferralShareUrl(): string {
  const inviteUrl = this.patientInviteUrl();

  if (!inviteUrl) {
    return '';
  }

  return `https://wa.me/?text=${encodeURIComponent(
    `Join SmartClinic using my invitation: ${inviteUrl}`,
  )}`;
}
  async copyPatientId(): Promise<void> {
    await this.copy(
      this.dashboard()?.patient.patientReference ?? '',
      'Patient ID copied.',
      this.copyFeedback,
    );
  }
  async copyReferralCode(): Promise<void> {
    await this.copy(
      this.referrals()?.referralCode ?? '',
      'Referral code copied.',
      this.referralFeedback,
    );
  }
async copyReferralLink(): Promise<void> {
  await this.copy(
    this.patientInviteUrl(),
    'Invite link copied.',
    this.referralFeedback,
  );
}
  private async copy(
    value: string,
    success: string,
    feedback: { set(value: string): void },
  ): Promise<void> {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      feedback.set(success);
    } catch {
      feedback.set('Copy was unavailable. Select the value and copy it manually.');
    }
  }
}
