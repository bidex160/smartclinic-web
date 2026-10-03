import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  CareDeliveryMode,
  CareRequest,
  CreateCareRequest,
  PublicFindCareProvider,
} from '../../core/models/find-care.model';
import { careDeliveryModeLabel } from './care-delivery-mode';
import { formatMinor } from '../provider/care-money';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CareRequestIntentService } from '../../core/services/care-request-intent.service';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { LocationDataService } from '../../core/services/location-data.service';
import { DependantsApiService } from '../../core/services/dependants-api.service';
import { Dependant, HealthCheckParticipantSelection } from '../../core/models/dependant.model';
import { requestedMarket, rwandaLocale, SMARTCLINIC_MARKETS } from '../../core/config/market-context';
import { LocalePreferencesService } from '../../core/services/locale-preferences.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';
import { ProviderCredentialsApiService, Specialty } from '../../core/services/provider-credentials-api.service';

/** Short, non-sensitive notes for known request topics (never patient data in the URL). */
const REQUEST_TOPIC_NOTES: Readonly<Record<string, string>> = {
  'blood-group-genotype': 'Blood group and haemoglobin genotype tests, please.',
};

@Component({
  selector: 'app-find-care-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
    <header class="relative overflow-hidden rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm sm:p-8">
      <div class="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-brand-100/60 blur-3xl"></div>
      <div class="relative">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">{{ 'care.header.eyebrow' | t }}</p>
        <h1 class="font-display mt-2 text-4xl font-semibold text-ink">{{ doctorJourney() ? ('care.header.seeDoctor' | t) : 'Find Care' }}</h1>
        <p class="mt-3 max-w-2xl text-ink-soft">{{ (doctorJourney() ? 'care.header.doctorIntro' : 'care.header.intro') | t }}</p>
        @if (doctorJourney()) {
          <section class="mt-6 grid gap-3 sm:grid-cols-3" [attr.aria-label]="'care.doctor.optionsLabel' | t">
            <button type="button" (click)="chooseDoctorMode('NOW')" [attr.aria-pressed]="doctorMode() === 'NOW'" class="min-h-28 rounded-2xl border bg-white p-5 text-left ring-1 ring-ink/[0.08]" [class.ring-4]="doctorMode() === 'NOW'" [class.ring-brand-300]="doctorMode() === 'NOW'" [class.bg-brand-50]="doctorMode() === 'NOW'">
              <strong class="block text-lg text-ink">{{ 'care.doctor.nowTitle' | t }}</strong><span class="mt-1 block text-sm text-ink-soft">{{ 'care.doctor.nowText' | t }}</span>
              @if (doctorMode() === 'NOW') { <span class="mt-3 block font-bold text-brand-700">{{ 'care.doctor.nowSelected' | t }}</span> }
            </button>
            <button type="button" (click)="chooseDoctorMode('LATER')" [attr.aria-pressed]="doctorMode() === 'LATER'" class="min-h-28 rounded-2xl border bg-white p-5 text-left ring-1 ring-ink/[0.08]" [class.ring-4]="doctorMode() === 'LATER'" [class.ring-brand-300]="doctorMode() === 'LATER'" [class.bg-brand-50]="doctorMode() === 'LATER'">
              <strong class="block text-lg text-ink">{{ 'care.doctor.laterTitle' | t }}</strong><span class="mt-1 block text-sm text-ink-soft">{{ 'care.doctor.laterText' | t }}</span>
              @if (doctorMode() === 'LATER') { <span class="mt-3 block font-bold text-brand-700">{{ 'care.doctor.laterSelected' | t }}</span> }
            </button>
            <button type="button" (click)="openInstitutionCare()" [attr.aria-pressed]="doctorMode() === 'HOSPITAL'" class="min-h-28 rounded-2xl border bg-white p-5 text-left ring-1 ring-ink/[0.08]" [class.ring-4]="doctorMode() === 'HOSPITAL'" [class.ring-brand-300]="doctorMode() === 'HOSPITAL'" [class.bg-brand-50]="doctorMode() === 'HOSPITAL'">
              <strong class="block text-lg text-ink">{{ 'care.doctor.hospitalTitle' | t }}</strong><span class="mt-1 block text-sm text-ink-soft">{{ 'care.doctor.hospitalText' | t }}</span>
              @if (doctorMode() === 'HOSPITAL') { <span class="mt-3 block font-bold text-brand-700">{{ 'care.doctor.hospitalSelected' | t }}</span> }
            </button>
          </section>
        }
      </div>
    </header>
    <aside class="mt-4 flex gap-3 rounded-2xl border border-clay-100 bg-clay-50 p-4 text-clay-700" role="note" aria-labelledby="emergency-guidance-heading" data-emergency-guidance>
      <svg aria-hidden="true" class="mt-0.5 size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>
      <div class="min-w-0">
        <h2 id="emergency-guidance-heading" class="font-semibold text-ink">{{ 'care.emergency.title' | t }}</h2>
        <p class="mt-1 text-sm leading-6">
          {{ 'care.emergency.signs' | t }}
          {{ 'care.emergency.callBefore' | t }}<a href="tel:112" class="font-bold underline underline-offset-2">112</a>{{ 'care.emergency.callAfter' | t }}
          {{ 'care.emergency.dontWait' | t }}
        </p>
      </div>
    </aside>
    @if (success(); as request) {
      <section class="mt-6 rounded-[2rem] border border-green-200 bg-green-50 p-7 shadow-sm">
        <h2 class="font-display text-2xl font-semibold text-green-950">{{ 'care.success.title' | t }}</h2>
        <dl class="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-ink-soft">{{ 'care.success.reference' | t }}</dt>
            <dd class="font-bold">{{ request.reference }}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink-soft">{{ 'care.success.status' | t }}</dt>
            <dd>{{ statusLabel(request.status) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink-soft">{{ 'care.success.service' | t }}</dt>
            <dd>{{ request.service.name }}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink-soft">{{ 'care.success.careType' | t }}</dt>
            <dd>{{ deliveryModeLabel(request.deliveryMode) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink-soft">{{ 'care.success.careFor' | t }}</dt>
            <dd>{{ request.participant?.displayName ?? ('care.success.you' | t) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-ink-soft">{{ 'care.success.servicePrice' | t }}</dt>
            <dd class="font-bold">
              {{
                request.service.price
                  ? formatPrice(request.service.price.priceMinor, request.service.price.currency)
                  : ('care.price.pending' | t)
              }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-ink-soft">{{ 'care.success.preferredProvider' | t }}</dt>
            <dd>{{ request.preferredProvider?.displayName || ('care.success.smartClinicMatch' | t) }}</dd>
          </div>
          @if (request.geography; as geography) {
            <div>
              <dt class="text-sm text-ink-soft">{{ 'care.success.requestedLocation' | t }}</dt>
              <dd>
                {{ geography.city }}, {{ geography.stateOrRegion }}, {{ geography.countryCode }}
              </dd>
            </div>
          } @else if (request.deliveryMode === 'VIRTUAL') {
            <div>
              <dt class="text-sm text-ink-soft">{{ 'care.success.location' | t }}</dt>
              <dd>{{ 'care.success.virtualCare' | t }}</dd>
            </div>
          }
        </dl>
        <p class="mt-5 text-ink-soft">
          {{ 'care.success.nextStep' | t }}
        </p>
        <a
          [routerLink]="['/me/care', request.reference]"
          class="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-700 px-5 py-3 font-bold text-white focus:ring-4 focus:ring-brand-200"
          >{{ 'care.success.viewMyCare' | t }}</a
        >
      </section>
    } @else {
      @if (showIntentChooser()) {
        <section class="mt-6" aria-labelledby="care-intent-heading" data-care-intent>
          <h2 id="care-intent-heading" class="font-display text-2xl font-semibold text-ink">{{ 'care.intent.title' | t }}</h2>
          <p class="mt-1 text-sm text-ink-muted">{{ 'care.intent.subtitle' | t }}</p>
          <ul class="mt-4 grid gap-3 sm:grid-cols-2">
            <li>
              <a routerLink="/me/request-care" [queryParams]="{ serviceCode: 'EMERGENCY_CONSULTATION', journey: 'doctor' }" class="sc-tile flex min-h-20 items-center gap-4 rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 shadow-card">
                <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-clay-50 text-clay-500" aria-hidden="true"><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v5a4 4 0 0 0 8 0V3M10 12v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="9" r="2"/></svg></span>
                <span><strong class="block text-ink">{{ 'care.intent.unwellTitle' | t }}</strong><span class="text-sm text-ink-muted">{{ 'care.intent.unwellText' | t }}</span></span>
              </a>
            </li>
            <li>
              <a routerLink="/me/lab-tests" class="sc-tile flex min-h-20 items-center gap-4 rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 shadow-card">
                <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true"><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9"/></svg></span>
                <span><strong class="block text-ink">{{ 'care.intent.testTitle' | t }}</strong><span class="text-sm text-ink-muted">{{ 'care.intent.testText' | t }}</span></span>
              </a>
            </li>
            <li>
              <a routerLink="/me/prescriptions" class="sc-tile flex min-h-20 items-center gap-4 rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 shadow-card">
                <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-leaf-50 text-leaf-700" aria-hidden="true"><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7ZM7 10l7 7"/></svg></span>
                <span><strong class="block text-ink">{{ 'care.intent.medicineTitle' | t }}</strong><span class="text-sm text-ink-muted">{{ 'care.intent.medicineText' | t }}</span></span>
              </a>
            </li>
            <li>
              <a routerLink="/me/fasttrack/new" class="sc-tile flex min-h-20 items-center gap-4 rounded-[1.25rem] border border-ink/[0.07] bg-white p-4 shadow-card">
                <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-ochre-50 text-ochre-700" aria-hidden="true"><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v14H4ZM8 3v6M16 3v6M4 10h16"/></svg></span>
                <span><strong class="block text-ink">{{ 'care.intent.appointmentTitle' | t }}</strong><span class="text-sm text-ink-muted">{{ 'care.intent.appointmentText' | t }}</span></span>
              </a>
            </li>
            <li class="sm:col-span-2">
              <button type="button" (click)="intentChosen.set(true)" class="sc-tile flex min-h-16 w-full items-center gap-4 rounded-[1.25rem] border border-dashed border-ink/15 bg-sand-50 p-4 text-left">
                <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-ink-soft" aria-hidden="true"><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
                <span><strong class="block text-ink">{{ 'care.intent.otherTitle' | t }}</strong><span class="text-sm text-ink-muted">{{ 'care.intent.otherText' | t }}</span></span>
              </button>
            </li>
          </ul>
        </section>
      }
      <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 grid gap-5" [class.hidden]="showIntentChooser()" novalidate>
        <fieldset class="rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm">
          <legend class="px-2 text-xl font-bold">{{ 'care.service.heading' | t }}</legend>
          @if (servicesLoading()) {
            <p role="status" class="mt-3">{{ 'care.service.loading' | t }}</p>
          } @else if (servicesError()) {
            <p role="alert" class="mt-3 text-red-700">
              {{ 'care.service.loadError' | t }}
              <button type="button" (click)="loadServices()" class="font-bold underline">
                {{ 'care.service.tryAgain' | t }}
              </button>
            </p>
          } @else {
            <label class="mt-3 block font-semibold"
              >{{ 'care.service.label' | t }}<select
                formControlName="serviceCode"
                (change)="serviceChanged()"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              >
                <option value="">{{ 'care.service.placeholder' | t }}</option>
                @for (s of services(); track s.code) {
                  <option [value]="s.code">{{ s.name }}</option>
                }
              </select></label
            >
            @if (selectedDescription()) {
              <p class="mt-3 text-sm text-ink-soft">{{ selectedDescription() }}</p>
            }
          }
        </fieldset>
        <fieldset class="rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm">
          <legend class="px-2 text-xl font-bold">{{ 'care.participant.heading' | t }}</legend>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="flex cursor-pointer items-center gap-3 rounded-2xl border p-4"
              ><input
                type="radio"
                name="care-participant"
                [checked]="participant().kind === 'SELF'"
                (change)="selectParticipant({ kind: 'SELF' })"
              />
              <span>{{ 'care.participant.me' | t }}</span></label
            >
            @for (dependant of dependants(); track dependant.patientReference) {
              <label class="flex cursor-pointer items-center gap-3 rounded-2xl border p-4"
                ><input
                  type="radio"
                  name="care-participant"
                  [checked]="isDependantSelected(dependant.patientReference)"
                  (change)="
                    selectParticipant({
                      kind: 'DEPENDANT',
                      patientReference: dependant.patientReference,
                      displayName: dependant.displayName,
                    })
                  "
                />
                <span>{{ dependant.displayName }}</span></label
              >
            }
          </div>
          <a
            routerLink="/me/family"
            class="mt-2 inline-block text-sm font-semibold text-brand-700 underline"
            >{{ 'care.participant.add' | t }}</a
          >
          @if (dependantsError()) {
            <p class="mt-2 text-sm text-ink-soft">
              {{ 'care.participant.loadError' | t }}
            </p>
          }
        </fieldset>
        @if (!doctorJourney()) {
        <fieldset class="rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm">
          <legend class="px-2 text-xl font-bold">{{ 'care.mode.heading' | t }}</legend>
          @if (deliveryModes().length) {
            <div class="mt-3 grid gap-3 sm:grid-cols-3">
              @for (mode of deliveryModes(); track mode) {
                <label
                  class="flex min-h-24 cursor-pointer gap-3 rounded-2xl border p-4 focus-within:ring-4 focus-within:ring-brand-200"
                  [class.border-brand-600]="form.controls.deliveryMode.value === mode"
                  [class.bg-brand-50]="form.controls.deliveryMode.value === mode"
                >
                  <input
                    type="radio"
                    formControlName="deliveryMode"
                    [value]="mode"
                    (change)="deliveryModeChanged()"
                  />
                  <span
                    ><strong class="block">{{ deliveryModeLabel(mode) }}</strong
                    ><span class="mt-1 block text-sm text-ink-soft">{{
                      deliveryModeHelp(mode)
                    }}</span></span
                  >
                </label>
              }
            </div>
          } @else {
            <p class="mt-3 text-sm text-ink-soft">
              {{ 'care.mode.chooseService' | t }}
            </p>
          }
        </fieldset>
        }
        @if (requiresGeography()) {
          <fieldset class="rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm">
            <legend class="px-2 text-xl font-bold">{{ 'care.location.heading' | t }}</legend>
            <div class="mt-3 grid gap-5 md:grid-cols-3">
              <label class="font-semibold"
                >{{ 'care.location.country' | t }}<select
                  formControlName="countryCode"
                  (change)="countryChanged($any($event.target).value)"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">{{ 'care.location.selectCountry' | t }}</option>
                  @for (c of countries; track c.isoCode) {
                    <option [value]="c.isoCode">{{ c.name }}</option>
                  }
                </select></label
              ><label class="font-semibold"
                >{{ 'care.location.state' | t }}<select
                  [formControl]="requestStateCode"
                  (change)="stateChanged($any($event.target).value)"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">{{ 'care.location.selectState' | t }}</option>
                  @for (s of states(); track s.isoCode) {
                    <option [value]="s.isoCode">{{ s.name }}</option>
                  }
                </select></label
              ><label class="font-semibold"
                >{{ 'care.location.city' | t }}<select
                  formControlName="city"
                  (change)="discoverProviders()"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">{{ 'care.location.selectCity' | t }}</option>
                  @for (c of cities(); track c.name) {
                    <option [value]="c.name">{{ c.name }}</option>
                  }
                </select></label
              >
            </div>
          </fieldset>
        }
        <fieldset class="rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm">
          <legend class="px-2 text-xl font-bold">
            {{ 'care.provider.heading' | t: { step: requiresGeography() ? 4 : 3 } }}
          </legend>
          @if (specialtyOptions().length) {
            <label class="mt-3 block font-semibold"
              >{{ 'care.provider.specialty' | t }}<select
                [value]="specialty()"
                (change)="specialtyChanged($any($event.target).value)"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
                data-specialty-filter
              >
                <option value="">{{ 'care.provider.anySpecialty' | t }}</option>
                @for (s of specialtyOptions(); track s.code) {
                  <option [value]="s.code">{{ s.name }}</option>
                }
              </select></label
            >
          }
          <label class="mt-3 block font-semibold"
            >{{ 'care.provider.label' | t }}<select
              formControlName="preferredProviderReference"
              class="mt-2 min-h-12 w-full rounded-xl border px-3"
            >
              <option value="">{{ 'care.provider.noPreference' | t }}</option>
              @for (p of providers(); track p.providerReference) {
                <option [value]="p.providerReference">{{ providerLabel(p) }}</option>
              }
            </select></label
          >
          @if (providersLoading()) {
            <p role="status" class="mt-3 text-sm">{{ 'care.provider.finding' | t }}</p>
          } @else if (providerSearchReady() && !providers().length) {
            <div class="mt-3 rounded-xl bg-sand-50 p-4">
              <p class="font-bold">{{ 'care.provider.noneTitle' | t }}</p>
              <p class="mt-1 text-sm text-ink-soft">{{ (hostInstitutionReference() ? 'care.provider.noneHospital' : 'care.provider.noneGeneral') | t }}</p>
            </div>
          }
          @if (providersError()) {
            <p role="alert" class="mt-3 text-red-700">
              {{ 'care.provider.error' | t }}
            </p>
          }
          @if (selectedProviderPrice(); as price) {
            <div class="mt-4 rounded-xl bg-brand-50 p-4">
              <p class="text-sm text-ink-soft">
                {{ 'care.provider.servicePrice' | t: { mode: deliveryModeLabel(form.controls.deliveryMode.value || 'IN_PERSON') } }}
              </p>
              <p class="mt-1 text-xl font-bold">
                {{ formatPrice(price.priceMinor, price.currency) }}
              </p>
              <p class="mt-1 text-xs text-ink-muted">
                {{ 'care.provider.priceNote' | t }}
              </p>
            </div>
          } @else if (
            !form.controls.preferredProviderReference.value && form.controls.deliveryMode.value
          ) {
            <p class="mt-4 rounded-xl bg-sand-50 p-4 text-sm">
              {{ 'care.price.pending' | t }}
            </p>
          }
        </fieldset>
        <fieldset class="rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm">
          <legend class="px-2 text-xl font-bold">
            {{ doctorJourney() ? ('care.details.doctorHeading' | t) : ('care.details.heading' | t: { step: requiresGeography() ? 5 : 4 }) }}
          </legend>
          @if (doctorJourney() && doctorMode() === 'NOW') {
            <div class="mt-2 rounded-2xl border border-green-200 bg-green-50 p-4">
              <p class="font-black text-green-950">{{ 'care.details.asap' | t }}</p>
              <p class="mt-1 text-sm text-green-900">{{ 'care.details.asapText' | t }}</p>
            </div>
          } @else if (doctorJourney()) {
            <p class="mt-2 text-sm text-ink-soft">{{ 'care.details.chooseTime' | t }}</p>
            @if (form.controls.preferredDate.value && form.controls.preferredTime.value) {
              <div class="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                <p class="text-xs font-bold uppercase tracking-wide text-brand-700">{{ 'care.details.recommendedTime' | t }}</p>
                <p class="mt-1 text-lg font-black text-ink">{{ form.controls.preferredDate.value }} · {{ form.controls.preferredTime.value }}</p>
                <p class="mt-1 text-sm text-ink-soft">{{ 'care.details.recommendedNote' | t }}</p>
              </div>
            }
          }
          @if (!doctorJourney() || doctorMode() !== 'NOW') {
          <div class="mt-3 grid gap-5 sm:grid-cols-2">
            <label class="font-semibold"
              >{{ 'care.details.preferredDate' | t }}<input
                type="date"
                formControlName="preferredDate"
                class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
            ><label class="font-semibold"
              >{{ 'care.details.preferredTime' | t }}<input
                type="time"
                formControlName="preferredTime"
                class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
            ><label class="font-semibold"
              >{{ 'care.details.contactMethod' | t }}<select
                formControlName="contactMethod"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
              >
                <option value="EMAIL">{{ 'care.details.email' | t }}</option>
                <option value="PHONE">{{ 'care.details.phone' | t }}</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select></label
            ><label class="font-semibold sm:col-span-2"
              >{{ 'care.details.notesOptional' | t }}<textarea
                formControlName="notes"
                maxlength="4000"
                rows="4"
                [placeholder]="'care.details.notesPlaceholder' | t"
                class="mt-2 w-full rounded-xl border p-3"
              ></textarea>
            </label>
          </div>
          } @else {
            <div class="mt-4 grid gap-5 sm:grid-cols-2">
              <label class="font-semibold">{{ 'care.details.contactMethod' | t }}<select formControlName="contactMethod" class="mt-2 min-h-12 w-full rounded-xl border px-3"><option value="EMAIL">{{ 'care.details.email' | t }}</option><option value="PHONE">{{ 'care.details.phone' | t }}</option><option value="WHATSAPP">WhatsApp</option></select></label>
              <label class="font-semibold sm:col-span-2">{{ 'care.details.notes' | t }} <span class="font-normal text-ink-muted">{{ 'care.details.optional' | t }}</span><textarea formControlName="notes" maxlength="4000" rows="3" [placeholder]="'care.details.doctorNotesPlaceholder' | t" class="mt-2 w-full rounded-xl border p-3"></textarea></label>
            </div>
          }
        </fieldset>
        @if (error()) {
          <p role="alert" class="rounded-xl bg-red-50 p-4 text-red-800">{{ error()! | t }}</p>
        }
        <button
          type="submit"
          [disabled]="submitting()"
          class="min-h-12 rounded-xl bg-brand-700 px-6 py-3 font-bold text-white disabled:opacity-60"
        >
          {{ (submitting() ? 'care.submit.requesting' : doctorJourney() ? 'care.submit.continueDoctor' : 'care.submit.submit') | t }}
        </button>
      </form>
      <aside class="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <h2 class="font-bold text-ink">{{ 'care.fastTrack.title' | t }}</h2>
        <p class="mt-1 text-sm text-ink-soft">
          {{ 'care.fastTrack.text' | t }}
        </p>
        <a
          routerLink="/me/fasttrack/new"
          class="mt-3 inline-block font-bold text-brand-800 underline"
          >{{ 'care.fastTrack.link' | t }}</a
        >
      </aside>
    }
  </main>`,
})
export class FindCarePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FindCareApiService);
  private readonly care = inject(CareRequestsApiService);
  private readonly auth = inject(AuthStateService);
  private readonly intent = inject(CareRequestIntentService);
  private readonly router = inject(Router);
  private readonly locations = inject(LocationDataService);
  private readonly dependantsApi = inject(DependantsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(TranslationService);
  private readonly credentialsApi = inject(ProviderCredentialsApiService);
  /** Optional specialty filter for doctors (e.g. Pediatrics). */
  readonly specialty = signal('');
  readonly specialtyOptions = signal<readonly Specialty[]>([]);
  readonly market = requestedMarket(this.route.snapshot.queryParamMap.get('market'), inject(LocalePreferencesService).market());
  readonly marketLanguage = rwandaLocale(this.route.snapshot.queryParamMap.get('lang'));
  readonly marketConfiguration = SMARTCLINIC_MARKETS[this.market];
  readonly countries = this.locations.getCountries();
  readonly states = signal<ReturnType<LocationDataService['getStates']>>([]);
  readonly cities = signal<ReturnType<LocationDataService['getCities']>>([]);
  readonly requestStateCode = new FormControl('', { nonNullable: true });
  readonly services = signal<
    readonly import('../../core/models/find-care.model').CareServiceDefinition[]
  >([]);
  readonly providers = signal<readonly PublicFindCareProvider[]>([]);
  readonly discoveryProviders = signal<readonly PublicFindCareProvider[]>([]);
  readonly servicesLoading = signal(true);
  readonly servicesError = signal(false);
  readonly requestedServiceCode = signal<string | null>(null);
  /** "Something else" chosen on the intent step: show the full service form. */
  readonly intentChosen = signal(false);
  /** Start with "What's going on?" unless a journey or service was already chosen. */
  readonly showIntentChooser = computed(
    () => !this.intentChosen() && !this.doctorJourney() && !this.requestedServiceCode() && !this.hostInstitutionReference(),
  );
  readonly doctorJourney = signal(false);
  readonly hostInstitutionReference = signal<string | null>(null);
  readonly doctorMode = signal<'NOW' | 'LATER' | 'HOSPITAL' | null>(null);
  readonly servicesLoaded = signal(false);
  private draftRestored = false;
  private draftDiscoveryStarted = false;
  readonly providersLoading = signal(false);
  readonly providersError = signal(false);
  readonly submitting = signal(false);
  /** Translation key of the current error message. */
  readonly error = signal<string | null>(null);
  readonly success = signal<CareRequest | null>(null);
  readonly dependants = signal<readonly Dependant[]>([]);
  readonly dependantsError = signal(false);
  readonly participant = signal<HealthCheckParticipantSelection>({ kind: 'SELF' });
  readonly form = this.fb.nonNullable.group({
    countryCode: this.fb.nonNullable.control<string>(this.market),
    stateOrRegion: [''],
    city: [''],
    serviceCode: ['', Validators.required],
    deliveryMode: ['' as CareDeliveryMode | '', Validators.required],
    preferredProviderReference: [''],
    preferredDate: [''],
    preferredTime: [''],
    contactMethod: [
      'EMAIL' as import('../../core/models/find-care.model').CareRequestContactMethod,
      Validators.required,
    ],
    notes: ['', [Validators.maxLength(4000)]],
  });
  readonly selectedDescription = () =>
    this.services().find((s) => s.code === this.form.controls.serviceCode.value)?.description ??
    null;
  readonly requiresGeography = () => {
    const mode = this.form.controls.deliveryMode.value;
    return mode === 'IN_PERSON' || mode === 'HOME_VISIT';
  };
  readonly providerSearchReady = () => {
    if (!this.form.controls.serviceCode.value || !this.form.controls.deliveryMode.value)
      return false;
    return (
      !this.requiresGeography() ||
      !!(
        this.form.controls.countryCode.value &&
        this.form.controls.stateOrRegion.value &&
        this.form.controls.city.value
      )
    );
  };
  readonly deliveryModes = () => {
    return [
      ...new Set(
        this.discoveryProviders().flatMap(
          (provider) =>
            provider.services
              .find((s) => s.code === this.form.controls.serviceCode.value)
              ?.deliveryOptions.map((option) => option.deliveryMode) ?? [],
        ),
      ),
    ];
  };
  constructor() {
    this.credentialsApi.specialties().subscribe({ next: (list) => this.specialtyOptions.set(list), error: () => this.specialtyOptions.set([]) });
    this.doctorJourney.set(this.route.snapshot.queryParamMap.get('journey') === 'doctor' || !!this.route.snapshot.queryParamMap.get('institution'));
    this.hostInstitutionReference.set(this.route.snapshot.queryParamMap.get('institution'));
    const initialDoctorMode=this.route.snapshot.queryParamMap.get('doctorMode'); if(initialDoctorMode==='NOW'||initialDoctorMode==='LATER'||initialDoctorMode==='HOSPITAL') this.chooseDoctorMode(initialDoctorMode);
    this.requestedServiceCode.set(this.readRequestedServiceCode(this.route.snapshot.queryParamMap.get('serviceCode')));
    this.route.queryParamMap.subscribe((params) => {
      this.doctorJourney.set(params.get('journey') === 'doctor' || !!params.get('institution'));
      this.hostInstitutionReference.set(params.get('institution'));
      this.requestedServiceCode.set(this.readRequestedServiceCode(params.get('serviceCode')));
      this.applyRequestedServiceCode();
    });
    this.states.set(this.locations.getStates(this.market));
    this.loadServices();
    this.dependantsApi
      .getDependants()
      .subscribe({
        next: (v) => this.dependants.set(v.items),
        error: () => this.dependantsError.set(true),
      });
    const saved = this.intent.take();
    if (saved) {
      this.form.patchValue(saved);
      this.updateGeographyValidators();
      if (saved.countryCode && saved.stateOrRegion) {
        this.states.set(this.locations.getStates(saved.countryCode));
        const state = this.states().find(
          (s) => s.name.trim().toLowerCase() === saved.stateOrRegion?.trim().toLowerCase(),
        );
        if (state) {
          this.requestStateCode.setValue(state.isoCode, { emitEvent: false });
          this.cities.set(this.locations.getCities(saved.countryCode, state.isoCode));
        }
      }
      this.draftRestored = true;
    }
  }
  openInstitutionCare(){ void this.router.navigate(['/me/institutions']); }
  chooseDoctorMode(mode: 'NOW' | 'LATER' | 'HOSPITAL') {
    this.doctorMode.set(mode);
    if (mode === 'HOSPITAL') {
      this.form.patchValue({ deliveryMode: 'IN_PERSON', preferredProviderReference: '' });
      this.updateGeographyValidators();
      this.discoverProviders();
      return;
    }
    this.form.patchValue({ deliveryMode: 'VIRTUAL', preferredProviderReference: '' });
    if (mode === 'NOW') {
      const suggested = new Date(Date.now() + 5 * 60_000);
      const local = this.localSlot(suggested);
      this.form.patchValue({ preferredDate: local.date, preferredTime: local.time });
    } else {
      const suggested = new Date();
      suggested.setDate(suggested.getDate() + 1);
      suggested.setHours(9, 0, 0, 0);
      this.form.patchValue({
        preferredDate: suggested.toISOString().slice(0, 10),
        preferredTime: '09:00',
      });
    }
    this.updateGeographyValidators();
    this.discoverProviders();
  }

  private localSlot(value: Date): { date: string; time: string } {
    const parts = new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(value);
    const part=(type:Intl.DateTimeFormatPartTypes)=>parts.find(x=>x.type===type)?.value??'';
    return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
  }

  selectParticipant(selection: HealthCheckParticipantSelection) {
    this.participant.set(selection);
  }
  isDependantSelected(reference: string) {
    const p = this.participant();
    return p.kind === 'DEPENDANT' && p.patientReference === reference;
  }
  participantRequest(): { participantPatientReference?: string } {
    const p = this.participant();
    return p.kind === 'DEPENDANT' ? { participantPatientReference: p.patientReference } : {};
  }
  loadServices() {
    this.servicesLoading.set(true);
    this.servicesError.set(false);
    this.api
      .getServices()
      .pipe(finalize(() => this.servicesLoading.set(false)))
      .subscribe({
        next: (v) => {
          // Lab tests and medicines usually come through a clinician, so they stay off the menu.
          // The one exception: a direct link for the blood group & genotype screen, which needs no prescription.
          const screeningLink = this.route.snapshot.queryParamMap.get('serviceCode') === 'LAB_REQUEST'
            && this.route.snapshot.queryParamMap.get('topic') === 'blood-group-genotype';
          this.services.set(v.filter((service) => !['BASIC_MEDICATIONS', ...(screeningLink ? [] : ['LAB_REQUEST'])].includes(service.code)));
          this.servicesLoaded.set(true);
          this.applyRequestedServiceCode();
          if (this.draftRestored && !this.requestedServiceIsValid() && !this.draftDiscoveryStarted) {
            this.draftDiscoveryStarted = true;
            this.discoverProviders();
          }
        },
        error: () => this.servicesError.set(true),
      });
  }

  private readRequestedServiceCode(value: string | null): string | null {
    const normalized = value?.trim() ?? '';
    return normalized || null;
  }

  private applyRequestedServiceCode(): void {
    if (!this.servicesLoaded()) return;
    const requested = this.requestedServiceCode();
    if (!requested || !this.services().some((service) => service.code === requested)) return;
    if (this.form.controls.serviceCode.value === requested) return;
    this.form.controls.serviceCode.setValue(requested);
    this.applyRequestedTopicAndMode();
    this.serviceChanged();
  }

  /** Links like "Find out your genotype" arrive with a topic and a place; fill them in so the patient only confirms. */
  private applyRequestedTopicAndMode(): void {
    const params = this.route.snapshot.queryParamMap;
    const note = REQUEST_TOPIC_NOTES[params.get('topic') ?? ''];
    if (note && !this.form.controls.notes.value.trim()) this.form.controls.notes.setValue(note);
    // Places come with the provider list, which loads after the service is set; choose it then.
    this.pendingDeliveryMode = params.get('mode') as CareDeliveryMode | null;
  }
  private pendingDeliveryMode: CareDeliveryMode | null = null;
  private applyPendingDeliveryMode(): void {
    const mode = this.pendingDeliveryMode;
    this.pendingDeliveryMode = null;
    if (mode && !this.form.controls.deliveryMode.value && this.deliveryModes().includes(mode)) {
      this.form.controls.deliveryMode.setValue(mode);
      this.deliveryModeChanged();
    }
  }

   requestedServiceIsValid(): boolean {
    const requested = this.requestedServiceCode();
    return !!requested && this.services().some((service) => service.code === requested);
  }
  countryChanged(countryCode: string) {
    this.form.controls.countryCode.setValue(countryCode, { emitEvent: false });
    this.requestStateCode.setValue('', { emitEvent: false });
    this.form.patchValue({ stateOrRegion: '', city: '', preferredProviderReference: '' });
    this.states.set(this.locations.getStates(this.form.controls.countryCode.value));
    this.cities.set([]);
    this.providers.set([]);
  }
  stateChanged(stateCode: string) {
    this.form.patchValue({ city: '', preferredProviderReference: '' });
    this.requestStateCode.setValue(stateCode, { emitEvent: false });
    const state = this.states().find((s) => s.isoCode === stateCode);
    this.form.controls.stateOrRegion.setValue(state?.name ?? '');
    this.cities.set(
      state ? this.locations.getCities(this.form.controls.countryCode.value, stateCode) : [],
    );
    this.providers.set([]);
  }
  serviceChanged() {
    this.form.patchValue({ deliveryMode: this.doctorJourney() && this.doctorMode() !== 'HOSPITAL' ? 'VIRTUAL' : this.doctorMode() === 'HOSPITAL' ? 'IN_PERSON' : '', preferredProviderReference: '' });
    this.discoveryProviders.set([]);
    this.providers.set([]);
    this.updateGeographyValidators();
    this.discoverProviders();
  }
  discoverProviders() {
    this.form.controls.preferredProviderReference.setValue('');
    const v = this.form.getRawValue();
    const deliveryMode = v.deliveryMode || undefined;
    if (!v.serviceCode || (deliveryMode && !this.providerSearchReady())) {
      this.providers.set([]);
      return;
    }
    this.providersLoading.set(true);
    this.providersError.set(false);
    this.api
      .getProviders({
        serviceCode: v.serviceCode,
        ...(deliveryMode ? { deliveryMode } : {}),
        ...(this.hostInstitutionReference() && deliveryMode === 'VIRTUAL' ? { hostProviderReference: this.hostInstitutionReference()! } : {}),
        ...(this.specialty() ? { specialty: this.specialty() } : {}),
        ...(deliveryMode === 'VIRTUAL' && this.market === 'RW'
          ? { countryCode: this.market }
          : deliveryMode && deliveryMode !== 'VIRTUAL'
          ? {
              countryCode: v.countryCode,
              stateOrRegion: v.stateOrRegion,
              city: v.city,
            }
          : {}),
        limit: 50,
      })
      .pipe(finalize(() => this.providersLoading.set(false)))
      .subscribe({
        next: (p) => {
          // if (!deliveryMode) {
            this.discoveryProviders.set(p.items);
            const available = this.deliveryModes();
            if (!this.doctorJourney() && this.form.controls.deliveryMode.value && !available.includes(this.form.controls.deliveryMode.value)) this.form.controls.deliveryMode.setValue('');
          // }
          this.providers.set(deliveryMode ? p.items : []);
          if (!deliveryMode) this.applyPendingDeliveryMode();
        },
        error: () => {
          this.providers.set([]);
          this.providersError.set(true);
        },
      });
  }
  deliveryModeChanged() {
    this.form.controls.preferredProviderReference.setValue('');
    this.updateGeographyValidators();
    this.discoverProviders();
  }
  private updateGeographyValidators() {
    for (const control of [
      this.form.controls.countryCode,
      this.form.controls.stateOrRegion,
      this.form.controls.city,
    ]) {
      if (this.requiresGeography()) control.setValidators(Validators.required);
      else control.clearValidators();
      control.updateValueAndValidity({ emitEvent: false });
    }
  }
  deliveryModeLabel(mode: CareDeliveryMode) {
    const key = ({ IN_PERSON: 'care.mode.inPerson', VIRTUAL: 'care.mode.virtual', HOME_VISIT: 'care.mode.homeVisit' } as Record<string, string>)[mode];
    return key ? this.i18n.t(key) : careDeliveryModeLabel(mode);
  }
  deliveryModeHelp(mode: CareDeliveryMode) {
    return this.i18n.t(
      mode === 'VIRTUAL'
        ? 'care.mode.virtualHelp'
        : mode === 'HOME_VISIT'
          ? 'care.mode.homeVisitHelp'
          : 'care.mode.inPersonHelp',
    );
  }
  specialtyChanged(code: string) {
    this.specialty.set(code);
    this.discoverProviders();
  }
  providerLabel(p: PublicFindCareProvider) {
    const verified = p.verified ? `✓ ${this.i18n.t('care.provider.verified')} · ` : '';
    const main = p.specialties?.length ? ` · ${p.specialties[0].name}` : '';
    const fast = p.services.find((s) => s.code === this.form.controls.serviceCode.value)
      ?.supportsFastTrack
      ? ` · ${this.i18n.t('care.provider.fastTrack')}`
      : '';
    const option = p.services
      .find((s) => s.code === this.form.controls.serviceCode.value)
      ?.deliveryOptions.find((o) => o.deliveryMode === this.form.controls.deliveryMode.value);
    const price = option ? ` · ${formatMinor(option.priceMinor, option.currency)}` : '';
    return `${verified}${p.displayName}${main} · ${p.providerType.replaceAll('_', ' ')} · ${p.location.city ?? this.form.controls.city.value}, ${p.location.stateOrRegion ?? this.form.controls.stateOrRegion.value}${price}${fast}`;
  }
  selectedProviderPrice() {
    const provider = this.providers().find(
      (p) => p.providerReference === this.form.controls.preferredProviderReference.value,
    );
    return (
      provider?.services
        .find((s) => s.code === this.form.controls.serviceCode.value)
        ?.deliveryOptions.find((o) => o.deliveryMode === this.form.controls.deliveryMode.value) ??
      null
    );
  }
  formatPrice = formatMinor;
  request(): CreateCareRequest {
    const v = this.form.getRawValue();
    return {
      serviceCode: v.serviceCode,
      deliveryMode: v.deliveryMode as CareDeliveryMode,
      ...(this.hostInstitutionReference() ? { hostProviderReference: this.hostInstitutionReference()! } : {}),
      ...(v.preferredProviderReference
        ? { preferredProviderReference: v.preferredProviderReference }
        : {}),
      ...(v.deliveryMode !== 'VIRTUAL'
        ? {
            countryCode: v.countryCode,
            stateOrRegion: v.stateOrRegion,
            city: v.city,
          }
        : {}),
      ...(v.preferredDate ? { preferredDate: v.preferredDate } : {}),
      ...(v.preferredTime ? { preferredTime: v.preferredTime } : {}),
      ...(v.preferredDate && v.preferredTime ? { preferredTimezone: this.market === 'RW' ? this.marketConfiguration.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone || this.marketConfiguration.timezone } : {}),
      contactMethod: v.contactMethod,
      ...(v.notes.trim() ? { notes: v.notes.trim() } : {}),
      ...this.participantRequest(),
    };
  }
  submit() {
    this.updateGeographyValidators();
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.request();
    if (!this.auth.authenticated() || !this.auth.isPatient()) {
      this.intent.save(request);
      void this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: '/me/request-care',
          ...(this.market === 'RW' ? { market: 'RW', lang: this.marketLanguage } : {}),
        },
      });
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.care
      .create(request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (r) => this.success.set(r),
        error: (e) => {
          if (e?.status === 409) this.discoverProviders();
          this.error.set(
            e?.status === 409
              ? 'care.error.unavailable'
              : 'care.error.submitFailed',
          );
        },
      });
  }
  statusLabel(status: string) {
    return (
      (
        {
          MATCHING: this.i18n.t('care.status.matching'),
          AWAITING_PROVIDER_RESPONSE: this.i18n.t('care.status.awaitingProvider'),
          PROVIDER_ACCEPTED: this.i18n.t('care.status.providerAccepted'),
        } as Record<string, string>
      )[status] ??
      status
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
}
