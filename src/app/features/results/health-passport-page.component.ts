import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import {
  HealthPassportMeasurement,
  HealthPassportOverview,
  HealthPassportProvenance,
  HealthPassportTimelineItem,
  HealthPassportTimelineType,
} from '../../core/models/health-passport.model';
import { PatientHealthBasics } from '../../core/models/health-basics.model';
import { EngagementApiService } from '../../core/services/engagement-api.service';
import { HealthBasicsApiService } from '../../core/services/health-basics-api.service';
import { HealthPassportApiService } from '../../core/services/health-passport-api.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';
import { QrCodeComponent } from '../../shared/components/qr-code.component';
import { PassportMeterComponent } from '../engagement/passport-meter.component';
/** Known timeline event types; anything new falls back to a readable form of the code. */
const EVENT_TYPE_KEYS: Readonly<Record<HealthPassportTimelineType, string>> = {
  SELF_CHECK_COMPLETED: 'passport.timeline.type.selfCheckCompleted',
  HEALTH_CHECK_COMPLETED: 'passport.timeline.type.healthCheckCompleted',
  GENERAL_CARE_COMPLETED: 'passport.timeline.type.generalCareCompleted',
  CLINICAL_RECORD_FINALIZED: 'passport.timeline.type.clinicalRecordFinalized',
  PRESCRIPTION_ISSUED: 'passport.timeline.type.prescriptionIssued',
  MEDICATION_DISPENSED: 'passport.timeline.type.medicationDispensed',
};
@Component({
  selector: 'app-health-passport-page',
  imports: [RouterLink, QrCodeComponent, PassportMeterComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .sc-passport-page { background-image: repeating-linear-gradient(135deg, rgba(29,21,48,.025) 0 2px, transparent 2px 9px); }
    .sc-stamp { border: 2.5px solid currentColor; border-radius: 9999px; transform: rotate(-8deg); }
    .sc-stamp-inner { border: 1px dashed currentColor; border-radius: 9999px; }
    .sc-mrz { letter-spacing: .18em; }
  `,
  template: `<main class="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-8 sm:pt-10">
    @if (loading()) {
      <div role="status" class="grid animate-pulse gap-4">
        <div class="h-72 rounded-[2rem] bg-sand-200"></div>
        <div class="h-32 rounded-2xl bg-sand-200"></div>
        <span class="sr-only">{{ 'passport.page.loading' | t }}</span>
      </div>
    } @else if (error()) {
      <div role="alert" class="rounded-2xl bg-clay-50 p-6 text-clay-700">
        <p>{{ 'passport.page.unavailable' | t }}</p>
        <button type="button" (click)="load()" class="mt-3 font-bold text-brand-700 underline">{{ 'passport.page.tryAgain' | t }}</button>
      </div>
    } @else if (passport(); as p) {
      <!-- The identity page: looks and reads like a passport, holds what staff need first. -->
      <section class="overflow-hidden rounded-[2rem] bg-white shadow-lift ring-1 ring-ink/[0.08]" aria-labelledby="passport-holder" data-passport-identity>
        <div class="relative bg-brand-900 px-5 py-4 text-white sm:px-7">
          <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true"></div>
          <div class="relative flex items-center justify-between gap-3">
            <span class="flex items-center gap-2">
              <img src="/assets/fanvico.png" alt="" class="size-8 rounded-lg bg-white/10 p-0.5" />
              <span>
                <span class="block text-[10px] font-semibold uppercase tracking-[0.22em] text-ochre-300">{{ 'passport.identity.network' | t }}</span>
                <span class="font-display block text-lg font-semibold leading-tight">Smart Health Passport</span>
              </span>
            </span>
            <span class="hidden text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60 sm:block">{{ 'passport.identity.personalRecord' | t }}<br />{{ 'passport.identity.carriedByYou' | t }}</span>
          </div>
        </div>

        <div class="sc-passport-page grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:p-7">
          <div class="flex items-start gap-4 sm:flex-col sm:items-center">
            <div class="w-32 shrink-0 rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-ink/10 sm:w-40">
              <app-qr-code [value]="p.patient.patientReference" [label]="'passport.identity.qrLabel' | t: { id: p.patient.patientReference }" />
            </div>
            <div class="sm:text-center">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">SmartClinic ID</p>
              <p class="font-mono text-lg font-bold tracking-[0.08em] text-ink" data-passport-id>{{ p.patient.patientReference }}</p>
              <a routerLink="/me/card" class="mt-1 inline-flex min-h-9 items-center text-sm font-semibold text-brand-700">{{ 'passport.identity.showCard' | t }}</a>
            </div>
          </div>

          <div class="min-w-0">
            <dl class="grid grid-cols-2 gap-x-4 gap-y-3">
              <div class="col-span-2">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{{ 'passport.identity.holder' | t }}</dt>
                <dd id="passport-holder" class="font-display text-2xl font-semibold text-ink sm:text-3xl">{{ p.patient.givenName }} {{ p.patient.familyName }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{{ 'passport.identity.dateOfBirth' | t }}</dt>
                <dd class="font-semibold text-ink">{{ p.patient.dateOfBirth ? date(p.patient.dateOfBirth) : '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{{ 'passport.identity.checksCompleted' | t }}</dt>
                <dd class="font-semibold text-ink">{{ p.summary.completedHealthChecks + p.summary.completedSelfChecks }}</dd>
              </div>
            </dl>

            <h2 class="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{{ 'passport.essentials.title' | t }}</h2>
            <dl class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" data-passport-essentials>
              @for (e of essentials(); track e.label) {
                <div class="rounded-xl p-3 {{ e.value ? 'bg-white ring-1 ring-ink/[0.08]' : 'border border-dashed border-ochre-300 bg-ochre-50' }}">
                  <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{{ e.label }}</dt>
                  @if (e.value) {
                    <dd class="mt-0.5 truncate font-semibold text-ink {{ e.big ? 'font-display text-xl' : 'text-sm' }}" [title]="e.value">{{ e.value }}</dd>
                  } @else {
                    <dd class="mt-0.5"><a [routerLink]="e.fix" class="text-sm font-semibold text-ochre-700 underline underline-offset-2">{{ e.empty }}</a></dd>
                  }
                </div>
              }
            </dl>
            <p class="mt-2 text-xs text-ink-muted">{{ 'passport.essentials.note' | t }}</p>

            @if (engagement(); as g) {
              <div class="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sand-50 p-4">
                <app-passport-meter [summary]="g" />
                <a routerLink="/me/progress" class="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white">
                  {{ 'passport.identity.level' | t: { level: g.level.number, points: g.points } }}
                </a>
              </div>
            }

            <div class="mt-5 flex flex-wrap gap-2">
              <a routerLink="/me/health-records/sharing/new" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
                <svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
                {{ 'passport.identity.share' | t }}
              </a>
              <a routerLink="/me/health-records/sharing" class="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink hover:bg-sand-50">{{ 'passport.identity.whoCanSee' | t }}</a>
            </div>
          </div>
        </div>
        <p class="sc-mrz overflow-hidden whitespace-nowrap bg-sand-100 px-5 py-2 font-mono text-[11px] text-ink-muted sm:px-7" aria-hidden="true">{{ mrz() }}</p>
      </section>

      @if (p.currentNextAction; as action) {
        <section class="mt-6 rounded-2xl border-2 border-brand-300 bg-brand-50 p-5 sm:p-6">
          <p class="text-sm font-bold uppercase text-brand-700">{{ 'passport.nextAction.title' | t }}</p>
          <h2 class="font-display mt-2 text-xl font-semibold">{{ action.title }}</h2>
          <p class="mt-2">{{ action.message }}</p>
          @if (action.cta.type === 'FIND_CARE') {
            <a routerLink="/me/request-care" class="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 font-bold text-white">Find Care</a>
          } @else if (action.cta.type === 'HEALTH_CHECK_PACKAGE') {
            <a routerLink="/health-check/packages" class="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 font-bold text-white">{{ 'passport.nextAction.viewHealthChecks' | t }}</a>
          }
        </section>
      }

      <section class="mt-8" aria-labelledby="measurements-heading">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <h2 id="measurements-heading" class="font-display text-2xl font-semibold">{{ 'passport.readings.title' | t }}</h2>
          <p class="flex flex-wrap gap-3 text-xs text-ink-muted" [attr.aria-label]="'passport.readings.stampKey' | t">
            <span class="inline-flex items-center gap-1"><span class="size-2.5 rounded-full bg-leaf-700"></span>{{ 'passport.stamp.labConfirmed' | t }}</span>
            <span class="inline-flex items-center gap-1"><span class="size-2.5 rounded-full bg-brand-700"></span>{{ 'passport.provenance.checkedByProvider' | t }}</span>
            <span class="inline-flex items-center gap-1"><span class="size-2.5 rounded-full bg-ochre-500"></span>{{ 'passport.provenance.reportedByYou' | t }}</span>
          </p>
        </div>
        @if (p.latestMeasurements.length) {
          <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (m of p.latestMeasurements; track m.type + ':' + m.provenance) {
              <article class="relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-ink/[0.07]" [attr.data-provenance]="m.provenance">
                <h3 class="pr-20 text-sm font-semibold text-ink-soft">{{ measurementLabel(m.type) }}</h3>
                <p class="font-display mt-1 text-2xl font-semibold text-ink">{{ measurementValue(m) }}</p>
                <p class="mt-2 text-xs text-ink-muted">{{ date(m.recordedAt) }}@if (m.provider) { · {{ m.provider.displayName }} }</p>
                <div class="sc-stamp absolute right-3 top-3 grid size-[4.5rem] place-items-center p-1 {{ stampTone(m.provenance) }}" aria-hidden="true">
                  <div class="sc-stamp-inner grid size-full place-items-center text-center text-[8.5px] font-black uppercase leading-[1.05] tracking-wider">{{ stampText(m.provenance) }}</div>
                </div>
                <p class="sr-only">{{ provenance(m.provenance) }}</p>
              </article>
            }
          </div>
        } @else {
          <p class="mt-4 rounded-2xl bg-white p-5 text-ink-soft ring-1 ring-ink/[0.06]">
            {{ 'passport.readings.emptyStart' | t }} <a routerLink="/me/book" class="font-semibold text-brand-700 underline">Smart Health Check</a> {{ 'passport.readings.emptyEnd' | t }}
          </p>
        }
      </section>

      <section class="mt-8 rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06] sm:p-6">
        <h2 class="font-display text-2xl font-semibold">{{ 'passport.history.title' | t }}</h2>
        <p class="mt-2 text-ink-soft">{{ 'passport.history.intro' | t }}</p>
        @if (!p.reportedHealthHistory.length) {
          <p class="mt-4 rounded-xl bg-sand-50 p-4">
            {{ 'passport.history.nothingYet' | t }} <a routerLink="/me/self-checks" class="font-semibold text-brand-700 underline">{{ 'passport.history.takeSelfCheck' | t }}</a> {{ 'passport.history.takesFiveMinutes' | t }}
          </p>
        } @else {
          <dl class="mt-5 grid gap-5 sm:grid-cols-2">
            @for (item of p.reportedHealthHistory; track item.key) {
              <div>
                <dt class="font-bold">{{ item.label }}</dt>
                <dd class="mt-1 whitespace-pre-line text-ink-soft">{{ historyValue(item.value, item.answerState) }}</dd>
                <dd class="mt-1 text-sm text-ink-muted">{{ 'passport.history.reportedOn' | t: { date: date(item.reportedAt) } }}</dd>
              </div>
            }
          </dl>
        }
      </section>
      @if (p.recentMedicationContext.length) {
        <section class="mt-8">
          <div class="flex justify-between gap-4">
            <h2 class="font-display text-2xl font-semibold">{{ 'passport.prescriptions.title' | t }}</h2>
            <a routerLink="/me/prescriptions" class="font-bold text-brand-700">{{ 'passport.prescriptions.viewAll' | t }}</a>
          </div>
          <div class="mt-4 grid gap-3">
            @for (rx of p.recentMedicationContext; track rx.orderReference) {
              <article class="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06]">
                <h3 class="font-bold">{{ 'passport.prescriptions.from' | t: { provider: rx.provider.displayName } }}</h3>
                <p class="mt-1 text-sm text-ink-muted">{{ date(rx.issuedAt) }}</p>
                <p class="mt-3">{{ medicineNames(rx.medicines) }}</p>
              </article>
            }
          </div>
        </section>
      }
      <section class="mt-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <h2 class="font-display text-2xl font-semibold">{{ 'passport.timeline.title' | t }}</h2>
          <a routerLink="/me/self-checks" class="font-bold text-brand-700">{{ 'passport.timeline.mySelfChecks' | t }}</a>
        </div>
        @if (timelineLoading()) {
          <p role="status" class="mt-4 rounded-xl bg-white p-5 ring-1 ring-ink/[0.06]">{{ 'passport.timeline.loading' | t }}</p>
        } @else if (timelineError()) {
          <div role="alert" class="mt-4 rounded-xl bg-clay-50 p-5">
            <p>{{ 'passport.timeline.loadError' | t }}</p>
            <button type="button" (click)="loadTimeline(page())" class="mt-2 font-bold text-brand-700 underline">{{ 'passport.page.tryAgain' | t }}</button>
          </div>
        } @else if (!timeline().length) {
          <p class="mt-4 rounded-2xl bg-white p-6 ring-1 ring-ink/[0.06]">{{ 'passport.timeline.empty' | t }}</p>
        } @else {
          <ol class="relative mt-5 grid gap-4 border-l-2 border-dashed border-sand-200 pl-6">
            @for (event of timeline(); track event.eventKey) {
              <li class="relative rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06]">
                <span aria-hidden="true" class="absolute -left-[2.05rem] top-6 size-4 rounded-full ring-4 ring-sand-50 {{ dotTone(event.provenance) }}"></span>
                <p class="text-sm font-semibold text-brand-700">{{ eventType(event.type) }}</p>
                <h3 class="mt-1 font-bold">{{ event.title }}</h3>
                <p class="mt-2 text-ink-soft">{{ event.description }}</p>
                <p class="mt-2 text-sm text-ink-muted">
                  {{ date(event.occurredAt) }}
                  @if (event.provenance) { · {{ provenance(event.provenance) }} }
                </p>
                @if (eventLink(event); as link) {
                  <a [routerLink]="link" class="mt-3 inline-block font-bold text-brand-700">{{ 'passport.timeline.viewDetails' | t }}</a>
                }
              </li>
            }
          </ol>
          <div class="mt-5 flex items-center justify-between">
            <button type="button" (click)="loadTimeline(page() - 1)" [disabled]="page() <= 1" class="min-h-10 rounded-full border px-4 font-bold disabled:opacity-40">{{ 'passport.timeline.previous' | t }}</button>
            <span class="text-sm text-ink-muted">{{ 'passport.timeline.page' | t: { page: page(), total: totalPages() || 1 } }}</span>
            <button type="button" (click)="loadTimeline(page() + 1)" [disabled]="page() >= totalPages()" class="min-h-10 rounded-full border px-4 font-bold disabled:opacity-40">{{ 'passport.timeline.next' | t }}</button>
          </div>
        }
      </section>
    }
  </main>`,
})
export class HealthPassportPageComponent {
  private readonly api = inject(HealthPassportApiService);
  private readonly basicsApi = inject(HealthBasicsApiService);
  private readonly engagementApi = inject(EngagementApiService);
  private readonly i18n = inject(TranslationService);
  readonly passport = signal<HealthPassportOverview | null>(null);
  readonly basics = signal<PatientHealthBasics | null>(null);
  /** Optional extras: if they fail, the passport still shows. */
  readonly engagement = this.engagementApi.latest;
  readonly essentials = computed(() => {
    const b = this.basics();
    const contact = b?.emergencyContactName || b?.emergencyContactPhone
      ? [b.emergencyContactName, b.emergencyContactPhone].filter(Boolean).join(' · ')
      : null;
    const t = (key: string) => this.i18n.t(key);
    return [
      { label: t('passport.basics.bloodGroup'), value: b?.bloodGroup ?? null, empty: t('passport.essentials.findOut'), fix: '/me/profile', big: true },
      { label: t('passport.basics.genotype'), value: b?.genotype ?? null, empty: t('passport.essentials.findOut'), fix: '/me/profile', big: true },
      { label: t('passport.basics.allergies'), value: b?.allergies ?? null, empty: t('passport.essentials.add'), fix: '/me/profile', big: false },
      { label: t('passport.basics.emergencyContact'), value: contact, empty: t('passport.essentials.add'), fix: '/me/profile', big: false },
    ];
  });
  /** Decorative machine-readable line, built only from the name and ID already on screen. */
  readonly mrz = computed(() => {
    const p = this.passport()?.patient;
    if (!p) return '';
    const clean = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const line = `SHP<SMARTCLINIC<${clean(p.familyName)}<<${clean(p.givenName)}<<${clean(p.patientReference)}`;
    return (line + '<'.repeat(80)).slice(0, 80);
  });
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly timeline = signal<readonly HealthPassportTimelineItem[]>([]);
  readonly timelineLoading = signal(false);
  readonly timelineError = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .overview()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (v) => {
          this.passport.set(v);
          this.loadTimeline(1);
        },
        error: () => this.error.set(true),
      });
    this.basicsApi.get().pipe(catchError(() => of(null))).subscribe((b) => this.basics.set(b));
    this.engagementApi.overview().pipe(catchError(() => of(null))).subscribe();
  }
  stampText(v: HealthPassportProvenance) {
    return this.i18n.t(({ REPORTED_BY_YOU: 'passport.stamp.selfReported', CHECKED_BY_PROVIDER: 'passport.stamp.checkedByProvider', CONFIRMED_BY_LABORATORY: 'passport.stamp.labConfirmed' } as const)[v]);
  }
  stampTone(v: HealthPassportProvenance) {
    return ({ REPORTED_BY_YOU: 'text-ochre-500', CHECKED_BY_PROVIDER: 'text-brand-700', CONFIRMED_BY_LABORATORY: 'text-leaf-700' } as const)[v];
  }
  dotTone(v?: HealthPassportProvenance) {
    return v ? ({ REPORTED_BY_YOU: 'bg-ochre-500', CHECKED_BY_PROVIDER: 'bg-brand-700', CONFIRMED_BY_LABORATORY: 'bg-leaf-700' } as const)[v] : 'bg-sand-200';
  }
  loadTimeline(page: number) {
    if (page < 1 || this.timelineLoading()) return;
    this.timelineLoading.set(true);
    this.timelineError.set(false);
    this.api
      .timeline(page, 10)
      .pipe(finalize(() => this.timelineLoading.set(false)))
      .subscribe({
        next: (v) => {
          this.timeline.set(v.items);
          this.page.set(v.page);
          this.totalPages.set(v.totalPages);
        },
        error: () => this.timelineError.set(true),
      });
  }
  provenance(v: HealthPassportProvenance) {
    return this.i18n.t(
      (
        {
          REPORTED_BY_YOU: 'passport.provenance.reportedByYou',
          CHECKED_BY_PROVIDER: 'passport.provenance.checkedByProvider',
          CONFIRMED_BY_LABORATORY: 'passport.provenance.confirmedByLaboratory',
        } as const
      )[v],
    );
  }
  measurementLabel(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (x) => x.toUpperCase());
  }
  measurementValue(m: HealthPassportMeasurement) {
    const v = m.value;
    if ('systolic' in v && 'diastolic' in v) return `${v['systolic']}/${v['diastolic']} ${m.unit}`;
    if ('primary' in v && 'secondary' in v) return `${v['primary']}/${v['secondary']} ${m.unit}`;
    return `${v['value'] ?? this.i18n.t('passport.value.notProvided')} ${m.unit}`.trim();
  }
  historyValue(v: unknown, state: string) {
    if (state === 'DONT_KNOW') return this.i18n.t('passport.history.dontKnow');
    if (Array.isArray(v)) return v.join(', ');
    return typeof v === 'string' || typeof v === 'number' ? String(v) : this.i18n.t('passport.value.notProvided');
  }
  medicineNames(v: readonly { name: string; strength: string | null }[]) {
    return v.map((x) => [x.name, x.strength].filter(Boolean).join(' ')).join(', ');
  }
  date(v: string) {
    return this.i18n.formatDate(v, { dateStyle: 'medium' });
  }
  eventType(v: string) {
    const key = EVENT_TYPE_KEYS[v as HealthPassportTimelineType];
    if (key) return this.i18n.t(key);
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (x) => x.toUpperCase());
  }
  eventLink(e: HealthPassportTimelineItem): readonly string[] | null {
    if (e.type === 'SELF_CHECK_COMPLETED') return ['/me/self-checks', e.sourceReference];
    if (e.type === 'HEALTH_CHECK_COMPLETED') return ['/me/health-checks', e.sourceReference];
    if (e.type === 'CLINICAL_RECORD_FINALIZED') return ['/me/health-records', e.sourceReference];
    if (e.type === 'PRESCRIPTION_ISSUED') return ['/me/prescriptions', e.sourceReference];
    return null;
  }
}
