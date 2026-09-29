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
    <main class="sc-page mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
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
        </header>

        <section
          class="sc-hero-glow relative mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-950 to-violet-800 p-6 text-white shadow-[0_24px_60px_rgba(30,20,70,0.24)] sm:p-8"
          aria-labelledby="next-step-heading"
        >
          <p class="text-sm font-bold uppercase tracking-wider text-brand-100">Your next step</p>
          <h2 id="next-step-heading" class="mt-1 text-xl font-bold sm:text-2xl">
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
        </section>

        <section class="mt-5 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-[0_10px_28px_rgba(6,95,70,0.07)]" aria-labelledby="today-care-heading">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-emerald-700">Today</p>
              <h2 id="today-care-heading" class="mt-1 text-xl font-bold text-brand-950">Small things that keep you well</h2>
              <p class="mt-1 text-sm leading-6 text-slate-600">Optional routines you choose. Clinical actions above always remain the priority.</p>
            </div>
            <button type="button" (click)="toggleRoutineManager()" class="shrink-0 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-800">
              {{ routineManagerOpen() ? 'Close' : 'Manage' }}
            </button>
          </div>

          @if ((value.todayRoutines ?? []).length) {
            <ul class="mt-4 grid gap-2 sm:grid-cols-3">
              @for (routine of value.todayRoutines ?? []; track routine.reference) {
                <li class="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <div class="flex items-center gap-2">
                    <span class="grid size-9 place-items-center rounded-xl bg-emerald-100 text-lg" aria-hidden="true">{{ routineIcon(routine.type) }}</span>
                    <div><p class="font-bold text-brand-950">{{ routine.label }}</p><p class="text-xs text-slate-500">{{ routine.scheduledLocalTime }} · {{ routineTypeLabel(routine.type) }}</p></div>
                  </div>
                  @if (routine.instructions) { <p class="mt-2 text-xs leading-5 text-slate-600">{{ routine.instructions }}</p> }
                </li>
              }
            </ul>
          } @else {
            <p class="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-emerald-100">No routine added yet. Add only what would genuinely help you.</p>
          }

          @if (routineManagerOpen()) {
            <div class="mt-4 grid gap-4 border-t border-emerald-200 pt-4 lg:grid-cols-[1fr_1.1fr]">
              <form [formGroup]="routineForm" (ngSubmit)="createRoutine()" class="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <h3 class="font-bold text-brand-950">Add a routine</h3>
                <label class="text-sm font-semibold">Type
                  <select formControlName="type" class="mt-1 min-h-11 w-full rounded-xl border px-3">
                    @for (type of routineTypes; track type) { <option [value]="type">{{ routineTypeLabel(type) }}</option> }
                  </select>
                </label>
                <label class="text-sm font-semibold">What should SmartClinic show you?
                  <input formControlName="label" maxlength="120" placeholder="e.g. Take my evening medicine" class="mt-1 min-h-11 w-full rounded-xl border px-3" />
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="text-sm font-semibold">Time<input type="time" formControlName="scheduledLocalTime" class="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
                  <label class="text-sm font-semibold">Time zone<input formControlName="timezone" readonly class="mt-1 min-h-11 w-full rounded-xl border bg-slate-50 px-3 text-xs" /></label>
                </div>
                <label class="text-sm font-semibold">Helpful note (optional)<input formControlName="instructions" maxlength="300" placeholder="Keep it short" class="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
                @if (routineForm.controls.type.value === 'MEDICATION') {
                  <label class="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                    <input type="checkbox" formControlName="medicationSafetyAcknowledged" class="mt-1" />
                    <span>I will follow the prescription or clinician’s instructions. This personal reminder does not replace medical advice.</span>
                  </label>
                }
                <p class="text-xs leading-5 text-slate-500">Shown every day. You can pause or remove it anytime. Hydration needs differ; follow any fluid restriction given by your clinician.</p>
                @if (routineError()) { <p role="alert" class="text-sm font-semibold text-red-700">{{ routineError() }}</p> }
                <button [disabled]="routineForm.invalid || routineSaving()" class="min-h-11 rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:opacity-50">{{ routineSaving() ? 'Saving…' : 'Add routine' }}</button>
              </form>

              <div class="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <h3 class="font-bold text-brand-950">Your routines</h3>
                @if (routinesLoading()) { <p role="status" class="mt-3 text-sm">Loading routines…</p> }
                @else if (!allRoutines().length) { <p class="mt-3 text-sm text-slate-600">You have no saved routines.</p> }
                @else {
                  <ul class="mt-3 divide-y">
                    @for (routine of allRoutines(); track routine.reference) {
                      <li class="flex items-center justify-between gap-3 py-3">
                        <div><p class="text-sm font-bold text-brand-950">{{ routine.label }}</p><p class="text-xs text-slate-500">{{ routine.scheduledLocalTime }} · {{ routine.enabled ? 'Active' : 'Paused' }}</p></div>
                        <div class="flex gap-2">
                          <button type="button" (click)="toggleRoutine(routine)" [disabled]="routineSaving()" class="text-xs font-bold text-brand-700 underline">{{ routine.enabled ? 'Pause' : 'Resume' }}</button>
                          @if (routine.source === 'PATIENT') { <button type="button" (click)="deleteRoutine(routine)" [disabled]="routineSaving()" class="text-xs font-bold text-red-700 underline">Remove</button> }
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          }
        </section>

        <nav class="mt-9" aria-labelledby="quick-access-heading">
          <div class="mb-3">
            <p class="text-sm font-bold uppercase tracking-wider text-brand-700">SmartClinic</p>
            <h2 id="quick-access-heading" class="mt-1 text-2xl font-bold text-brand-950 sm:text-3xl">
              What do you need today?
            </h2>
            <p class="mt-1 text-sm text-slate-600">Choose what you want to do. We’ll guide you from there.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <a routerLink="/me/book" queryParamsHandling="preserve" class="sc-action group relative flex min-h-[142px] flex-col items-start justify-between overflow-hidden rounded-[1.4rem] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 text-left font-bold text-brand-950 shadow-[0_10px_28px_rgba(76,29,149,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(76,29,149,0.15)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span class="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-violet-200/30 blur-xl" aria-hidden="true"></span>
              <span class="relative grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-xl text-white shadow-md shadow-violet-600/20" aria-hidden="true">♥</span>
              <span class="relative flex w-full items-end justify-between gap-2"><span>Book a Checkup</span><span class="text-brand-500 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
            </a>
            <a routerLink="/me/request-care" [queryParams]="{ serviceCode: 'EMERGENCY_CONSULTATION', journey: 'doctor' }" queryParamsHandling="merge" class="sc-action group relative flex min-h-[142px] flex-col items-start justify-between overflow-hidden rounded-[1.4rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 text-left font-bold text-brand-950 shadow-[0_10px_28px_rgba(6,95,70,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(6,95,70,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span class="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-200/35 blur-xl" aria-hidden="true"></span>
              <span class="relative grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-xl text-white shadow-md shadow-emerald-600/20" aria-hidden="true">✚</span>
              <span class="relative flex w-full items-end justify-between gap-2"><span>See a Doctor</span><span class="text-emerald-600 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
            </a>
            <a routerLink="/me/providers" queryParamsHandling="preserve" class="sc-action group relative flex min-h-[142px] flex-col items-start justify-between overflow-hidden rounded-[1.4rem] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 text-left font-bold text-brand-950 shadow-[0_10px_28px_rgba(3,105,161,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(3,105,161,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span class="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-sky-200/35 blur-xl" aria-hidden="true"></span>
              <span class="relative grid h-11 w-11 place-items-center rounded-2xl bg-sky-600 text-sm font-black text-white shadow-md shadow-sky-600/20" aria-hidden="true">H</span>
              <span class="relative flex w-full items-end justify-between gap-2"><span>Visit a Hospital</span><span class="text-sky-600 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
            </a>
            <a routerLink="/me/prescriptions" queryParamsHandling="preserve" class="sc-action group relative flex min-h-[142px] flex-col items-start justify-between overflow-hidden rounded-[1.4rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 text-left font-bold text-brand-950 shadow-[0_10px_28px_rgba(180,83,9,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(180,83,9,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span class="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-amber-200/35 blur-xl" aria-hidden="true"></span>
              <span class="relative grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-sm font-black text-white shadow-md shadow-amber-500/20" aria-hidden="true">Rx</span>
              <span class="relative flex w-full items-end justify-between gap-2"><span>Get Medicine</span><span class="text-amber-600 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
            </a>
            <a routerLink="/me/lab-tests" queryParamsHandling="preserve" class="sc-action group relative flex min-h-[142px] flex-col items-start justify-between overflow-hidden rounded-[1.4rem] border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4 text-left font-bold text-brand-950 shadow-[0_10px_28px_rgba(190,24,93,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(190,24,93,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span class="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-rose-200/35 blur-xl" aria-hidden="true"></span>
              <span class="relative grid h-11 w-11 place-items-center rounded-2xl bg-rose-500 text-sm font-black text-white shadow-md shadow-rose-500/20" aria-hidden="true">T</span>
              <span class="relative flex w-full items-end justify-between gap-2"><span>Get a Test</span><span class="text-rose-600 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
            </a>
            <a routerLink="/me/pay-bills" queryParamsHandling="preserve" class="sc-action group relative flex min-h-[142px] flex-col items-start justify-between overflow-hidden rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 text-left font-bold text-brand-950 shadow-[0_10px_28px_rgba(30,41,59,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(30,41,59,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-slate-800 text-lg text-white" aria-hidden="true">₦</span>
              <span class="relative flex w-full items-end justify-between gap-2"><span>Pay Bills</span><span class="text-brand-600 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
            </a>
          </div>
        </nav>

        <section class="mt-7" aria-labelledby="coverage-programmes-heading">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Your relationships</p>
            <h2 id="coverage-programmes-heading" class="mt-1 text-xl font-bold text-brand-950">How you access and pay for care</h2>
            <p class="mt-1 text-sm leading-6 text-slate-600">Use one SmartClinic account. Add only the coverage or programme that applies to you.</p>
          </div>
          <div class="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <a routerLink="/me/pay-bills" queryParamsHandling="preserve" class="group flex min-h-20 items-center gap-4 border-b border-slate-100 p-4 transition hover:bg-violet-50/60 sm:p-5">
              <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 font-black text-violet-700" aria-hidden="true">₦</span>
              <span class="min-w-0 flex-1"><strong class="block text-brand-950">Self-pay &amp; SmartClinic Wallet</strong><span class="mt-1 block text-sm text-slate-600">Available for eligible bills and services</span></span>
              <span class="shrink-0 text-sm font-bold text-violet-700">View <span aria-hidden="true">→</span></span>
            </a>
            <a routerLink="/me/insurance" queryParamsHandling="preserve" class="group flex min-h-20 items-center gap-4 border-b border-slate-100 p-4 transition hover:bg-blue-50/70 sm:p-5">
              <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 font-black text-blue-700" aria-hidden="true">H</span>
              <span class="min-w-0 flex-1"><strong class="block text-brand-950">Health Insurance / HMO</strong><span class="mt-1 block text-sm text-slate-600">Add existing cover or request enrollment help</span></span>
              <span class="shrink-0 text-sm font-bold text-blue-700">Manage <span aria-hidden="true">→</span></span>
            </a>
            <a routerLink="/healthy-families" queryParamsHandling="preserve" class="group flex min-h-20 items-center gap-4 p-4 transition hover:bg-emerald-50/70 sm:p-5">
              <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 font-black text-emerald-700" aria-hidden="true">F</span>
              <span class="min-w-0 flex-1"><strong class="block text-brand-950">School, employer &amp; family programmes</strong><span class="mt-1 block text-sm text-slate-600">View relationships connected by a valid invitation</span></span>
              <span class="shrink-0 text-sm font-bold text-emerald-700">View <span aria-hidden="true">→</span></span>
            </a>
          </div>
          <p class="mt-2 px-1 text-xs leading-5 text-slate-500">SmartClinic subscription is a future option and is not currently active.</p>
        </section>

        <section class="mt-7" aria-labelledby="your-care-heading">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Your care</p>
              <h2 id="your-care-heading" class="mt-1 text-xl font-bold text-brand-950">Everything connected.</h2>
            </div>
            <a routerLink="/me/care" class="text-sm font-bold text-brand-700">View care →</a>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a routerLink="/me/providers" class="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <span class="text-xl" aria-hidden="true">🏥</span>
              <p class="mt-2 text-sm font-bold text-brand-950">{{ value.setup.hasConnectedProvider ? 'Hospital connected' : value.setup.hasProviderConnection ? 'Connection in progress' : 'Choose a hospital' }}</p>
            </a>
            <a routerLink="/me/care" class="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <span class="text-xl" aria-hidden="true">♥</span>
              <p class="mt-2 text-sm font-bold text-brand-950">{{ value.setup.hasCareRequest ? 'Care activity' : 'Start your care' }}</p>
            </a>
            <a routerLink="/me/health-passport" class="col-span-2 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 sm:col-span-1">
              <span class="text-xl" aria-hidden="true">▣</span>
              <p class="mt-2 text-sm font-bold text-brand-950">Health Passport</p>
            </a>
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
  readonly routineTypes: readonly PatientDailyRoutineType[] = ['HYDRATION', 'MOVEMENT', 'BREAK', 'SLEEP', 'VITAMIN', 'MEDICATION'];
  readonly routineForm = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<PatientDailyRoutineType>('HYDRATION'),
    label: ['', [Validators.required, Validators.maxLength(120)]],
    scheduledLocalTime: ['09:00', Validators.required],
    timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos', Validators.required],
    instructions: ['', Validators.maxLength(300)],
    medicationSafetyAcknowledged: false,
  });
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
  routineIcon(type: PatientDailyRoutineType): string {
    return ({ HYDRATION: '◉', MOVEMENT: '↗', BREAK: '☕', SLEEP: '☾', VITAMIN: 'V', MEDICATION: 'Rx' } as const)[type];
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
