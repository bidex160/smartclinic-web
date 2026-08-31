import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  HealthPassportMeasurement,
  HealthPassportOverview,
  HealthPassportProvenance,
  HealthPassportTimelineItem,
} from '../../core/models/health-passport.model';
import { HealthPassportApiService } from '../../core/services/health-passport-api.service';
@Component({
  selector: 'app-health-passport-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <header class="rounded-3xl bg-gradient-to-br from-brand-900 to-brand-700 p-7 text-white">
      <p class="font-bold uppercase tracking-wider text-brand-100">Smart Health Passport</p>
      <h1 class="mt-2 text-3xl font-bold">Your health story, together</h1>
      <p class="mt-3 max-w-2xl text-brand-100">
        Your health history, checks, results and recommendations in one place.
      </p>
    </header>
    @if (loading()) {
      <div role="status" class="mt-8 grid animate-pulse gap-4 md:grid-cols-3">
        <div class="h-32 rounded-2xl bg-slate-200"></div>
        <div class="h-32 rounded-2xl bg-slate-200"></div>
        <div class="h-32 rounded-2xl bg-slate-200"></div>
      </div>
    } @else if (error()) {
      <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        <p>Your Health Passport is unavailable right now.</p>
        <button type="button" (click)="load()" class="mt-3 font-bold text-brand-700 underline">
          Try again
        </button>
      </div>
    } @else if (passport(); as p) {
      @if (p.currentNextAction; as action) {
        <section class="mt-8 rounded-2xl border-2 border-brand-300 bg-brand-50 p-6">
          <p class="text-sm font-bold uppercase text-brand-700">Your next action</p>
          <h2 class="mt-2 text-xl font-bold">{{ action.title }}</h2>
          <p class="mt-2">{{ action.message }}</p>
          @if (action.cta.type === 'FIND_CARE') {
            <a
              routerLink="/request-care"
              class="mt-4 inline-flex rounded-lg bg-brand-700 px-4 py-3 font-bold text-white"
              >Find Care</a
            >
          } @else if (action.cta.type === 'HEALTH_CHECK_PACKAGE') {
            <a
              routerLink="/health-check/packages"
              class="mt-4 inline-flex rounded-lg bg-brand-700 px-4 py-3 font-bold text-white"
              >View Health Checks</a
            >
          }
        </section>
      }
      @if (p.latestMeasurements.length) {
        <section class="mt-8">
          <h2 class="text-2xl font-bold">Latest measurements</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            @for (m of p.latestMeasurements; track m.type + ':' + m.provenance) {
              <article class="rounded-2xl border bg-white p-5">
                <h3 class="font-bold">{{ measurementLabel(m.type) }}</h3>
                <p class="mt-3 text-xl font-bold">{{ measurementValue(m) }}</p>
                <p class="mt-2 text-sm font-semibold text-slate-600">
                  {{ provenance(m.provenance) }}
                </p>
                <p class="mt-1 text-sm text-slate-500">{{ date(m.recordedAt) }}</p>
              </article>
            }
          </div>
        </section>
      }
      <section class="mt-8 rounded-2xl border bg-white p-6">
        <h2 class="text-2xl font-bold">Reported health history</h2>
        <p class="mt-2 text-slate-600">
          Information reported by you in your latest completed Self-Check.
        </p>
        @if (!p.reportedHealthHistory.length) {
          <p class="mt-4 rounded-xl bg-slate-50 p-4">
            No health history has been reported in a completed Self-Check yet.
          </p>
        } @else {
          <dl class="mt-5 grid gap-5">
            @for (item of p.reportedHealthHistory; track item.key) {
              <div>
                <dt class="font-bold">{{ item.label }}</dt>
                <dd class="mt-1 whitespace-pre-line text-slate-700">
                  {{ historyValue(item.value, item.answerState) }}
                </dd>
                <dd class="mt-1 text-sm text-slate-500">
                  Reported by you · {{ date(item.reportedAt) }}
                </dd>
              </div>
            }
          </dl>
        }
      </section>
      @if (p.recentMedicationContext.length) {
        <section class="mt-8">
          <div class="flex justify-between gap-4">
            <h2 class="text-2xl font-bold">Recent prescriptions</h2>
            <a routerLink="/me/prescriptions" class="font-bold text-brand-700">View all</a>
          </div>
          <div class="mt-4 grid gap-4">
            @for (rx of p.recentMedicationContext; track rx.orderReference) {
              <article class="rounded-2xl border bg-white p-5">
                <h3 class="font-bold">Prescription from {{ rx.provider.displayName }}</h3>
                <p class="mt-1 text-sm text-slate-500">{{ date(rx.issuedAt) }}</p>
                <p class="mt-3">{{ medicineNames(rx.medicines) }}</p>
              </article>
            }
          </div>
        </section>
      }
      <section class="mt-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <h2 class="text-2xl font-bold">Health timeline</h2>
          <a routerLink="/me/self-checks" class="font-bold text-brand-700">My Self-Checks</a>
        </div>
        @if (timelineLoading()) {
          <p role="status" class="mt-4 rounded-xl border bg-white p-5">Loading health activity…</p>
        } @else if (timelineError()) {
          <div role="alert" class="mt-4 rounded-xl bg-red-50 p-5">
            <p>We couldn't load your health timeline.</p>
            <button
              type="button"
              (click)="loadTimeline(page())"
              class="mt-2 font-bold text-brand-700 underline"
            >
              Try again
            </button>
          </div>
        } @else if (!timeline().length) {
          <p class="mt-4 rounded-2xl border bg-white p-6">
            Your health activity will appear here as you complete care.
          </p>
        } @else {
          <ol class="mt-4 grid gap-4">
            @for (event of timeline(); track event.eventKey) {
              <li class="rounded-2xl border bg-white p-5">
                <p class="text-sm font-semibold text-brand-700">{{ eventType(event.type) }}</p>
                <h3 class="mt-1 font-bold">{{ event.title }}</h3>
                <p class="mt-2 text-slate-600">{{ event.description }}</p>
                <p class="mt-2 text-sm text-slate-500">
                  {{ date(event.occurredAt) }}
                  @if (event.provenance) {
                    · {{ provenance(event.provenance) }}
                  }
                </p>
                @if (eventLink(event); as link) {
                  <a [routerLink]="link" class="mt-3 inline-block font-bold text-brand-700"
                    >View details →</a
                  >
                }
              </li>
            }
          </ol>
          <div class="mt-5 flex justify-between">
            <button
              type="button"
              (click)="loadTimeline(page() - 1)"
              [disabled]="page() <= 1"
              class="rounded-lg border px-4 py-2 font-bold disabled:opacity-40"
            >
              Previous</button
            ><span>Page {{ page() }} of {{ totalPages() || 1 }}</span
            ><button
              type="button"
              (click)="loadTimeline(page() + 1)"
              [disabled]="page() >= totalPages()"
              class="rounded-lg border px-4 py-2 font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        }
      </section>
    }
  </main>`,
})
export class HealthPassportPageComponent {
  private readonly api = inject(HealthPassportApiService);
  readonly passport = signal<HealthPassportOverview | null>(null);
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
    return (
      {
        REPORTED_BY_YOU: 'Reported by you',
        CHECKED_BY_PROVIDER: 'Checked by a provider',
        CONFIRMED_BY_LABORATORY: 'Confirmed by a laboratory',
      } as const
    )[v];
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
    return `${v['value'] ?? 'Not provided'} ${m.unit}`.trim();
  }
  historyValue(v: unknown, state: string) {
    if (state === 'DONT_KNOW') return "I don't know";
    if (Array.isArray(v)) return v.join(', ');
    return typeof v === 'string' || typeof v === 'number' ? String(v) : 'Not provided';
  }
  medicineNames(v: readonly { name: string; strength: string | null }[]) {
    return v.map((x) => [x.name, x.strength].filter(Boolean).join(' ')).join(', ');
  }
  date(v: string) {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(v));
  }
  eventType(v: string) {
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
