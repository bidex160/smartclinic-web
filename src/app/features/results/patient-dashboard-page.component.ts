import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PatientDashboard, PatientPortalProfile } from '../../core/models/patient-dashboard.model';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { PatientHealthCheckHistoryResponse } from '../../core/models/patient-health-check-history.model';
import { ReferralSummary } from '../../core/models/referral.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { ReferralsApiService } from '../../core/services/referrals-api.service';
import { HealthPassportOverview } from '../../core/models/health-passport.model';
import { HealthPassportApiService } from '../../core/services/health-passport-api.service';

@Component({
  selector: 'app-patient-dashboard-page',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    @if (loading()) {
      <section role="status" aria-live="polite" class="animate-pulse space-y-6">
        <span class="sr-only">Loading your dashboard…</span>
        <div class="h-28 rounded-2xl bg-slate-200"></div>
        <div class="grid gap-4 md:grid-cols-3">
          @for (item of [1, 2, 3]; track item) {
            <div class="h-44 rounded-2xl bg-slate-200"></div>
          }
        </div>
        <div class="h-40 rounded-2xl bg-slate-200"></div>
      </section>
    } @else if (error()) {
      <section role="alert" class="rounded-2xl border border-red-200 bg-red-50 p-7">
        <h1 class="text-2xl font-bold">Your dashboard is unavailable right now</h1>
        <p class="mt-2">Check your connection and try again.</p>
        <button
          type="button"
          (click)="load()"
          class="mt-5 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white focus:ring-4 focus:ring-brand-200"
        >
          Retry
        </button>
      </section>
    } @else if (dashboard(); as value) {
      <header
        class="rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 p-6 text-white sm:p-8"
      >
        <p class="text-sm font-bold uppercase tracking-wider text-brand-100">Patient home</p>
        <h1 class="mt-2 break-words text-3xl font-bold sm:text-4xl">
          @if (value.dashboardMode === 'GETTING_STARTED') {
            Hi, {{ value.patient.firstName }}. Let’s take your first step towards staying healthy.
          } @else {
            {{ greeting() }}, {{ value.patient.firstName }}
          }
        </h1>
        @if (value.dashboardMode === 'GETTING_STARTED') {
          <p class="mt-4 max-w-2xl text-brand-100">
            Start from home in a few minutes, or book a check with a verified provider near you.
          </p>
          <a
            routerLink="/me/health-journey"
            class="mt-5 inline-flex min-h-12 items-center rounded-xl bg-white px-6 font-bold text-brand-900 focus:ring-4 focus:ring-white/30"
            >Start my health journey</a
          >
        } @else {
          <a
            routerLink="/me/health-passport"
            class="mt-4 inline-flex rounded-xl border border-white/50 px-5 py-3 font-bold focus:ring-4 focus:ring-white/30"
            >Open Smart Health Passport</a
          >
        }
        <p class="mt-4 text-sm text-brand-100">Your SmartClinic ID</p>
        <p class="mt-1 break-all font-mono text-xl font-bold">
          {{ value.patient.patientReference }}
        </p>
        <button
          type="button"
          (click)="copyPatientId()"
          class="mt-4 min-h-11 rounded-xl border border-white/50 px-5 font-bold focus:ring-4 focus:ring-white/30"
        >
          Copy ID
        </button>
        <p aria-live="polite" class="mt-2 text-sm font-semibold text-brand-100">
          {{ copyFeedback() }}
        </p>
      </header>
      @if (feedback()) {
        <p aria-live="polite" class="mt-5 rounded-xl bg-green-50 p-4 font-semibold text-green-900">
          {{ feedback() }}
        </p>
      }

      @if (value.recommendedAction === 'COMPLETE_PROFILE') {
        <section
          class="mt-6 rounded-2xl border-2 border-brand-500 bg-brand-50 p-6"
          aria-labelledby="profile-callout-heading"
        >
          <h2 id="profile-callout-heading" class="text-xl font-bold">Complete your profile</h2>
          <p class="mt-2 text-slate-700">
            Add your basic personal details to finish setting up your SmartClinic profile.
          </p>
          <button
            type="button"
            (click)="openProfile()"
            class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white focus:ring-4 focus:ring-brand-200"
          >
            Complete profile
          </button>
        </section>
      } @else if (
        value.recommendedAction === 'VIEW_PROVIDER_CONNECTION' ||
        (value.setup.hasProviderConnection && !value.setup.hasConnectedProvider)
      ) {
        <section
          class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6"
          aria-labelledby="connection-progress-heading"
        >
          <h2 id="connection-progress-heading" class="text-xl font-bold">
            Provider connection in progress
          </h2>
          <p class="mt-2">
            You've started connecting with a healthcare provider. View your provider connections to
            check the latest status.
          </p>
          <a
            routerLink="/me/providers"
            class="mt-4 inline-flex rounded-xl bg-brand-700 px-5 py-3 font-bold text-white focus:ring-4 focus:ring-brand-200"
            >View connections</a
          >
        </section>
      } @else if (value.recommendedAction === 'FIND_CARE') {
        <section
          class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6"
          aria-labelledby="next-care-heading"
        >
          <h2 id="next-care-heading" class="text-xl font-bold">Ready when you are</h2>
          <p class="mt-2">Find the care you need or book a preventive Health Check.</p>
          <div class="mt-4 flex flex-wrap gap-3">
            <a
              routerLink="/request-care"
              class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
              >Find Care</a
            ><a
              routerLink="/me/book"
              class="rounded-xl border border-brand-700 px-5 py-3 font-bold text-brand-800"
              >Health Check</a
            >
          </div>
        </section>
      }

      <section class="mt-8" aria-labelledby="primary-actions-heading">
        <h2 id="primary-actions-heading" class="text-2xl font-bold">How can we help today?</h2>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <a
            routerLink="/me/providers/connect"
            [class.ring-4]="value.recommendedAction === 'CONNECT_PROVIDER'"
            [class.ring-brand-300]="value.recommendedAction === 'CONNECT_PROVIDER'"
            class="group rounded-2xl border bg-white p-6 shadow-soft focus:ring-4 focus:ring-brand-200"
          >
            <span class="text-lg font-bold text-brand-900">Connect to a Provider</span
            ><span class="mt-2 block text-slate-600"
              >Connect with a hospital, clinic, or healthcare provider.</span
            ><span class="mt-5 block font-bold text-brand-700">Connect now →</span>
          </a>
          <a
            routerLink="/me/book"
            class="group rounded-2xl border bg-white p-6 shadow-soft focus:ring-4 focus:ring-brand-200"
          >
            <span class="text-lg font-bold text-brand-900">Book a Health Check</span
            ><span class="mt-2 block text-slate-600">Choose a preventive health check package.</span
            ><span class="mt-5 block font-bold text-brand-700">Choose a package →</span>
          </a>
          <a
            routerLink="/request-care"
            [class.ring-4]="value.recommendedAction === 'FIND_CARE'"
            [class.ring-brand-300]="value.recommendedAction === 'FIND_CARE'"
            class="group rounded-2xl border bg-white p-6 shadow-soft focus:ring-4 focus:ring-brand-200"
          >
            <span class="text-lg font-bold text-brand-900">Find Care Now</span
            ><span class="mt-2 block text-slate-600"
              >Find a consultation or another care service when you need it.</span
            ><span class="mt-5 block font-bold text-brand-700">Find care →</span>
          </a>
        </div>
      </section>

      <section
        class="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-6"
        aria-labelledby="passport-intro-heading"
      >
        <h2 id="passport-intro-heading" class="text-xl font-bold text-brand-900">
          Smart Health Passport
        </h2>
        <p class="mt-2 text-slate-700">
          Your Smart Health Passport keeps your health history, checks, results and recommendations
          together.
        </p>
        <a routerLink="/me/health-passport" class="mt-4 inline-block font-bold text-brand-700"
          >View Health Passport →</a
        >
      </section>
      @if (value.dashboardMode === 'ESTABLISHED' && passport(); as health) {
        <section class="mt-8" aria-labelledby="current-health-heading">
          <h2 id="current-health-heading" class="text-2xl font-bold">
            Your current health journey
          </h2>
          <div class="mt-4 grid gap-4 md:grid-cols-3">
            @if (health.currentNextAction; as action) {
              <article class="rounded-2xl border bg-white p-5">
                <p class="text-sm font-bold uppercase text-brand-700">Next action</p>
                <h3 class="mt-2 font-bold">{{ action.title }}</h3>
                <p class="mt-2 text-sm text-slate-600">{{ action.message }}</p>
              </article>
            }
            @if (health.latestMeasurements[0]; as measurement) {
              <article class="rounded-2xl border bg-white p-5">
                <p class="text-sm font-bold uppercase text-brand-700">Latest measurement</p>
                <h3 class="mt-2 font-bold">{{ measurement.type.replaceAll('_', ' ') }}</h3>
                <p class="mt-2 text-sm text-slate-600">
                  {{
                    measurement.provenance === 'REPORTED_BY_YOU'
                      ? 'Reported by you'
                      : measurement.provenance === 'CHECKED_BY_PROVIDER'
                        ? 'Checked by a provider'
                        : 'Confirmed by a laboratory'
                  }}
                </p>
              </article>
            }
            @if (health.recentActivity[0]; as activity) {
              <article class="rounded-2xl border bg-white p-5">
                <p class="text-sm font-bold uppercase text-brand-700">Latest activity</p>
                <h3 class="mt-2 font-bold">{{ activity.title }}</h3>
                <p class="mt-2 text-sm text-slate-600">{{ activity.description }}</p>
              </article>
            }
          </div>
        </section>
      }

      @if (value.dashboardMode === 'GETTING_STARTED') {
        <section
          class="mt-8 rounded-2xl border bg-white p-6"
          aria-labelledby="getting-started-heading"
        >
          <h2 id="getting-started-heading" class="text-2xl font-bold">Getting started</h2>
          <ul class="mt-5 grid gap-4">
            @for (step of checklist(value); track step.label) {
              <li class="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  class="grid size-7 shrink-0 place-items-center rounded-full border font-bold"
                  >{{ step.complete ? '✓' : '○' }}</span
                ><span
                  ><strong>{{ step.label }}</strong
                  ><span class="block text-sm text-slate-600">{{
                    step.complete ? 'Complete' : 'Not complete'
                  }}</span></span
                >
              </li>
            }
          </ul>
        </section>
      }

      @if (
        value.dashboardMode === 'ESTABLISHED' ||
        healthChecksLoading() ||
        healthChecksError() ||
        (healthChecks()?.items?.length ?? 0) > 0
      ) {
        <section class="mt-8" aria-labelledby="health-check-summary-heading">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="health-check-summary-heading" class="text-2xl font-bold text-brand-900">
                Your Health Checks
              </h2>
              <p class="mt-1 text-slate-600">A summary of your preventive Health Check journey.</p>
            </div>
            <a routerLink="/me/health-checks" class="font-bold text-brand-700 underline"
              >View all Health Checks</a
            >
          </div>
          @if (healthChecksLoading()) {
            <p role="status" class="mt-4 rounded-xl border bg-white p-5">
              Loading your Health Checks…
            </p>
          } @else if (healthChecksError()) {
            <div role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-5">
              <p>We couldn't load your Health Check summary.</p>
              <button
                type="button"
                (click)="loadHealthChecks()"
                class="mt-2 font-bold text-brand-700 underline"
              >
                Try again
              </button>
            </div>
          } @else {
            <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              @for (item of healthCheckSummary(); track item.label) {
                <article class="rounded-2xl border border-brand-100 bg-white p-5">
                  <p class="text-sm font-semibold text-slate-600">{{ item.label }}</p>
                  <p class="mt-2 text-3xl font-bold text-brand-900">{{ item.count }}</p>
                </article>
              }
            </div>
            @if (healthChecks()?.items?.length === 0) {
              <section class="mt-4 rounded-2xl bg-white p-7 text-center">
                <h3 class="text-xl font-bold">No Health Checks yet.</h3>
                <a
                  routerLink="/me/book"
                  class="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-700 px-6 font-bold text-white"
                  >Book your first Health Check</a
                >
              </section>
            } @else {
              <div class="mt-4 flex flex-wrap gap-3">
                <a
                  routerLink="/me/health-checks"
                  class="rounded-xl bg-brand-700 px-6 py-3 font-bold text-white"
                  >View My Health Checks</a
                >
                <a
                  routerLink="/me/book"
                  class="rounded-xl border border-brand-600 px-6 py-3 font-bold text-brand-700"
                  >Book another Health Check</a
                >
              </div>
            }
          }
        </section>
      }

      @if (
        value.dashboardMode === 'ESTABLISHED' ||
        referralsLoading() ||
        referralsError() ||
        (referrals()?.availablePoints ?? 0) > 0 ||
        (referrals()?.registeredDirectReferrals ?? 0) > 0
      ) {
        <section
          class="mt-8 rounded-2xl border bg-white p-6"
          aria-labelledby="dashboard-rewards-heading"
        >
          <h2 id="dashboard-rewards-heading" class="text-2xl font-bold text-brand-900">
            Referrals & Rewards
          </h2>
          @if (referralsLoading()) {
            <p role="status" class="mt-3">Loading rewards…</p>
          } @else if (referralsError()) {
            <div role="alert" class="mt-3">
              <p>We could not load your referral progress.</p>
              <button
                type="button"
                (click)="loadReferrals()"
                class="mt-2 font-bold text-brand-700 underline"
              >
                Try again
              </button>
            </div>
          } @else if (referrals(); as rewards) {
            <p class="mt-3 text-3xl font-bold">{{ rewards.availablePoints }} points</p>
            @if (rewards.levelProgress.currentLevel; as current) {
              <p class="mt-2 font-semibold">{{ current.name }} achieved</p>
            } @else {
              <p class="mt-2 font-semibold">No level achieved yet</p>
            }
            @if (rewards.levelProgress.highestConfiguredLevelReached) {
              <p class="mt-1 text-sm text-slate-600">Highest level reached</p>
            } @else if (rewards.levelProgress.nextLevel; as next) {
              <p class="mt-1 text-sm text-slate-600">Next: {{ next.name }}</p>
              <div class="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                @for (
                  requirement of rewards.levelProgress.requirements;
                  track requirement.targetType
                ) {
                  <p>
                    {{ dashboardTargetLabel(requirement.targetType) }}
                    {{ requirement.qualified }}/{{ requirement.required }}
                  </p>
                }
              </div>
            }
            <a
              routerLink="/me/referrals"
              class="mt-4 inline-flex font-bold text-brand-700 underline"
              >View Referrals & Rewards</a
            >
          }
        </section>
      }

      <section class="mt-8" aria-labelledby="quick-access-heading">
        <h2 id="quick-access-heading" class="text-2xl font-bold">Quick access</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          @for (item of quickAccess; track item.route) {
            <a
              [routerLink]="item.route"
              class="min-h-14 rounded-xl border bg-white p-4 font-bold text-brand-800 focus:ring-4 focus:ring-brand-200"
              >{{ item.label }}</a
            >
          }
        </div>
      </section>
    }

    @if (profileOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-editor-heading"
          class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="profile-editor-heading" class="text-2xl font-bold">Complete your profile</h2>
          @if (profileLoading()) {
            <p role="status" class="mt-5">Loading your profile…</p>
          } @else if (profileLoadError()) {
            <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4">
              Your profile could not be loaded.
              <button type="button" (click)="loadProfile()" class="font-bold underline">
                Try again
              </button>
            </p>
          } @else if (profile()) {
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="mt-5 grid gap-4">
              <label for="profile-given-name" class="font-bold"
                >First name *<input
                  id="profile-given-name"
                  formControlName="givenName"
                  maxlength="100"
                  placeholder="e.g. Ada"
                  class="mt-1 block min-h-12 w-full rounded-xl border px-3"
                />
                @if (
                  profileForm.controls.givenName.touched && profileForm.controls.givenName.invalid
                ) {
                  <span class="mt-1 block text-sm text-red-700">Enter your first name.</span>
                }
              </label>
              <label for="profile-family-name" class="font-bold"
                >Last name *<input
                  id="profile-family-name"
                  formControlName="familyName"
                  maxlength="100"
                  placeholder="e.g. Okafor"
                  class="mt-1 block min-h-12 w-full rounded-xl border px-3"
                />
                @if (
                  profileForm.controls.familyName.touched && profileForm.controls.familyName.invalid
                ) {
                  <span class="mt-1 block text-sm text-red-700">Enter your last name.</span>
                }
              </label>
              <label for="profile-email" class="font-bold"
                >Email<input
                  id="profile-email"
                  [value]="profile()!.user.email"
                  readonly
                  class="mt-1 block min-h-12 w-full rounded-xl border bg-slate-100 px-3 text-slate-600"
                /><span class="mt-1 block text-sm font-normal text-slate-500"
                  >Email belongs to your SmartClinic account and cannot be changed here.</span
                ></label
              >
              <label for="profile-phone" class="font-bold"
                >Phone <span class="font-normal text-slate-500">(optional)</span
                ><input
                  id="profile-phone"
                  type="tel"
                  formControlName="phone"
                  maxlength="30"
                  placeholder="e.g. +234 801 234 5678"
                  class="mt-1 block min-h-12 w-full rounded-xl border px-3"
                />
                @if (profileForm.controls.phone.touched && profileForm.controls.phone.invalid) {
                  <span class="mt-1 block text-sm text-red-700">Enter a valid phone number.</span>
                }
              </label>
              <label for="profile-dob" class="font-bold"
                >Date of birth <span class="font-normal text-slate-500">(optional)</span
                ><input
                  id="profile-dob"
                  type="date"
                  formControlName="dateOfBirth"
                  [max]="today"
                  class="mt-1 block min-h-12 w-full rounded-xl border px-3"
              /></label>
              @if (profileSaveError()) {
                <p role="alert" class="rounded-xl bg-red-50 p-4">{{ profileSaveError() }}</p>
              }
              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  (click)="closeProfile()"
                  [disabled]="profileSaving()"
                  class="rounded-xl border px-5 py-3 font-bold"
                >
                  Cancel</button
                ><button
                  type="submit"
                  [disabled]="profileSaving() || profileForm.invalid"
                  class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
                >
                  {{ profileSaving() ? 'Saving…' : 'Save profile' }}
                </button>
              </div>
            </form>
          }
        </section>
      </div>
    }
  </main>`,
})
export class PatientDashboardPageComponent {
  private readonly api = inject(PatientDashboardApiService);
  private readonly healthChecksApi = inject(HealthCheckResultsApiService);
  private readonly referralsApi = inject(ReferralsApiService);
  private readonly passportApi = inject(HealthPassportApiService);
  private readonly fb = inject(FormBuilder);
  readonly dashboard = signal<PatientDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly profileOpen = signal(false);
  readonly profile = signal<PatientPortalProfile | null>(null);
  readonly profileLoading = signal(false);
  readonly profileLoadError = signal(false);
  readonly profileSaving = signal(false);
  readonly profileSaveError = signal<string | null>(null);
  readonly feedback = signal('');
  readonly copyFeedback = signal('');
  readonly healthChecks = signal<PatientHealthCheckHistoryResponse | null>(null);
  readonly healthChecksLoading = signal(false);
  readonly healthChecksError = signal(false);
  readonly referrals = signal<ReferralSummary | null>(null);
  readonly referralsLoading = signal(false);
  readonly referralsError = signal(false);
  readonly passport = signal<HealthPassportOverview | null>(null);
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
  readonly today = new Date().toISOString().slice(0, 10);
  readonly quickAccess = [
    { label: 'Smart Health Passport', route: '/me/health-passport' },
    { label: 'Health Records', route: '/me/health-records' },
    { label: 'Prescriptions', route: '/me/prescriptions' },
    { label: 'My Providers', route: '/me/providers' },
    { label: 'My Impact', route: '/me/impact' },
  ] as const;
  readonly profileForm = this.fb.nonNullable.group({
    givenName: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    familyName: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    phone: ['', [Validators.maxLength(30), Validators.pattern(/^$|^\+?[0-9][0-9 ()-]{6,29}$/)]],
    dateOfBirth: [''],
  });

  constructor() {
    this.load();
    this.loadHealthChecks();
    this.loadReferrals();
    this.passportApi.overview().subscribe({ next: (value) => this.passport.set(value) });
  }
  load(): void {
    if (this.loading() && this.dashboard()) return;
    this.loading.set(true);
    this.error.set(false);
    this.api
      .getDashboard()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (value) => this.dashboard.set(value),
        error: () => this.error.set(true),
      });
  }
  greeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
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
      .summary()
      .pipe(finalize(() => this.referralsLoading.set(false)))
      .subscribe({
        next: (value) => this.referrals.set(value),
        error: () => this.referralsError.set(true),
      });
  }
  async copyPatientId(): Promise<void> {
    const reference = this.dashboard()?.patient.patientReference;
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      this.copyFeedback.set('Patient ID copied');
    } catch {
      this.copyFeedback.set('Copy was unavailable. Select the Patient ID to copy it manually.');
    }
  }
  dashboardTargetLabel(target: string): string {
    return (
      (
        {
          PATIENT: 'Patients',
          CLINIC: 'Clinics',
          LABORATORY: 'Labs',
          PHARMACY: 'Pharmacies',
        } as Record<string, string>
      )[target] ?? target
    );
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
  openProfile(): void {
    this.profileOpen.set(true);
    this.loadProfile();
  }
  closeProfile(): void {
    this.profileOpen.set(false);
    this.profileSaveError.set(null);
  }
  loadProfile(): void {
    this.profileLoading.set(true);
    this.profileLoadError.set(false);
    this.api
      .getProfile()
      .pipe(finalize(() => this.profileLoading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.profileForm.reset({
            givenName: profile.patient.givenName,
            familyName: profile.patient.familyName,
            phone: profile.patient.phone ?? '',
            dateOfBirth: profile.patient.dateOfBirth ?? '',
          });
        },
        error: () => this.profileLoadError.set(true),
      });
  }
  saveProfile(): void {
    if (this.profileForm.invalid || this.profileSaving()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.getRawValue();
    this.profileSaving.set(true);
    this.profileSaveError.set(null);
    this.api
      .updateProfile({
        givenName: value.givenName.trim(),
        familyName: value.familyName.trim(),
        phone: value.phone.trim() || null,
        dateOfBirth: value.dateOfBirth || null,
      })
      .pipe(finalize(() => this.profileSaving.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.profileOpen.set(false);
          this.feedback.set('Your profile was updated.');
          this.loading.set(false);
          this.load();
        },
        error: (error: HttpErrorResponse) =>
          this.profileSaveError.set(
            typeof error.error?.message === 'string'
              ? error.error.message
              : 'Your profile could not be saved. Please review the details and try again.',
          ),
      });
  }
}
