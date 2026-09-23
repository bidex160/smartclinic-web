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
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
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
        <header class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div class="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl"></div>
          <div class="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-bold uppercase tracking-wider text-brand-700">Patient home</p>
            <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
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
          </div>
        </header>

        <section
          class="relative mt-5 overflow-hidden rounded-[2rem] bg-brand-900 p-6 text-white shadow-xl sm:p-8"
          aria-labelledby="next-step-heading"
        >
          <div class="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl"></div>
          <div class="relative">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-100">Your next step</p>
          <h2 id="next-step-heading" class="mt-1 text-2xl font-bold">
            {{ nextStep(value).title }}
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-brand-50 sm:text-base">
            {{ nextStep(value).message }}
          </p>
          <a
            [routerLink]="nextStep(value).route"
            class="mt-3 inline-flex min-h-10 items-center rounded-xl bg-white px-4 text-sm font-bold text-brand-900 focus:ring-4 focus:ring-white/40"
            >{{ nextStep(value).label }} <span class="ml-2" aria-hidden="true">→</span></a
          >
          </div>
        </section>

        <nav class="mt-4" aria-labelledby="quick-access-heading">
          <h2 id="quick-access-heading" class="mb-2 text-sm font-bold uppercase tracking-wider text-brand-700">Quick access</h2>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <a routerLink="/me/health-journey" class="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl bg-white px-2 py-4 text-center text-xs font-bold text-brand-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:text-sm">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true"><svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-4.4-7-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7 2.8C19 16.6 12 21 12 21Z"/><path stroke-linecap="round" d="M12 11v4m-2-2h4"/></svg></span>
              <span>Book a checkup</span>
            </a>
            <a routerLink="/me/request-care"
             [queryParams]="{ serviceCode: 'EMERGENCY_CONSULTATION' }"
              class="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl bg-white px-2 py-4 text-center text-xs font-bold text-brand-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:text-sm">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true"><svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3.5a2.5 2.5 0 0 1-2-2.5v-5.5Z"/></svg></span>
              <span>Get a consultation</span>
            </a>
            <a 
             [queryParams]="{ serviceCode: 'BASIC_MEDICATIONS' }"
            routerLink="/me/request-care" class="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl bg-white px-2 py-4 text-center text-xs font-bold text-brand-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:text-sm">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true"><svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8 4h8v3H8zM6 7h12v13H6zM9 11h6m-6 4h4"/></svg></span>
              <span>Get medication</span>
            </a>
            <a routerLink="/me/request-care" 
            [queryParams]="{ serviceCode: 'LAB_REQUEST' }"
            class="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl bg-white px-2 py-4 text-center text-xs font-bold text-brand-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:text-sm">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true"><svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m9 3-5 9h6l-2 9 8-11h-6l3-7H9Z"/></svg></span>
              <span>Get a lab test</span>
            </a>
            <a routerLink="/me/tests" class="sc-action group relative flex min-h-[142px] flex-col items-start justify-between overflow-hidden rounded-[1.4rem] border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4 text-left font-bold text-brand-950 shadow-[0_10px_28px_rgba(190,24,93,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(190,24,93,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span class="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-rose-200/35 blur-xl" aria-hidden="true"></span>
              <span class="relative grid h-11 w-11 place-items-center rounded-2xl bg-rose-500 text-sm font-black text-white shadow-md shadow-rose-500/20" aria-hidden="true">T</span>
              <span class="relative flex w-full items-end justify-between gap-2"><span>Get a Test</span><span class="text-rose-600 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
            </a>
            <button type="button" disabled aria-disabled="true" class="relative flex min-h-[132px] flex-col items-start justify-between overflow-hidden rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 text-left font-bold text-slate-500 shadow-sm">
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-slate-200 text-lg text-slate-600" aria-hidden="true">₦</span>
              <span>Pay a Bill<small class="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Coming soon</small></span>
            </button>
            <a routerLink="/me/orders" class="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl bg-white px-2 py-4 text-center text-xs font-bold text-brand-900 shadow-sm ring-1 ring-slate-200"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true">↗</span><span>Tests & referrals</span></a>
            <a routerLink="/me/health-passport" class="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl bg-white px-2 py-4 text-center text-xs font-bold text-brand-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:text-sm">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true"><svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3h9l3 3v15H6zM15 3v4h4M9 12h6m-6 4h6"/></svg></span>
              <span>View health records</span>
            </a>
          </div>
        </nav>

        <section class="mt-7" aria-labelledby="your-care-heading">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Your care</p>
              <h2 id="your-care-heading" class="mt-1 text-xl font-bold text-brand-950">Everything connected.</h2>
            </div>
            <a routerLink="/me/care" class="text-sm font-bold text-brand-700">View care →</a>
          </div>
          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
            <article class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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

        <section class="mt-7 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 text-white shadow-soft" aria-labelledby="health-check-summary-heading">
          <div class="p-5 sm:p-7">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-100">Invest in yourself</p>
            <h2 id="health-check-summary-heading" class="mt-2 max-w-2xl text-2xl font-bold sm:text-3xl">
              Your health deserves a place on your priority list.
            </h2>
            @if (healthChecks()?.items?.length === 0) {
              <p class="mt-3 max-w-2xl text-sm leading-6 text-brand-50 sm:text-base">
                We spend on the things we use every day. A simple Health Check is an investment in the person who uses them all — you.
              </p>
              <a routerLink="/me/health-journey" class="mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-5 font-bold text-brand-900">
                Check my health → 
              </a>
            } @else {
              <p class="mt-2 text-sm text-brand-50">Your preventive Health Check activity at a glance.</p>
              <div class="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                @for (item of healthCheckSummary(); track item.label) {
                  <article class="flex items-center justify-between gap-2 rounded-xl bg-white/10 p-3 ring-1 ring-white/20">
                    <p class="text-xs font-semibold text-brand-50">{{ item.label }}</p>
                    <p class="text-xl font-bold">{{ item.count }}</p>
                  </article>
                }
              </div>
              <a routerLink="/me/health-checks" class="mt-4 inline-block text-sm font-bold text-white underline">View Health Checks →</a>
            }
          </div>
        </section>

        <section class="mt-7 rounded-3xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5" aria-labelledby="passport-heading">
          <div class="flex items-start gap-4">
            <div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-700 text-xl text-white" aria-hidden="true">▣</div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Smart Health Passport</p>
              <h2 id="passport-heading" class="mt-1 text-xl font-bold text-brand-950">Your health story, wherever you go.</h2>
              <p class="mt-1 text-sm leading-6 text-slate-600">Records, results, prescriptions and care history in one place.</p>
              <a routerLink="/me/health-passport" class="mt-3 inline-flex min-h-10 items-center font-bold text-brand-700">Open Health Passport →</a>
            </div>
          </div>
        </section>

        <section class="mt-7 rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-brand-50 p-5 shadow-[0_10px_28px_rgba(120,53,15,0.06)]" aria-labelledby="impact-heading">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Community impact</p>
              <h2 id="impact-heading" class="mt-1 text-xl font-bold text-brand-950">Help someone access healthcare.</h2>
              <p class="mt-1 text-sm leading-6 text-slate-600">Invite someone to SmartClinic and grow your verified impact.</p>
              @if (referrals(); as rewards) {
                <p class="mt-3 text-sm font-bold text-brand-950">
                  {{ rewards.balances.availablePoints }} points
                  @if (rewards.leaderboard.optedIn && rewards.leaderboard.position !== null) { · #{{ rewards.leaderboard.position }} }
                </p>
              }
            </div>
            <a routerLink="/me/impact" class="shrink-0 text-sm font-bold text-brand-700">View →</a>
          </div>
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
            class="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 grid size-12 place-items-center overflow-hidden rounded-full bg-[#128c7e] text-xs font-bold text-white shadow-lg focus:ring-4 focus:ring-emerald-200 lg:bottom-4"
             aria-label="WhatsApp help" title="WhatsApp help">?</a
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
    if (!resource?.reference.trim()) return '/me/orders';

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
        return ['/me/care/appointments', resource.reference];
      case 'PATIENT_ORDER':
      case 'CLINICAL_ORDER':
      case 'DIAGNOSTIC_ORDER':
      case 'LAB_ORDER':
      case 'RADIOLOGY_ORDER':
      case 'REFERRAL':
      case 'PROCEDURE_ORDER':
        return ['/me/orders', resource.reference];
      default:
        return '/me/orders';
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
