import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PUBLIC_SITE_CONFIG } from '../../core/config/public-site-config.token';
import { HealthPassportOverview } from '../../core/models/health-passport.model';
import {
  PatientDashboard,
  PatientDashboardRecommendedAction,
  PatientDashboardRecommendedActionDetail,
  PatientDailyRoutine,
  PatientDailyRoutineType,
  DailyCareProgress,
  DailyCheckIn,
} from '../../core/models/patient-dashboard.model';
import { PatientHealthCheckHistoryResponse } from '../../core/models/patient-health-check-history.model';
import { ReferralImpact } from '../../core/models/referral.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { HealthPassportApiService } from '../../core/services/health-passport-api.service';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { DeviceNotificationsService } from '../../core/services/device-notifications.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';
import { DailyCheckInComponent } from './daily-check-in.component';
import { VisitDayCardComponent } from './visit-day-card.component';
import { PendingRequestsCardComponent } from './pending-requests-card.component';
import { tipForDate } from './daily-tips';
import { ReferralsApiService } from '../../core/services/referrals-api.service';

import { EngagementApiService } from '../../core/services/engagement-api.service';
import { DailyQuizCardComponent } from '../engagement/daily-quiz-card.component';
import { PassportMeterComponent } from '../engagement/passport-meter.component';
interface StarterRoutine {
  readonly type: PatientDailyRoutineType;
  /** Translation key; the patient's routine is saved in the language they see. */
  readonly labelKey: string;
  readonly time: string;
}

/** One-tap starter habits. Medication is excluded: it needs an explicit safety acknowledgement. */
const STARTER_ROUTINES: readonly StarterRoutine[] = [
  { type: 'HYDRATION', labelKey: 'dashboard.starter.water', time: '09:00' },
  { type: 'BREAK', labelKey: 'dashboard.starter.stretch', time: '12:30' },
  { type: 'MOVEMENT', labelKey: 'dashboard.starter.walk', time: '17:30' },
  { type: 'SLEEP', labelKey: 'dashboard.starter.windDown', time: '22:00' },
];

interface StreakBadge {
  readonly days: number;
  /** Translation key for the badge name. */
  readonly name: string;
}

/** Non-monetary milestones: celebrating habits without rewarding unearned ticks. */
const STREAK_BADGES: readonly StreakBadge[] = [
  { days: 3, name: 'dashboard.badges.spark' },
  { days: 7, name: 'dashboard.badges.oneWeek' },
  { days: 30, name: 'dashboard.badges.thirtyDays' },
  { days: 100, name: 'dashboard.badges.hundredDays' },
];

const MOOD_LABELS = ['', 'dashboard.mood.veryLow', 'dashboard.mood.low', 'dashboard.mood.okay', 'dashboard.mood.good', 'dashboard.mood.great'] as const;

/** title, message and label are translation keys. */
interface DashboardNextStep {
  readonly title: string;
  readonly message: string;
  readonly label: string;
  readonly route: string | string[];
}

@Component({
  selector: 'app-patient-dashboard-page',
  imports: [RouterLink, ReactiveFormsModule, DailyCheckInComponent, VisitDayCardComponent, PendingRequestsCardComponent, DailyQuizCardComponent, PassportMeterComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-8 sm:pt-8 lg:pt-10">
      @if (loading()) {
        <section role="status" aria-live="polite" class="animate-pulse space-y-4">
          <span class="sr-only">{{ 'dashboard.state.loading' | t }}</span>
          <div class="h-16 w-2/3 rounded-2xl bg-sand-200"></div>
          <div class="h-52 rounded-[1.75rem] bg-sand-200"></div>
          <div class="h-40 rounded-[1.75rem] bg-sand-100"></div>
        </section>
      } @else if (error()) {
        <section role="alert" class="sc-card p-6">
          <h1 class="font-display text-2xl font-semibold text-ink">{{ 'dashboard.state.errorTitle' | t }}</h1>
          <p class="mt-2 text-ink-soft">{{ 'dashboard.state.errorBody' | t }}</p>
          <button type="button" (click)="load()" class="mt-4 rounded-full bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">{{ 'dashboard.state.retry' | t }}</button>
        </section>
      } @else if (dashboard(); as value) {
        <header class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p class="text-sm font-medium text-ink-muted">{{ today }}</p>
            <h1 class="font-display mt-1 text-[2rem] font-semibold leading-[1.1] text-ink sm:text-[2.6rem]">
              {{ greeting() | t: { name: value.patient.firstName } }}
            </h1>
          </div>
          <div class="flex items-center gap-2 rounded-full border border-ink/[0.08] bg-white py-1.5 pl-4 pr-1.5 shadow-card">
            <p class="text-sm text-ink-soft">
              <span class="sr-only sm:not-sr-only">SmartClinic ID: </span><strong class="whitespace-nowrap font-mono font-semibold tracking-wide text-ink">{{ value.patient.patientReference }}</strong>
            </p>
            <button type="button" (click)="copyPatientId()" class="min-h-9 whitespace-nowrap rounded-full bg-sand-100 px-3.5 text-xs font-semibold text-ink transition hover:bg-sand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              {{ 'dashboard.header.copyId' | t }}
            </button>
            <a routerLink="/me/card" class="inline-flex min-h-9 items-center rounded-full bg-ink px-3.5 text-xs font-semibold text-white transition hover:bg-brand-900" data-card-shortcut>{{ 'dashboard.header.card' | t }}</a>
          </div>
          <p aria-live="polite" class="w-full text-sm font-medium text-leaf-700 empty:hidden">{{ copyFeedback() | t }}</p>
        </header>

        <app-visit-day-card />
        <app-pending-requests-card />

        @if (value.dashboardMode === 'GETTING_STARTED') {
          <section class="sc-card mt-5 p-5" aria-labelledby="getting-started-heading">
            <div class="flex items-center gap-4">
              <div class="relative size-14 shrink-0" aria-hidden="true">
                <svg class="size-14 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" stroke-width="3" class="text-sand-200" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="text-leaf-500"
                    [attr.stroke-dasharray]="97.4" [attr.stroke-dashoffset]="97.4 - (97.4 * completedSteps(value)) / checklist(value).length" />
                </svg>
                <span class="absolute inset-0 grid place-items-center text-sm font-bold text-ink">{{ completedSteps(value) }}/{{ checklist(value).length }}</span>
              </div>
              <div class="min-w-0">
                <h2 id="getting-started-heading" class="font-display text-[1.25rem] font-semibold text-ink">{{ 'dashboard.setup.title' | t }}</h2>
                <p class="text-sm text-ink-muted">{{ 'dashboard.setup.progress' | t: { done: completedSteps(value), total: checklist(value).length } }}</p>
              </div>
            </div>
            <ul class="mt-4 grid gap-2 sm:grid-cols-2">
              @for (step of checklist(value); track step.label) {
                <li>
                  <a [routerLink]="step.route" class="flex items-center gap-3 rounded-2xl p-3 ring-1 transition {{ step.complete ? 'bg-leaf-50 ring-leaf-100' : 'bg-white ring-ink/[0.07] hover:bg-sand-50' }}">
                    <span aria-hidden="true" class="grid size-8 shrink-0 place-items-center rounded-full font-bold {{ step.complete ? 'bg-leaf-500 text-white' : 'bg-sand-100 text-ink-muted' }}">{{ step.complete ? '✓' : '○' }}</span>
                    <span class="min-w-0 flex-1"><strong class="block text-sm font-semibold text-ink">{{ step.label | t }}</strong><span class="text-xs text-ink-muted">{{ (step.complete ? 'dashboard.setup.complete' : 'dashboard.setup.notComplete') | t }}</span></span>
                    @if (!step.complete) { <span class="text-ink-muted" aria-hidden="true">›</span> }
                  </a>
                </li>
              }
            </ul>
          </section>
        }

        <div class="mt-6 grid gap-4 lg:grid-cols-12">
          <section class="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-white shadow-lift sm:p-8 lg:col-span-7" aria-labelledby="next-step-heading">
            <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true"></div>
            <div class="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-brand-600/40 blur-3xl" aria-hidden="true"></div>
            <div class="pointer-events-none absolute -bottom-28 left-10 size-64 rounded-full bg-ochre-500/20 blur-3xl" aria-hidden="true"></div>
            <div class="relative">
              <p class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ochre-300">
                <span class="size-1.5 rounded-full bg-ochre-300"></span>{{ 'dashboard.nextStep.eyebrow' | t }}
              </p>
              <h2 id="next-step-heading" class="font-display mt-3 text-[1.7rem] font-semibold leading-tight sm:text-[2rem]">
                {{ nextStep(value).title | t }}
              </h2>
              <p class="mt-2 max-w-md text-[15px] leading-relaxed text-white/75">{{ nextStep(value).message | t }}</p>
              <a [routerLink]="nextStep(value).route" class="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink transition hover:bg-ochre-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40">
                {{ nextStep(value).label | t }} <span aria-hidden="true">→</span>
              </a>
            </div>
          </section>

          <section class="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white shadow-lift sm:p-7 lg:col-span-5" aria-labelledby="passport-heading">
            <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true"></div>
            <div class="relative flex h-full flex-col">
              <div class="flex items-start justify-between gap-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Smart Health Passport</p>
                <span class="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5Z"/><path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/><path d="M8 18h8"/></svg></span>
              </div>
              <h2 id="passport-heading" class="font-display mt-3 text-[1.45rem] font-semibold leading-tight">{{ 'dashboard.passport.title' | t }}</h2>
              <p class="mt-2 text-sm leading-relaxed text-white/70">{{ 'dashboard.passport.body' | t }}</p>
              <div class="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                @if (engagement(); as g) {
                  <app-passport-meter [summary]="g" tone="dark" />
                } @else {
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.16em] text-white/55">{{ 'dashboard.passport.holder' | t }}</p>
                    <p class="font-semibold">{{ value.patient.displayName }}</p>
                  </div>
                }
                <a routerLink="/me/health-passport" class="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/15 px-4 text-sm font-semibold ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25">
                  {{ 'dashboard.passport.open' | t }} <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </section>
        </div>

        <section class="sc-card mt-4 p-5 sm:p-7" aria-labelledby="today-care-heading">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ochre-700">
                <svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                {{ 'dashboard.today.eyebrow' | t }}
              </p>
              <h2 id="today-care-heading" class="font-display mt-1.5 text-[1.45rem] font-semibold text-ink">{{ 'dashboard.today.title' | t }}</h2>
              <p class="mt-1 text-sm leading-6 text-ink-muted">{{ 'dashboard.today.intro' | t }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              @if (value.dailyCare; as care) {
                @if (care.streakDays > 0) {
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-ochre-50 px-3 py-1.5 text-sm font-semibold text-ochre-700 ring-1 ring-ochre-100" data-streak>
                    <svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-2.7 7-7 0-3.5-2.5-6.5-4-8-.5 2-1.5 3.5-3 4.5C12 8 11 4.5 8.5 2 9 6 5 9 5 15c0 4.3 3 7 7 7Z"/></svg>
                    {{ 'dashboard.today.streak' | t: { days: care.streakDays } }}
                  </span>
                }
              }
              <button type="button" (click)="toggleRoutineManager()" class="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sand-100">
                {{ (routineManagerOpen() ? 'dashboard.today.close' : 'dashboard.today.manage') | t }}
              </button>
            </div>
          </div>

          @if (value.dailyCare?.week; as week) {
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
              <ol class="flex gap-1.5" [attr.aria-label]="'dashboard.week.label' | t" data-week-strip>
                @for (day of week; track day.localDate; let last = $last) {
                  <li class="flex flex-col items-center gap-1">
                    <span
                      class="grid size-8 place-items-center rounded-full text-[11px] font-bold transition {{ day.active ? 'bg-leaf-500 text-white' : 'bg-sand-100 text-ink-muted' }} {{ last ? 'ring-2 ring-offset-2 ring-brand-500' : '' }}"
                      [attr.aria-label]="(day.active ? 'dashboard.week.dayActive' : 'dashboard.week.dayInactive') | t: { day: weekdayName(day.localDate) }"
                    >{{ day.active ? '✓' : '' }}</span>
                    <span class="text-[10px] font-semibold uppercase text-ink-muted" aria-hidden="true">{{ weekdayInitial(day.localDate) }}</span>
                  </li>
                }
              </ol>
              <div class="flex flex-wrap gap-1.5" data-badges>
                @for (badge of earnedBadges(value); track badge.days) {
                  <span class="inline-flex items-center gap-1 rounded-full bg-ochre-50 px-2.5 py-1 text-xs font-semibold text-ochre-700 ring-1 ring-ochre-100" [attr.title]="'dashboard.badges.reached' | t: { days: badge.days }">
                    <svg aria-hidden="true" class="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7Z"/></svg>
                    {{ badge.name | t }}
                  </span>
                }
                @if (nextBadge(value); as next) {
                  <span class="rounded-full bg-sand-50 px-2.5 py-1 text-xs font-medium text-ink-muted ring-1 ring-ink/[0.06]">{{ (next.days - (value.dailyCare?.streakDays ?? 0) === 1 ? 'dashboard.badges.nextOne' : 'dashboard.badges.nextMany') | t: { badge: (next.name | t), count: next.days - (value.dailyCare?.streakDays ?? 0) } }}</span>
                }
              </div>
            </div>

            @if (celebration(value); as badge) {
              <p class="sc-celebrate mt-4 rounded-2xl bg-gradient-to-r from-ochre-50 to-leaf-50 px-4 py-3 text-sm font-semibold text-ink ring-1 ring-ochre-100" role="status" data-celebration>
                🎉 {{ 'dashboard.celebration.before' | t: { days: badge.days } }} <span class="text-ochre-700">{{ badge.name | t }}</span>{{ 'dashboard.celebration.after' | t: { name: value.patient.firstName } }}
              </p>
            }

            @if (isSunday(value)) {
              <section class="mt-4 rounded-2xl bg-ink p-4 text-white" aria-labelledby="week-recap-heading" data-week-recap>
                <h3 id="week-recap-heading" class="font-display text-lg font-semibold">{{ 'dashboard.recap.title' | t }}</h3>
                <p class="mt-1 text-sm text-white/75">
                  {{ 'dashboard.recap.active' | t: { active: activeDays(week) } }}
                  @if (weekCheckIns(); as checkIns) {
                    @if (checkIns.length) { {{ 'dashboard.recap.checkIns' | t: { count: checkIns.length, mood: averageMoodLabel(checkIns) } }} }
                  }
                  {{ 'dashboard.recap.bestStreak' | t: { days: value.dailyCare?.bestStreak ?? 0 } }}
                </p>
                <p class="mt-2 text-sm font-medium text-ochre-300">{{ recapMessage(activeDays(week)) }}</p>
              </section>
            }

            <div class="mt-4">
              <app-daily-check-in [checkIn]="value.dailyCare?.todayCheckIn" (saved)="applyProgress($event)" />
            </div>
          }

          @if (value.dailyCare && (value.todayRoutines ?? []).length) {
            <div class="mt-4 flex items-center gap-3" data-today-progress>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-sand-100" role="progressbar" [attr.aria-label]="'dashboard.today.progressLabel' | t" [attr.aria-valuenow]="doneToday(value)" aria-valuemin="0" [attr.aria-valuemax]="(value.todayRoutines ?? []).length">
                <div class="h-full rounded-full bg-gradient-to-r from-leaf-500 to-ochre-500 transition-all duration-500" [style.width.%]="(doneToday(value) / (value.todayRoutines ?? []).length) * 100"></div>
              </div>
              <p class="shrink-0 text-sm font-medium text-ink-soft">{{ 'dashboard.today.doneCount' | t: { done: doneToday(value), total: (value.todayRoutines ?? []).length } }}</p>
            </div>
            @if (doneToday(value) === (value.todayRoutines ?? []).length) {
              <p class="mt-3 rounded-2xl bg-leaf-50 px-4 py-3 text-sm font-medium text-leaf-700" role="status">{{ 'dashboard.today.allDone' | t: { name: value.patient.firstName } }}</p>
            }
          }

          @if ((value.todayRoutines ?? []).length) {
            <ol class="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              @for (routine of value.todayRoutines ?? []; track routine.reference) {
                <li class="relative flex gap-3 rounded-2xl p-4 ring-1 transition {{ routine.completedToday ? 'bg-leaf-50 ring-leaf-300' : routine.reference === nextRoutineReference() ? 'bg-ochre-50 ring-ochre-300' : 'bg-sand-50 ring-ink/[0.06]' }}">
                  <span class="grid size-10 shrink-0 place-items-center rounded-xl {{ routineTone(routine.type) }}" aria-hidden="true">
                    <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of routineIconPaths(routine.type); track $index) { <path [attr.d]="d" /> }</svg>
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold leading-snug text-ink">{{ routine.label }}</p>
                    <div class="mt-0.5 flex flex-wrap items-center gap-2">
                      <p class="text-xs text-ink-muted">{{ routine.scheduledLocalTime }} · {{ routineTypeLabel(routine.type) | t }}</p>
                      @if (routine.reference === nextRoutineReference()) {
                        <span class="rounded-full bg-ochre-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{{ 'dashboard.routines.upNext' | t }}</span>
                      }
                    </div>
                    @if (routine.instructions) { <p class="mt-1.5 text-xs leading-5 text-ink-soft">{{ routine.instructions }}</p> }
                  </div>
                  @if (value.dailyCare) {
                    <button
                      type="button"
                      (click)="toggleDone(routine)"
                      [disabled]="tickingReference() === routine.reference"
                      [attr.aria-pressed]="routine.completedToday ? 'true' : 'false'"
                      [attr.aria-label]="(routine.completedToday ? 'dashboard.routines.undoDone' : 'dashboard.routines.markDone') | t: { label: routine.label }"
                      class="grid size-10 shrink-0 place-items-center self-center rounded-full ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60 {{ routine.completedToday ? 'bg-leaf-500 text-white ring-leaf-500' : 'bg-white text-ink-muted ring-ink/15 hover:text-leaf-700 hover:ring-leaf-300' }}"
                    >
                      <svg aria-hidden="true" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                    </button>
                  }

                </li>
              }
            </ol>
            @if (routineError() && !routineManagerOpen()) { <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ routineError() | t }}</p> }
          } @else {
            <p class="mt-5 text-sm text-ink-soft">{{ 'dashboard.routines.empty' | t }}</p>
          }

          @if (availableStarters(value).length) {
            <div class="mt-4" data-starter-routines>
              @if ((value.todayRoutines ?? []).length) {
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{{ 'dashboard.routines.addAnother' | t }}</p>
              }
              <ul class="mt-2 flex flex-wrap gap-2">
                @for (starter of availableStarters(value); track starter.type) {
                  <li>
                    <button
                      type="button"
                      (click)="addStarter(starter)"
                      [disabled]="routineSaving()"
                      class="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-white py-2 pl-2 pr-4 text-sm font-semibold text-ink shadow-card transition hover:border-leaf-300 hover:bg-leaf-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
                    >
                      <span class="grid size-7 place-items-center rounded-full {{ routineTone(starter.type) }}" aria-hidden="true">
                        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">@for (d of routineIconPaths(starter.type); track $index) { <path [attr.d]="d" /> }</svg>
                      </span>
                      {{ starter.labelKey | t }}
                      <span class="text-xs font-medium text-ink-muted">{{ starter.time }}</span>
                    </button>
                  </li>
                }
              </ul>
            </div>
          }

          @if (offerReminders()) {
            <div class="mt-4 grid gap-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 sm:flex sm:items-center" role="status" data-reminder-offer>
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700" aria-hidden="true">
                  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                </span>
                <p class="min-w-0 text-sm text-ink"><strong class="font-semibold">{{ 'dashboard.reminders.question' | t }}</strong> {{ 'dashboard.reminders.body' | t }}</p>
              </div>
              <div class="flex gap-2 sm:shrink-0">
                <button type="button" (click)="enableReminders()" class="min-h-10 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">{{ 'dashboard.reminders.turnOn' | t }}</button>
                <button type="button" (click)="deviceNotifications.dismiss()" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-white">{{ 'dashboard.reminders.notNow' | t }}</button>
              </div>
            </div>
          }

          @if (routineManagerOpen()) {
            <div class="mt-5 grid gap-4 border-t border-ink/[0.07] pt-5 lg:grid-cols-[1fr_1.1fr]">
              <form [formGroup]="routineForm" (ngSubmit)="createRoutine()" class="grid gap-3 rounded-2xl bg-sand-50 p-4 ring-1 ring-ink/[0.06]">
                <h3 class="font-semibold text-ink">{{ 'dashboard.routineForm.title' | t }}</h3>
                <label class="text-sm font-medium text-ink-soft">{{ 'dashboard.routineForm.type' | t }}
                  <select formControlName="type" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink">
                    @for (type of routineTypes; track type) { <option [value]="type">{{ routineTypeLabel(type) | t }}</option> }
                  </select>
                </label>
                <label class="text-sm font-medium text-ink-soft">{{ 'dashboard.routineForm.label' | t }}
                  <input formControlName="label" maxlength="120" [placeholder]="'dashboard.routineForm.labelPlaceholder' | t" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="text-sm font-medium text-ink-soft">{{ 'dashboard.routineForm.time' | t }}<input type="time" formControlName="scheduledLocalTime" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" /></label>
                  <label class="text-sm font-medium text-ink-soft">{{ 'dashboard.routineForm.timezone' | t }}<input formControlName="timezone" readonly class="mt-1 min-h-11 w-full rounded-xl border border-ink/10 bg-sand-100 px-3 text-xs text-ink-soft" /></label>
                </div>
                <label class="text-sm font-medium text-ink-soft">{{ 'dashboard.routineForm.note' | t }}<input formControlName="instructions" maxlength="300" [placeholder]="'dashboard.routineForm.notePlaceholder' | t" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" /></label>
                @if (routineForm.controls.type.value === 'MEDICATION') {
                  <label class="flex gap-2 rounded-xl bg-ochre-50 p-3 text-xs leading-5 text-ochre-700 ring-1 ring-ochre-100">
                    <input type="checkbox" formControlName="medicationSafetyAcknowledged" class="mt-1" />
                    <span>{{ 'dashboard.routineForm.medicationAck' | t }}</span>
                  </label>
                }
                <p class="text-xs leading-5 text-ink-muted">{{ 'dashboard.routineForm.help' | t }}</p>
                @if (routineError()) { <p role="alert" class="text-sm font-semibold text-clay-700">{{ routineError() | t }}</p> }
                <button [disabled]="routineForm.invalid || routineSaving()" class="min-h-11 rounded-full bg-leaf-700 px-4 font-semibold text-white transition hover:bg-leaf-500 disabled:opacity-50">{{ (routineSaving() ? 'dashboard.routineForm.saving' : 'dashboard.routineForm.submit') | t }}</button>
              </form>

              <div class="rounded-2xl bg-white p-4 ring-1 ring-ink/[0.06]">
                <h3 class="font-semibold text-ink">{{ 'dashboard.routineList.title' | t }}</h3>
                @if (routinesLoading()) { <p role="status" class="mt-3 text-sm text-ink-soft">{{ 'dashboard.routineList.loading' | t }}</p> }
                @else if (!allRoutines().length) { <p class="mt-3 text-sm text-ink-muted">{{ 'dashboard.routineList.empty' | t }}</p> }
                @else {
                  <ul class="mt-3 divide-y divide-ink/[0.06]">
                    @for (routine of allRoutines(); track routine.reference) {
                      <li class="flex items-center justify-between gap-3 py-3">
                        <div><p class="text-sm font-semibold text-ink">{{ routine.label }}</p><p class="text-xs text-ink-muted">{{ routine.scheduledLocalTime }} · {{ (routine.enabled ? 'dashboard.routineList.active' : 'dashboard.routineList.paused') | t }}</p></div>
                        <div class="flex gap-3">
                          <button type="button" (click)="toggleRoutine(routine)" [disabled]="routineSaving()" class="text-xs font-semibold text-brand-700 underline underline-offset-2">{{ (routine.enabled ? 'dashboard.routineList.pause' : 'dashboard.routineList.resume') | t }}</button>
                          @if (routine.source === 'PATIENT') { <button type="button" (click)="deleteRoutine(routine)" [disabled]="routineSaving()" class="text-xs font-semibold text-clay-700 underline underline-offset-2">{{ 'dashboard.routineList.remove' | t }}</button> }
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          }
        </section>

        <section class="mt-4 flex gap-4 rounded-[1.5rem] bg-leaf-50 p-5 ring-1 ring-leaf-100" aria-labelledby="tip-heading" data-daily-tip>
          <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-leaf-700 shadow-card" aria-hidden="true">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/></svg>
          </span>
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-leaf-700">{{ 'dashboard.tip.eyebrow' | t }}</p>
            <h2 id="tip-heading" class="mt-1 font-semibold text-ink">{{ tip.title }}</h2>
            <p class="mt-1 text-sm leading-6 text-ink-soft">{{ tip.body }}</p>
          </div>
        </section>

        <div class="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <app-daily-quiz-card />
          @if (engagement(); as g) {
            <a routerLink="/me/progress" class="group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] bg-ink p-5 text-white shadow-lift" data-progress-tile>
              <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true"></div>
              <div class="relative">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-ochre-300">{{ 'dashboard.progress.eyebrow' | t }}</p>
                <p class="font-display mt-2 text-2xl font-semibold">{{ 'dashboard.progress.level' | t: { number: g.level.number, name: g.level.name } }}</p>
                <p class="mt-1 text-sm text-white/70">{{ 'dashboard.progress.points' | t: { points: g.points } }}@if (g.streak.current) { · {{ 'dashboard.today.streak' | t: { days: g.streak.current } }} }</p>
              </div>
              <div class="relative mt-5 flex items-center justify-between gap-3">
                <span class="flex -space-x-2" aria-hidden="true">
                  @for (b of wellnessBadges(); track b.code) {
                    <span class="grid size-9 place-items-center rounded-full bg-gradient-to-br from-ochre-300 to-ochre-500 text-xs font-bold text-ink ring-2 ring-ink">★</span>
                  } @empty {
                    <span class="text-sm text-white/60">{{ 'dashboard.progress.firstBadge' | t }}</span>
                  }
                </span>
                <span class="text-sm font-semibold text-ochre-300 group-hover:underline">{{ 'dashboard.progress.seeBadges' | t }} →</span>
              </div>
            </a>
          }
        </div>

        <nav class="mt-10" aria-labelledby="quick-access-heading">
          <div class="mb-4">
            <h2 id="quick-access-heading" class="font-display text-[1.6rem] font-semibold text-ink sm:text-[1.9rem]">
              {{ 'dashboard.quick.title' | t }}
            </h2>
            <p class="mt-1 text-sm text-ink-muted">{{ 'dashboard.quick.intro' | t }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <a routerLink="/me/book" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.checkup; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">{{ 'dashboard.quick.bookCheckup' | t }}</span>
            </a>
            <a routerLink="/me/request-care" [queryParams]="{ serviceCode: 'EMERGENCY_CONSULTATION', journey: 'doctor' }" queryParamsHandling="merge" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.doctor; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">{{ 'dashboard.quick.seeDoctor' | t }}</span>
            </a>
            <a routerLink="/me/providers" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.hospital; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">{{ 'dashboard.quick.visitHospital' | t }}</span>
            </a>
            <a routerLink="/me/prescriptions" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.medicine; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">{{ 'dashboard.quick.getMedicine' | t }}</span>
            </a>
            <a routerLink="/me/lab-tests" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.test; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">{{ 'dashboard.quick.getTest' | t }}</span>
            </a>
            <a routerLink="/me/pay-bills" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.bills; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">{{ 'dashboard.quick.payBills' | t }}</span>
            </a>
          </div>
        </nav>

        <div class="mt-10 grid gap-4 lg:grid-cols-2">
          <section aria-labelledby="your-care-heading">
            <div class="mb-3 flex items-end justify-between gap-3">
              <h2 id="your-care-heading" class="font-display text-[1.35rem] font-semibold text-ink">{{ 'dashboard.care.title' | t }}</h2>
              <a routerLink="/me/care" class="text-sm font-semibold text-brand-700 hover:text-brand-900">{{ 'dashboard.care.viewCare' | t }} →</a>
            </div>
            <div class="sc-card divide-y divide-ink/[0.06] overflow-hidden">
              <a routerLink="/me/providers" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-leaf-50 text-leaf-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5h10v16M14 9h6v12M2 21h20"/><path d="M9 2v4M7 4h4"/></svg></span>
                <span class="min-w-0 flex-1">
                  <strong class="block font-semibold text-ink">{{ (value.setup.hasConnectedProvider ? 'dashboard.care.hospitalConnected' : value.setup.hasProviderConnection ? 'dashboard.care.connectionInProgress' : 'dashboard.care.chooseHospital') | t }}</strong>
                  <span class="block text-sm text-ink-muted">{{ 'dashboard.care.hospitalBody' | t }}</span>
                </span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
              <a routerLink="/me/care" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-clay-50 text-clay-500" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.35-9.25-8.45C.9 9.2 2.48 5 6.5 5c2.1 0 3.2 1.2 3.9 2.2C11.1 6.2 12.2 5 14.5 5c4.02 0 5.6 4.2 3.75 7.55C16 16.65 12 21 12 21Z"/></svg></span>
                <span class="min-w-0 flex-1">
                  <strong class="block font-semibold text-ink">{{ (value.setup.hasCareRequest ? 'dashboard.care.activity' : 'dashboard.care.start') | t }}</strong>
                  <span class="block text-sm text-ink-muted">{{ 'dashboard.care.activityBody' | t }}</span>
                </span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
            </div>
          </section>

          <section aria-labelledby="coverage-programmes-heading">
            <div class="mb-3">
              <h2 id="coverage-programmes-heading" class="font-display text-[1.35rem] font-semibold text-ink">{{ 'dashboard.pay.title' | t }}</h2>
            </div>
            <div class="sc-card divide-y divide-ink/[0.06] overflow-hidden">
              <a routerLink="/me/pay-bills" queryParamsHandling="preserve" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12v4"/><path d="M16 13.5h1"/></svg></span>
                <span class="min-w-0 flex-1"><strong class="block font-semibold text-ink">{{ 'dashboard.pay.selfPay' | t }}</strong><span class="block text-sm text-ink-muted">{{ 'dashboard.pay.selfPayBody' | t }}</span></span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
              <a routerLink="/me/insurance" queryParamsHandling="preserve" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="M9 12l2 2 4-4"/></svg></span>
                <span class="min-w-0 flex-1"><strong class="block font-semibold text-ink">{{ 'dashboard.pay.insurance' | t }}</strong><span class="block text-sm text-ink-muted">{{ 'dashboard.pay.insuranceBody' | t }}</span></span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
              <a routerLink="/healthy-families" queryParamsHandling="preserve" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M2 20a5 5 0 0 1 10 0M12 20a5 5 0 0 1 10 0"/></svg></span>
                <span class="min-w-0 flex-1"><strong class="block font-semibold text-ink">{{ 'dashboard.pay.programmes' | t }}</strong><span class="block text-sm text-ink-muted">{{ 'dashboard.pay.programmesBody' | t }}</span></span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
            </div>
            <p class="mt-2 px-1 text-xs leading-5 text-ink-muted">{{ 'dashboard.pay.subscriptionNote' | t }}</p>
          </section>
        </div>

        <div class="mt-4 grid gap-4 lg:grid-cols-12">
          <section class="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-ochre-50 via-white to-sand-100 p-6 ring-1 ring-ochre-100 sm:p-7 lg:col-span-8" aria-labelledby="health-check-summary-heading">
            <div class="sc-motif-ink pointer-events-none absolute -right-10 -top-10 size-56 rounded-full opacity-[0.07]" aria-hidden="true"></div>
            <div class="relative">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ochre-700">{{ 'dashboard.healthChecks.eyebrow' | t }}</p>
              <h2 id="health-check-summary-heading" class="font-display mt-2 max-w-xl text-[1.5rem] font-semibold leading-tight text-ink sm:text-[1.75rem]">
                {{ 'dashboard.healthChecks.title' | t }}
              </h2>
              @if (healthChecks()?.items?.length === 0) {
                <p class="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                  {{ 'dashboard.healthChecks.emptyBody' | t }}
                </p>
                <a routerLink="/me/health-journey" class="mt-5 inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-brand-900">
                  {{ 'dashboard.healthChecks.cta' | t }} →
                </a>
              } @else {
                <p class="mt-2 text-sm text-ink-soft">{{ 'dashboard.healthChecks.summaryIntro' | t }}</p>
                <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  @for (item of healthCheckSummary(); track item.label) {
                    <article class="rounded-2xl bg-white/80 p-3.5 ring-1 ring-ink/[0.06]">
                      <p class="font-display text-2xl font-semibold text-ink">{{ item.count }}</p>
                      <p class="mt-0.5 text-xs font-medium text-ink-muted">{{ item.label | t }}</p>
                    </article>
                  }
                </div>
                <a routerLink="/me/health-checks" class="mt-4 inline-block text-sm font-semibold text-brand-700 underline underline-offset-4">{{ 'dashboard.healthChecks.viewAll' | t }} →</a>
              }
            </div>
          </section>

          <section class="sc-card flex flex-col p-6 lg:col-span-4" aria-labelledby="impact-heading">
            <div class="flex items-start justify-between gap-4">
              <span class="grid size-11 place-items-center rounded-2xl bg-leaf-50 text-leaf-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.35-9.25-8.45C.9 9.2 2.48 5 6.5 5c2.1 0 3.2 1.2 3.9 2.2C11.1 6.2 12.2 5 14.5 5c4.02 0 5.6 4.2 3.75 7.55C16 16.65 12 21 12 21Z"/><path d="M9 12h6M12 9v6"/></svg></span>
              <a routerLink="/me/impact" class="text-sm font-semibold text-brand-700 hover:text-brand-900">{{ 'dashboard.impact.view' | t }} →</a>
            </div>
            <h2 id="impact-heading" class="font-display mt-4 text-[1.25rem] font-semibold leading-snug text-ink">{{ 'dashboard.impact.title' | t }}</h2>
            <p class="mt-1 text-sm leading-6 text-ink-muted">{{ 'dashboard.impact.body' | t }}</p>
            @if (referrals(); as rewards) {
              <p class="mt-auto pt-4 text-sm font-semibold text-ink">
                <span class="font-display text-2xl">{{ rewards.balances.availablePoints }}</span> {{ 'dashboard.impact.points' | t }}
                @if (rewards.leaderboard.optedIn && rewards.leaderboard.position !== null) { <span class="text-ink-muted">· #{{ rewards.leaderboard.position }}</span> }
              </p>
            }
          </section>
        </div>

        @if (supportWhatsappUrl) {
          <a
            [href]="supportWhatsappUrl"
            class="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 grid size-12 place-items-center overflow-hidden rounded-full bg-[#128c7e] text-xs font-bold text-white shadow-lg focus:ring-4 focus:ring-emerald-200 lg:bottom-4"
             [attr.aria-label]="'dashboard.help.whatsapp' | t" [attr.title]="'dashboard.help.whatsapp' | t">?</a
          >
        }
      }
    </main>
  `,
})
export class PatientDashboardPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(TranslationService);
  private readonly api = inject(PatientDashboardApiService);
  private readonly healthChecksApi = inject(HealthCheckResultsApiService);
  private readonly referralsApi = inject(ReferralsApiService);
  private readonly passportApi = inject(HealthPassportApiService);
  private readonly engagementApi = inject(EngagementApiService);
  readonly engagement = this.engagementApi.latest;
  readonly wellnessBadges = computed(() => (this.engagement()?.badges ?? []).filter((b) => b.earned).slice(0, 4));
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
  readonly routineManagerOpen = signal(false);
  readonly allRoutines = signal<PatientDailyRoutine[]>([]);
  readonly routinesLoading = signal(false);
  readonly routineSaving = signal(false);
  readonly routineError = signal('');
  readonly tickingReference = signal<string | null>(null);
  readonly deviceNotifications = inject(DeviceNotificationsService);
  readonly tip = tipForDate(new Date());
  readonly weekCheckIns = signal<readonly DailyCheckIn[] | null>(null);
  /** Offer device reminders only after the patient has at least one routine. */
  readonly offerReminders = computed(
    () => (this.dashboard()?.todayRoutines ?? []).length > 0 && this.deviceNotifications.canOffer(),
  );
  readonly routineTypes: readonly PatientDailyRoutineType[] = ['HYDRATION', 'MOVEMENT', 'BREAK', 'SLEEP', 'VITAMIN', 'MEDICATION'];
  readonly routineForm = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<PatientDailyRoutineType>('HYDRATION'),
    label: ['', [Validators.required, Validators.maxLength(120)]],
    scheduledLocalTime: ['09:00', Validators.required],
    timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos', Validators.required],
    instructions: ['', Validators.maxLength(300)],
    medicationSafetyAcknowledged: false,
  });
  readonly today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  readonly greeting = signal(PatientDashboardPageComponent.greetingFor(new Date().getHours()));
  readonly nextRoutineReference = computed(() => {
    const routines = this.dashboard()?.todayRoutines ?? [];
    const now = new Date();
    const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return [...routines]
      .filter((routine) => routine.enabled && !routine.completedToday && routine.scheduledLocalTime.slice(0, 5) >= current)
      .sort((a, b) => a.scheduledLocalTime.localeCompare(b.scheduledLocalTime))[0]?.reference ?? null;
  });
  readonly icons = {
    checkup: ['M4 6h16v14H4Z', 'M8 3v6M16 3v6M4 10h16', 'M12 13v4M10 15h4'],
    doctor: ['M6 3v5a4 4 0 0 0 8 0V3', 'M10 12v3a5 5 0 0 0 10 0v-2', 'M20 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'],
    hospital: ['M4 21V5h10v16M14 9h6v12M2 21h20', 'M9 2v4M7 4h4', 'M8 13h2M8 17h2M17 13h1M17 17h1'],
    medicine: ['M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7Z', 'M7 10l7 7'],
    test: ['M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3', 'M7.5 15h9'],
    bills: ['M3 6h18v12H3Z', 'M3 10h18M7 15h3'],
  } as const;
  readonly supportWhatsappUrl = this.publicSiteConfig?.whatsappUrl?.trim() || null;
  readonly healthCheckSummary = computed(() => {
    const items = this.healthChecks()?.items ?? [];
    const count = (category: string) =>
      items.filter((item) => item.portalCategory === category).length;
    return [
      { label: 'dashboard.healthChecks.awaitingPayment', count: count('AWAITING_PAYMENT') },
      { label: 'dashboard.healthChecks.upcoming', count: count('UPCOMING_ACTIVE') },
      { label: 'dashboard.healthChecks.completed', count: count('COMPLETED_HISTORY') },
      { label: 'dashboard.healthChecks.needsAttention', count: count('NEEDS_ATTENTION') },
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
      .subscribe({
        next: (value) => {
          this.dashboard.set(value);
          if (this.isSunday(value)) this.loadWeekCheckIns();
        },
        error: () => this.error.set(true),
      });
  }
  loadWeekCheckIns(): void {
    this.api.getCheckIns(7, this.routineForm.controls.timezone.value).subscribe({
      next: ({ items }) => this.weekCheckIns.set(items),
      error: () => this.weekCheckIns.set(null),
    });
  }
  toggleRoutineManager(): void {
    this.routineManagerOpen.update((open) => !open);
    if (this.routineManagerOpen()) this.loadRoutines();
  }
  loadRoutines(): void {
    this.routinesLoading.set(true);
    this.routineError.set('');
    this.api.getDailyRoutines().pipe(finalize(() => this.routinesLoading.set(false))).subscribe({
      next: ({ items }) => this.allRoutines.set(items),
      error: () => this.routineError.set('dashboard.routineError.unavailable'),
    });
  }
  createRoutine(): void {
    if (this.routineForm.invalid || this.routineSaving()) return;
    const value = this.routineForm.getRawValue();
    if (value.type === 'MEDICATION' && !value.medicationSafetyAcknowledged) {
      this.routineError.set('dashboard.routineError.confirmMedication');
      return;
    }
    this.routineSaving.set(true);
    this.routineError.set('');
    this.api.createDailyRoutine({ ...value, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], instructions: value.instructions.trim() || null }).pipe(finalize(() => this.routineSaving.set(false))).subscribe({
      next: () => {
        this.routineForm.patchValue({ label: '', instructions: '', medicationSafetyAcknowledged: false });
        this.loadRoutines();
        this.load();
      },
      error: () => this.routineError.set('dashboard.routineError.saveFailed'),
    });
  }
  availableStarters(value: PatientDashboard): readonly StarterRoutine[] {
    const routines = value.todayRoutines ?? [];
    if (routines.length >= 3) return [];
    const taken = new Set(routines.map((routine) => routine.type));
    return STARTER_ROUTINES.filter((starter) => !taken.has(starter.type));
  }
  addStarter(starter: StarterRoutine): void {
    if (this.routineSaving()) return;
    this.routineSaving.set(true);
    this.routineError.set('');
    this.api
      .createDailyRoutine({
        type: starter.type,
        label: this.i18n.t(starter.labelKey),
        scheduledLocalTime: starter.time,
        timezone: this.routineForm.controls.timezone.value,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        instructions: null,
      })
      .pipe(finalize(() => this.routineSaving.set(false)))
      .subscribe({
        next: () => this.load(),
        error: () => this.routineError.set('dashboard.routineError.addFailed'),
      });
  }
  async enableReminders(): Promise<void> {
    const result = await this.deviceNotifications.enable();
    if (result === 'denied') this.deviceNotifications.dismiss();
  }
  doneToday(value: PatientDashboard): number {
    return (value.todayRoutines ?? []).filter((routine) => routine.completedToday).length;
  }
  toggleDone(routine: PatientDailyRoutine): void {
    if (this.tickingReference()) return;
    this.tickingReference.set(routine.reference);
    this.routineError.set('');
    const request = routine.completedToday
      ? this.api.undoRoutineToday(routine.reference)
      : this.api.completeRoutineToday(routine.reference);
    request.pipe(finalize(() => this.tickingReference.set(null))).subscribe({
      next: (progress) => this.applyProgress(progress),
      error: () => this.routineError.set('dashboard.routineError.tickFailed'),
    });
  }
  applyProgress(progress: DailyCareProgress): void {
    // Check-ins and routines earn wellness points; refresh quietly if the numbers are on screen.
    if (this.engagement()) this.engagementApi.overview().subscribe({ error: () => undefined });
    const done = new Set(progress.completedReferences);
    this.dashboard.update((value) =>
      value
        ? {
            ...value,
            dailyCare: progress,
            todayRoutines: (value.todayRoutines ?? []).map((item) => ({
              ...item,
              completedToday: done.has(item.reference),
            })),
          }
        : value,
    );
  }
  earnedBadges(value: PatientDashboard): readonly StreakBadge[] {
    const best = value.dailyCare?.bestStreak ?? 0;
    return STREAK_BADGES.filter((badge) => best >= badge.days);
  }
  nextBadge(value: PatientDashboard): StreakBadge | null {
    const current = value.dailyCare?.streakDays ?? 0;
    return STREAK_BADGES.find((badge) => badge.days > current) ?? null;
  }
  /** A milestone reached exactly today, while today is active. */
  celebration(value: PatientDashboard): StreakBadge | null {
    const care = value.dailyCare;
    if (!care?.week?.at(-1)?.active) return null;
    return STREAK_BADGES.find((badge) => badge.days === care.streakDays) ?? null;
  }
  isSunday(value: PatientDashboard): boolean {
    const today = value.dailyCare?.localDate;
    return !!today && new Date(`${today}T12:00:00Z`).getUTCDay() === 0;
  }
  activeDays(week: readonly { active: boolean }[]): number {
    return week.filter((day) => day.active).length;
  }
  averageMoodLabel(checkIns: readonly DailyCheckIn[]): string {
    const average = checkIns.reduce((sum, item) => sum + item.mood, 0) / checkIns.length;
    return this.i18n.t(MOOD_LABELS[Math.min(5, Math.max(1, Math.round(average)))]);
  }
  recapMessage(active: number): string {
    if (active === 7) return this.i18n.t('dashboard.recap.perfect');
    if (active >= 4) return this.i18n.t('dashboard.recap.strong');
    if (active >= 1) return this.i18n.t('dashboard.recap.someDays');
    return this.i18n.t('dashboard.recap.fresh');
  }
  weekdayInitial(localDate: string): string {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(`${localDate}T12:00:00Z`));
  }
  weekdayName(localDate: string): string {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${localDate}T12:00:00Z`));
  }
  toggleRoutine(routine: PatientDailyRoutine): void {
    if (this.routineSaving()) return;
    this.routineSaving.set(true);
    this.api.updateDailyRoutine(routine.reference, { enabled: !routine.enabled }).pipe(finalize(() => this.routineSaving.set(false))).subscribe({
      next: () => { this.loadRoutines(); this.load(); },
      error: () => this.routineError.set('dashboard.routineError.updateFailed'),
    });
  }
  deleteRoutine(routine: PatientDailyRoutine): void {
    if (this.routineSaving()) return;
    this.routineSaving.set(true);
    this.api.deleteDailyRoutine(routine.reference).pipe(finalize(() => this.routineSaving.set(false))).subscribe({
      next: () => { this.loadRoutines(); this.load(); },
      error: () => this.routineError.set('dashboard.routineError.removeFailed'),
    });
  }
  /** Translation key for a routine type. */
  routineTypeLabel(type: PatientDailyRoutineType): string {
    return ({
      HYDRATION: 'dashboard.routineType.hydration',
      MOVEMENT: 'dashboard.routineType.movement',
      BREAK: 'dashboard.routineType.break',
      SLEEP: 'dashboard.routineType.sleep',
      VITAMIN: 'dashboard.routineType.vitamin',
      MEDICATION: 'dashboard.routineType.medication',
    } as const)[type];
  }
  /** Translation key for the greeting; it takes {name}. */
  static greetingFor(hour: number): string {
    if (hour < 12) return 'dashboard.greeting.morning';
    if (hour < 17) return 'dashboard.greeting.afternoon';
    return 'dashboard.greeting.evening';
  }
  routineIconPaths(type: PatientDailyRoutineType): readonly string[] {
    return ({
      HYDRATION: ['M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z'],
      MOVEMENT: ['M13 4a1.5 1.5 0 1 0 0 .01', 'M9 21l2-6 3 3v3M7 12l3-3 3 1 2 3h3M10 9l1 6'],
      BREAK: ['M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z', 'M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3'],
      SLEEP: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z'],
      VITAMIN: ['M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7Z', 'M7 10l7 7'],
      MEDICATION: ['M6 3h12v4H6Z', 'M7 7h10v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1Z', 'M10 13h4M12 11v4'],
    } as const)[type];
  }
  routineTone(type: PatientDailyRoutineType): string {
    return ({
      HYDRATION: 'bg-sky-100 text-sky-700',
      MOVEMENT: 'bg-leaf-100 text-leaf-700',
      BREAK: 'bg-ochre-100 text-ochre-700',
      SLEEP: 'bg-brand-100 text-brand-700',
      VITAMIN: 'bg-clay-100 text-clay-700',
      MEDICATION: 'bg-brand-100 text-brand-800',
    } as const)[type];
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
          title: 'dashboard.nextStep.completeProfile.title',
          message: 'dashboard.nextStep.completeProfile.message',
          label: 'dashboard.nextStep.completeProfile.label',
          route: '/me/profile',
        };
      case 'VIEW_APPOINTMENT':
        return {
          title: 'dashboard.nextStep.viewAppointment.title',
          message: 'dashboard.nextStep.viewAppointment.message',
          label: 'dashboard.nextStep.viewAppointment.label',
          route:
            resource?.domain === 'CARE_APPOINTMENT' && hasReference
              ? ['/me/care/appointments', resource.reference]
              : '/me/care',
        };
      case 'COMPLETE_PAYMENT':
        return {
          title: 'dashboard.nextStep.completePayment.title',
          message: 'dashboard.nextStep.completePayment.message',
          label: 'dashboard.nextStep.completePayment.label',
          route: this.paymentContinuationRoute(resource),
        };
      case 'CONTINUE_SELF_CHECK':
        return {
          title: 'dashboard.nextStep.continueSelfCheck.title',
          message: 'dashboard.nextStep.continueSelfCheck.message',
          label: 'dashboard.nextStep.continueSelfCheck.label',
          route:
            resource?.domain === 'GUIDED_SELF_CHECK' && hasReference
              ? ['/me/self-checks', resource.reference]
              : '/me/self-checks',
        };
      case 'VIEW_HEALTH_CHECK':
        return {
          title: 'dashboard.nextStep.viewHealthCheck.title',
          message: 'dashboard.nextStep.viewHealthCheck.message',
          label: 'dashboard.nextStep.viewHealthCheck.label',
          route:
            resource?.domain === 'HEALTH_CHECK' && hasReference
              ? ['/me/health-checks', resource.reference]
              : '/me/health-checks',
        };
      case 'FIND_CARE':
        return {
          title: 'dashboard.nextStep.findCare.title',
          message: 'dashboard.nextStep.findCare.message',
          label: 'dashboard.nextStep.findCare.label',
          route:
            resource?.domain === 'CARE_REQUEST' && hasReference
              ? ['/me/care', resource.reference]
              : '/me/request-care',
        };
      case 'VIEW_PROVIDER_CONNECTION':
        return {
          title: 'dashboard.nextStep.viewConnection.title',
          message: 'dashboard.nextStep.viewConnection.message',
          label: 'dashboard.nextStep.viewConnection.label',
          route:
            resource?.domain === 'PROVIDER_CONNECTION' && hasReference
              ? ['/me/providers', resource.reference]
              : '/me/providers',
        };
      case 'NONE':
        return {
          title: 'dashboard.nextStep.none.title',
          message: 'dashboard.nextStep.none.message',
          label: 'dashboard.nextStep.none.label',
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
        title: 'dashboard.nextStep.completeProfile.title',
        message: 'dashboard.nextStep.completeProfileLegacy.message',
        label: 'dashboard.nextStep.completeProfileLegacy.label',
        route: '/me/profile',
      },
      CONNECT_PROVIDER: {
        title: 'dashboard.nextStep.connectProvider.title',
        message: 'dashboard.nextStep.connectProvider.message',
        label: 'dashboard.nextStep.connectProvider.label',
        route: '/me/providers/connect',
      },
      VIEW_PROVIDER_CONNECTION: {
        title: 'dashboard.nextStep.viewConnectionLegacy.title',
        message: 'dashboard.nextStep.viewConnectionLegacy.message',
        label: 'dashboard.nextStep.viewConnectionLegacy.label',
        route: '/me/providers',
      },
      FIND_CARE: {
        title: 'dashboard.nextStep.findCareLegacy.title',
        message: 'dashboard.nextStep.findCareLegacy.message',
        label: 'dashboard.nextStep.findCareLegacy.label',
        route: '/me/request-care',
      },
      VIEW_APPOINTMENT: {
        title: 'dashboard.nextStep.viewAppointment.title',
        message: 'dashboard.nextStep.viewAppointment.message',
        label: 'dashboard.nextStep.viewAppointment.label',
        route: '/me/care',
      },
      COMPLETE_PAYMENT: {
        title: 'dashboard.nextStep.completePayment.title',
        message: 'dashboard.nextStep.completePayment.message',
        label: 'dashboard.nextStep.completePayment.label',
        route: '/me/care',
      },
      CONTINUE_SELF_CHECK: {
        title: 'dashboard.nextStep.continueSelfCheck.title',
        message: 'dashboard.nextStep.continueSelfCheck.message',
        label: 'dashboard.nextStep.continueSelfCheck.label',
        route: '/me/self-checks',
      },
      VIEW_HEALTH_CHECK: {
        title: 'dashboard.nextStep.viewHealthCheck.title',
        message: 'dashboard.nextStep.viewHealthCheck.message',
        label: 'dashboard.nextStep.viewHealthCheck.label',
        route: '/me/health-checks',
      },
      NONE: {
        title: 'dashboard.nextStep.noneLegacy.title',
        message: 'dashboard.nextStep.noneLegacy.message',
        label: 'dashboard.nextStep.none.label',
        route: '/me/health-journey',
      },
    };
    return actions[action] ?? actions.NONE;
  }
  completedSteps(value: PatientDashboard): number {
    return this.checklist(value).filter((step) => step.complete).length;
  }
  checklist(value: PatientDashboard) {
    return [
      { label: 'dashboard.setup.accountCreated', complete: value.setup.accountCreated, route: '/me/profile' },
      { label: 'dashboard.setup.completeProfile', complete: value.setup.profileComplete, route: '/me/profile' },
      { label: 'dashboard.setup.connectProvider', complete: value.setup.hasConnectedProvider, route: '/me/providers/connect' },
      {
        label: 'dashboard.setup.firstCare',
        complete: value.setup.hasStartedCareJourney,
        route: '/me/health-journey',
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
          REPORTED_BY_YOU: this.i18n.t('dashboard.provenance.reportedByYou'),
          CHECKED_BY_PROVIDER: this.i18n.t('dashboard.provenance.checkedByProvider'),
          CONFIRMED_BY_LABORATORY: this.i18n.t('dashboard.provenance.confirmedByLaboratory'),
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
    this.i18n.t('dashboard.invite.whatsappText', { url: inviteUrl }),
  )}`;
}
  async copyPatientId(): Promise<void> {
    await this.copy(
      this.dashboard()?.patient.patientReference ?? '',
      'dashboard.copy.patientId',
      this.copyFeedback,
    );
  }
  async copyReferralCode(): Promise<void> {
    await this.copy(
      this.referrals()?.referralCode ?? '',
      'dashboard.copy.referralCode',
      this.referralFeedback,
    );
  }
async copyReferralLink(): Promise<void> {
  await this.copy(
    this.patientInviteUrl(),
    'dashboard.copy.inviteLink',
    this.referralFeedback,
  );
}
  private async copy(
    value: string,
    /** Translation key shown when the copy works. */
    success: string,
    feedback: { set(value: string): void },
  ): Promise<void> {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      feedback.set(success);
    } catch {
      feedback.set('dashboard.copy.failed');
    }
  }
}
