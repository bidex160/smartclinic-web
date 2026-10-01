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
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-8 sm:pt-8 lg:pt-10">
      @if (loading()) {
        <section role="status" aria-live="polite" class="animate-pulse space-y-4">
          <span class="sr-only">Loading your dashboard…</span>
          <div class="h-16 w-2/3 rounded-2xl bg-sand-200"></div>
          <div class="h-52 rounded-[1.75rem] bg-sand-200"></div>
          <div class="h-40 rounded-[1.75rem] bg-sand-100"></div>
        </section>
      } @else if (error()) {
        <section role="alert" class="sc-card p-6">
          <h1 class="font-display text-2xl font-semibold text-ink">Your dashboard is unavailable right now</h1>
          <p class="mt-2 text-ink-soft">Check your connection and try again.</p>
          <button type="button" (click)="load()" class="mt-4 rounded-full bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">Retry</button>
        </section>
      } @else if (dashboard(); as value) {
        <header class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p class="text-sm font-medium text-ink-muted">{{ today }}</p>
            <h1 class="font-display mt-1 text-[2rem] font-semibold leading-[1.1] text-ink sm:text-[2.6rem]">
              {{ greeting() }}, {{ value.patient.firstName }}
            </h1>
          </div>
          <div class="flex items-center gap-2 rounded-full border border-ink/[0.08] bg-white py-1.5 pl-4 pr-1.5 shadow-card">
            <p class="text-sm text-ink-soft">
              SmartClinic ID: <strong class="font-mono font-semibold tracking-wide text-ink">{{ value.patient.patientReference }}</strong>
            </p>
            <button type="button" (click)="copyPatientId()" class="min-h-9 rounded-full bg-sand-100 px-3.5 text-xs font-semibold text-ink transition hover:bg-sand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              Copy ID
            </button>
          </div>
          <p aria-live="polite" class="w-full text-sm font-medium text-leaf-700 empty:hidden">{{ copyFeedback() }}</p>
        </header>

        <div class="mt-6 grid gap-4 lg:grid-cols-12">
          <section class="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-white shadow-lift sm:p-8 lg:col-span-7" aria-labelledby="next-step-heading">
            <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true"></div>
            <div class="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-brand-600/40 blur-3xl" aria-hidden="true"></div>
            <div class="pointer-events-none absolute -bottom-28 left-10 size-64 rounded-full bg-ochre-500/20 blur-3xl" aria-hidden="true"></div>
            <div class="relative">
              <p class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ochre-300">
                <span class="size-1.5 rounded-full bg-ochre-300"></span>Your next step
              </p>
              <h2 id="next-step-heading" class="font-display mt-3 text-[1.7rem] font-semibold leading-tight sm:text-[2rem]">
                {{ nextStep(value).title }}
              </h2>
              <p class="mt-2 max-w-md text-[15px] leading-relaxed text-white/75">{{ nextStep(value).message }}</p>
              <a [routerLink]="nextStep(value).route" class="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink transition hover:bg-ochre-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40">
                {{ nextStep(value).label }} <span aria-hidden="true">→</span>
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
              <h2 id="passport-heading" class="font-display mt-3 text-[1.45rem] font-semibold leading-tight">Your health story, wherever you go.</h2>
              <p class="mt-2 text-sm leading-relaxed text-white/70">Records, results, prescriptions and care history in one place — shared only when you choose.</p>
              <div class="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                <div>
                  <p class="text-[11px] uppercase tracking-[0.16em] text-white/55">Holder</p>
                  <p class="font-semibold">{{ value.patient.displayName }}</p>
                </div>
                <a routerLink="/me/health-passport" class="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/15 px-4 text-sm font-semibold ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25">
                  Open Health Passport <span aria-hidden="true">→</span>
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
                Today
              </p>
              <h2 id="today-care-heading" class="font-display mt-1.5 text-[1.45rem] font-semibold text-ink">Small things that keep you well</h2>
              <p class="mt-1 text-sm leading-6 text-ink-muted">Optional routines you choose. Clinical actions above always remain the priority.</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              @if (value.dailyCare; as care) {
                @if (care.streakDays > 0) {
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-ochre-50 px-3 py-1.5 text-sm font-semibold text-ochre-700 ring-1 ring-ochre-100" data-streak>
                    <svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-2.7 7-7 0-3.5-2.5-6.5-4-8-.5 2-1.5 3.5-3 4.5C12 8 11 4.5 8.5 2 9 6 5 9 5 15c0 4.3 3 7 7 7Z"/></svg>
                    {{ care.streakDays }}-day streak
                  </span>
                }
              }
              <button type="button" (click)="toggleRoutineManager()" class="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sand-100">
                {{ routineManagerOpen() ? 'Close' : 'Manage' }}
              </button>
            </div>
          </div>

          @if (value.dailyCare && (value.todayRoutines ?? []).length) {
            <div class="mt-4 flex items-center gap-3" data-today-progress>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-sand-100" role="progressbar" aria-label="Routines done today" [attr.aria-valuenow]="doneToday(value)" aria-valuemin="0" [attr.aria-valuemax]="(value.todayRoutines ?? []).length">
                <div class="h-full rounded-full bg-gradient-to-r from-leaf-500 to-ochre-500 transition-all duration-500" [style.width.%]="(doneToday(value) / (value.todayRoutines ?? []).length) * 100"></div>
              </div>
              <p class="shrink-0 text-sm font-medium text-ink-soft">{{ doneToday(value) }} of {{ (value.todayRoutines ?? []).length }} done today</p>
            </div>
            @if (doneToday(value) === (value.todayRoutines ?? []).length) {
              <p class="mt-3 rounded-2xl bg-leaf-50 px-4 py-3 text-sm font-medium text-leaf-700" role="status">All done for today — well done, {{ value.patient.firstName }}. Come back tomorrow to keep your streak going.</p>
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
                      <p class="text-xs text-ink-muted">{{ routine.scheduledLocalTime }} · {{ routineTypeLabel(routine.type) }}</p>
                      @if (routine.reference === nextRoutineReference()) {
                        <span class="rounded-full bg-ochre-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Up next</span>
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
                      [attr.aria-label]="(routine.completedToday ? 'Undo done: ' : 'Mark done: ') + routine.label"
                      class="grid size-10 shrink-0 place-items-center self-center rounded-full ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60 {{ routine.completedToday ? 'bg-leaf-500 text-white ring-leaf-500' : 'bg-white text-ink-muted ring-ink/15 hover:text-leaf-700 hover:ring-leaf-300' }}"
                    >
                      <svg aria-hidden="true" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                    </button>
                  }

                </li>
              }
            </ol>
            @if (routineError() && !routineManagerOpen()) { <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ routineError() }}</p> }
          } @else {
            <div class="mt-5 flex items-center gap-4 rounded-2xl border border-dashed border-sand-300 bg-sand-50 p-5">
              <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-leaf-700" aria-hidden="true">
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </span>
              <p class="text-sm text-ink-soft">No routine added yet. Add only what would genuinely help you — water, a walk, your medicine.</p>
            </div>
          }

          @if (routineManagerOpen()) {
            <div class="mt-5 grid gap-4 border-t border-ink/[0.07] pt-5 lg:grid-cols-[1fr_1.1fr]">
              <form [formGroup]="routineForm" (ngSubmit)="createRoutine()" class="grid gap-3 rounded-2xl bg-sand-50 p-4 ring-1 ring-ink/[0.06]">
                <h3 class="font-semibold text-ink">Add a routine</h3>
                <label class="text-sm font-medium text-ink-soft">Type
                  <select formControlName="type" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink">
                    @for (type of routineTypes; track type) { <option [value]="type">{{ routineTypeLabel(type) }}</option> }
                  </select>
                </label>
                <label class="text-sm font-medium text-ink-soft">What should SmartClinic show you?
                  <input formControlName="label" maxlength="120" placeholder="e.g. Take my evening medicine" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="text-sm font-medium text-ink-soft">Time<input type="time" formControlName="scheduledLocalTime" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" /></label>
                  <label class="text-sm font-medium text-ink-soft">Time zone<input formControlName="timezone" readonly class="mt-1 min-h-11 w-full rounded-xl border border-ink/10 bg-sand-100 px-3 text-xs text-ink-soft" /></label>
                </div>
                <label class="text-sm font-medium text-ink-soft">Helpful note (optional)<input formControlName="instructions" maxlength="300" placeholder="Keep it short" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" /></label>
                @if (routineForm.controls.type.value === 'MEDICATION') {
                  <label class="flex gap-2 rounded-xl bg-ochre-50 p-3 text-xs leading-5 text-ochre-700 ring-1 ring-ochre-100">
                    <input type="checkbox" formControlName="medicationSafetyAcknowledged" class="mt-1" />
                    <span>I will follow the prescription or clinician’s instructions. This personal reminder does not replace medical advice.</span>
                  </label>
                }
                <p class="text-xs leading-5 text-ink-muted">Shown every day. You can pause or remove it anytime. Hydration needs differ; follow any fluid restriction given by your clinician.</p>
                @if (routineError()) { <p role="alert" class="text-sm font-semibold text-clay-700">{{ routineError() }}</p> }
                <button [disabled]="routineForm.invalid || routineSaving()" class="min-h-11 rounded-full bg-leaf-700 px-4 font-semibold text-white transition hover:bg-leaf-500 disabled:opacity-50">{{ routineSaving() ? 'Saving…' : 'Add routine' }}</button>
              </form>

              <div class="rounded-2xl bg-white p-4 ring-1 ring-ink/[0.06]">
                <h3 class="font-semibold text-ink">Your routines</h3>
                @if (routinesLoading()) { <p role="status" class="mt-3 text-sm text-ink-soft">Loading routines…</p> }
                @else if (!allRoutines().length) { <p class="mt-3 text-sm text-ink-muted">You have no saved routines.</p> }
                @else {
                  <ul class="mt-3 divide-y divide-ink/[0.06]">
                    @for (routine of allRoutines(); track routine.reference) {
                      <li class="flex items-center justify-between gap-3 py-3">
                        <div><p class="text-sm font-semibold text-ink">{{ routine.label }}</p><p class="text-xs text-ink-muted">{{ routine.scheduledLocalTime }} · {{ routine.enabled ? 'Active' : 'Paused' }}</p></div>
                        <div class="flex gap-3">
                          <button type="button" (click)="toggleRoutine(routine)" [disabled]="routineSaving()" class="text-xs font-semibold text-brand-700 underline underline-offset-2">{{ routine.enabled ? 'Pause' : 'Resume' }}</button>
                          @if (routine.source === 'PATIENT') { <button type="button" (click)="deleteRoutine(routine)" [disabled]="routineSaving()" class="text-xs font-semibold text-clay-700 underline underline-offset-2">Remove</button> }
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          }
        </section>

        <nav class="mt-10" aria-labelledby="quick-access-heading">
          <div class="mb-4">
            <h2 id="quick-access-heading" class="font-display text-[1.6rem] font-semibold text-ink sm:text-[1.9rem]">
              What do you need today?
            </h2>
            <p class="mt-1 text-sm text-ink-muted">Choose what you want to do. We’ll guide you from there.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <a routerLink="/me/book" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.checkup; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">Book a Checkup</span>
            </a>
            <a routerLink="/me/request-care" [queryParams]="{ serviceCode: 'EMERGENCY_CONSULTATION', journey: 'doctor' }" queryParamsHandling="merge" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.doctor; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">See a Doctor</span>
            </a>
            <a routerLink="/me/providers" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.hospital; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">Visit a Hospital</span>
            </a>
            <a routerLink="/me/prescriptions" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.medicine; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">Get Medicine</span>
            </a>
            <a routerLink="/me/lab-tests" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.test; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">Get a Test</span>
            </a>
            <a routerLink="/me/pay-bills" queryParamsHandling="preserve" class="sc-tile group flex min-h-[124px] flex-col justify-between rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 text-left shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <span class="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white"><svg aria-hidden="true" class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">@for (d of icons.bills; track $index) { <path [attr.d]="d" /> }</svg></span>
              <span class="text-[15px] font-semibold leading-snug text-ink">Pay Bills</span>
            </a>
          </div>
        </nav>

        <div class="mt-10 grid gap-4 lg:grid-cols-2">
          <section aria-labelledby="your-care-heading">
            <div class="mb-3 flex items-end justify-between gap-3">
              <h2 id="your-care-heading" class="font-display text-[1.35rem] font-semibold text-ink">Your care, connected</h2>
              <a routerLink="/me/care" class="text-sm font-semibold text-brand-700 hover:text-brand-900">View care →</a>
            </div>
            <div class="sc-card divide-y divide-ink/[0.06] overflow-hidden">
              <a routerLink="/me/providers" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-leaf-50 text-leaf-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5h10v16M14 9h6v12M2 21h20"/><path d="M9 2v4M7 4h4"/></svg></span>
                <span class="min-w-0 flex-1">
                  <strong class="block font-semibold text-ink">{{ value.setup.hasConnectedProvider ? 'Hospital connected' : value.setup.hasProviderConnection ? 'Connection in progress' : 'Choose a hospital' }}</strong>
                  <span class="block text-sm text-ink-muted">Your hospital companion for visits, bills and records</span>
                </span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
              <a routerLink="/me/care" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-clay-50 text-clay-500" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.35-9.25-8.45C.9 9.2 2.48 5 6.5 5c2.1 0 3.2 1.2 3.9 2.2C11.1 6.2 12.2 5 14.5 5c4.02 0 5.6 4.2 3.75 7.55C16 16.65 12 21 12 21Z"/></svg></span>
                <span class="min-w-0 flex-1">
                  <strong class="block font-semibold text-ink">{{ value.setup.hasCareRequest ? 'Care activity' : 'Start your care' }}</strong>
                  <span class="block text-sm text-ink-muted">Appointments, requests and conversations</span>
                </span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
            </div>
          </section>

          <section aria-labelledby="coverage-programmes-heading">
            <div class="mb-3">
              <h2 id="coverage-programmes-heading" class="font-display text-[1.35rem] font-semibold text-ink">How you pay for care</h2>
            </div>
            <div class="sc-card divide-y divide-ink/[0.06] overflow-hidden">
              <a routerLink="/me/pay-bills" queryParamsHandling="preserve" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12v4"/><path d="M16 13.5h1"/></svg></span>
                <span class="min-w-0 flex-1"><strong class="block font-semibold text-ink">Self-pay &amp; SmartClinic Wallet</strong><span class="block text-sm text-ink-muted">Available for eligible bills and services</span></span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
              <a routerLink="/me/insurance" queryParamsHandling="preserve" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="M9 12l2 2 4-4"/></svg></span>
                <span class="min-w-0 flex-1"><strong class="block font-semibold text-ink">Health Insurance / HMO</strong><span class="block text-sm text-ink-muted">Add existing cover or request enrollment help</span></span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
              <a routerLink="/healthy-families" queryParamsHandling="preserve" class="flex min-h-[4.5rem] items-center gap-4 p-4 transition hover:bg-sand-50 sm:px-5">
                <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M2 20a5 5 0 0 1 10 0M12 20a5 5 0 0 1 10 0"/></svg></span>
                <span class="min-w-0 flex-1"><strong class="block font-semibold text-ink">School, employer &amp; family programmes</strong><span class="block text-sm text-ink-muted">View relationships connected by a valid invitation</span></span>
                <span class="text-ink-muted" aria-hidden="true">›</span>
              </a>
            </div>
            <p class="mt-2 px-1 text-xs leading-5 text-ink-muted">SmartClinic subscription is a future option and is not currently active.</p>
          </section>
        </div>

        <div class="mt-4 grid gap-4 lg:grid-cols-12">
          <section class="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-ochre-50 via-white to-sand-100 p-6 ring-1 ring-ochre-100 sm:p-7 lg:col-span-8" aria-labelledby="health-check-summary-heading">
            <div class="sc-motif-ink pointer-events-none absolute -right-10 -top-10 size-56 rounded-full opacity-[0.07]" aria-hidden="true"></div>
            <div class="relative">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ochre-700">Invest in yourself</p>
              <h2 id="health-check-summary-heading" class="font-display mt-2 max-w-xl text-[1.5rem] font-semibold leading-tight text-ink sm:text-[1.75rem]">
                Your health deserves a place on your priority list.
              </h2>
              @if (healthChecks()?.items?.length === 0) {
                <p class="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                  We spend on the things we use every day. A simple Health Check is an investment in the person who uses them all — you.
                </p>
                <a routerLink="/me/health-journey" class="mt-5 inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-brand-900">
                  Check my health →
                </a>
              } @else {
                <p class="mt-2 text-sm text-ink-soft">Your preventive Health Check activity at a glance.</p>
                <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  @for (item of healthCheckSummary(); track item.label) {
                    <article class="rounded-2xl bg-white/80 p-3.5 ring-1 ring-ink/[0.06]">
                      <p class="font-display text-2xl font-semibold text-ink">{{ item.count }}</p>
                      <p class="mt-0.5 text-xs font-medium text-ink-muted">{{ item.label }}</p>
                    </article>
                  }
                </div>
                <a routerLink="/me/health-checks" class="mt-4 inline-block text-sm font-semibold text-brand-700 underline underline-offset-4">View Health Checks →</a>
              }
            </div>
          </section>

          <section class="sc-card flex flex-col p-6 lg:col-span-4" aria-labelledby="impact-heading">
            <div class="flex items-start justify-between gap-4">
              <span class="grid size-11 place-items-center rounded-2xl bg-leaf-50 text-leaf-700" aria-hidden="true"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.35-9.25-8.45C.9 9.2 2.48 5 6.5 5c2.1 0 3.2 1.2 3.9 2.2C11.1 6.2 12.2 5 14.5 5c4.02 0 5.6 4.2 3.75 7.55C16 16.65 12 21 12 21Z"/><path d="M9 12h6M12 9v6"/></svg></span>
              <a routerLink="/me/impact" class="text-sm font-semibold text-brand-700 hover:text-brand-900">View →</a>
            </div>
            <h2 id="impact-heading" class="font-display mt-4 text-[1.25rem] font-semibold leading-snug text-ink">Help someone access healthcare.</h2>
            <p class="mt-1 text-sm leading-6 text-ink-muted">Invite someone to SmartClinic and grow your verified impact.</p>
            @if (referrals(); as rewards) {
              <p class="mt-auto pt-4 text-sm font-semibold text-ink">
                <span class="font-display text-2xl">{{ rewards.balances.availablePoints }}</span> points
                @if (rewards.leaderboard.optedIn && rewards.leaderboard.position !== null) { <span class="text-ink-muted">· #{{ rewards.leaderboard.position }}</span> }
              </p>
            }
          </section>
        </div>

        @if (value.dashboardMode === 'GETTING_STARTED') {
          <section class="mt-10" aria-labelledby="getting-started-heading">
            <h2 id="getting-started-heading" class="font-display text-[1.35rem] font-semibold text-ink">Getting started</h2>
            <ul class="mt-3 grid gap-2 sm:grid-cols-2">
              @for (step of checklist(value); track step.label) {
                <li class="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-ink/[0.06]">
                  <span aria-hidden="true" class="grid size-8 shrink-0 place-items-center rounded-full font-bold"
                    [class.bg-leaf-100]="step.complete" [class.text-leaf-700]="step.complete"
                    [class.bg-sand-100]="!step.complete" [class.text-ink-muted]="!step.complete">{{ step.complete ? '✓' : '○' }}</span>
                  <span><strong class="block text-sm font-semibold text-ink">{{ step.label }}</strong><span class="text-xs text-ink-muted">{{ step.complete ? 'Complete' : 'Not complete' }}</span></span>
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
  private readonly formBuilder = inject(FormBuilder);
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
  readonly routineManagerOpen = signal(false);
  readonly allRoutines = signal<PatientDailyRoutine[]>([]);
  readonly routinesLoading = signal(false);
  readonly routineSaving = signal(false);
  readonly routineError = signal('');
  readonly tickingReference = signal<string | null>(null);
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
  toggleRoutineManager(): void {
    this.routineManagerOpen.update((open) => !open);
    if (this.routineManagerOpen()) this.loadRoutines();
  }
  loadRoutines(): void {
    this.routinesLoading.set(true);
    this.routineError.set('');
    this.api.getDailyRoutines().pipe(finalize(() => this.routinesLoading.set(false))).subscribe({
      next: ({ items }) => this.allRoutines.set(items),
      error: () => this.routineError.set('Routines are unavailable right now.'),
    });
  }
  createRoutine(): void {
    if (this.routineForm.invalid || this.routineSaving()) return;
    const value = this.routineForm.getRawValue();
    if (value.type === 'MEDICATION' && !value.medicationSafetyAcknowledged) {
      this.routineError.set('Please confirm the medication safety note.');
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
      error: () => this.routineError.set('We could not save this routine. Check the details and try again.'),
    });
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
      next: (progress) => {
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
      },
      error: () => this.routineError.set('We could not update today’s routine. Please try again.'),
    });
  }
  toggleRoutine(routine: PatientDailyRoutine): void {
    if (this.routineSaving()) return;
    this.routineSaving.set(true);
    this.api.updateDailyRoutine(routine.reference, { enabled: !routine.enabled }).pipe(finalize(() => this.routineSaving.set(false))).subscribe({
      next: () => { this.loadRoutines(); this.load(); },
      error: () => this.routineError.set('We could not update this routine.'),
    });
  }
  deleteRoutine(routine: PatientDailyRoutine): void {
    if (this.routineSaving()) return;
    this.routineSaving.set(true);
    this.api.deleteDailyRoutine(routine.reference).pipe(finalize(() => this.routineSaving.set(false))).subscribe({
      next: () => { this.loadRoutines(); this.load(); },
      error: () => this.routineError.set('We could not remove this routine.'),
    });
  }
  routineTypeLabel(type: PatientDailyRoutineType): string {
    return ({ HYDRATION: 'Hydration', MOVEMENT: 'Movement', BREAK: 'Take a break', SLEEP: 'Wind-down / sleep', VITAMIN: 'Vitamin', MEDICATION: 'Personal medication' } as const)[type];
  }
  static greetingFor(hour: number): string {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
