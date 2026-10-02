import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DailyCheckIn } from '../../core/models/patient-dashboard.model';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';

const MOOD_TONES = ['', 'bg-clay-100 text-clay-700', 'bg-ochre-100 text-ochre-700', 'bg-sand-200 text-ink-soft', 'bg-leaf-100 text-leaf-700', 'bg-leaf-300 text-leaf-700'] as const;
const MOOD_LABELS = ['', 'Very low', 'Low', 'Okay', 'Good', 'Great'] as const;

/** The "Health" tab: everything about staying well and your health story in one place. */
@Component({
  selector: 'app-patient-health-hub-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-8 sm:pt-10">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Health</p>
      <h1 class="font-display mt-1 text-[2rem] font-semibold leading-tight text-ink sm:text-[2.4rem]">Your health, in one place</h1>
      <p class="mt-2 max-w-2xl text-ink-soft">How you’ve been feeling, your records and the checks that keep you ahead.</p>

      <section class="sc-card mt-6 p-5" aria-labelledby="week-heading">
        <div class="flex items-baseline justify-between gap-3">
          <h2 id="week-heading" class="font-display text-xl font-semibold text-ink">Your last 7 days</h2>
          @if (checkedInToday()) {
            <a routerLink="/me/dashboard" class="text-sm font-semibold text-leaf-700" aria-label="Checked in today. Update today's check-in">Checked in today ✓ <span class="text-brand-700">Update</span></a>
          } @else {
            <a routerLink="/me/dashboard" class="text-sm font-semibold text-brand-700">Check in today →</a>
          }
        </div>
        @if (loading()) {
          <p role="status" class="mt-4 text-sm text-ink-muted">Loading your check-ins…</p>
        } @else if (error()) {
          <p role="alert" class="mt-4 text-sm text-clay-700">Your check-ins are unavailable right now.</p>
        } @else {
          <ol class="mt-4 grid grid-cols-7 gap-1.5 text-center" data-mood-week>
            @for (day of days(); track day.localDate) {
              <li class="flex flex-col items-center gap-1">
                <span
                  class="grid size-10 place-items-center rounded-full text-xs font-bold {{ day.checkIn ? tone(day.checkIn.mood) : 'bg-sand-50 text-ink-muted ring-1 ring-ink/[0.06]' }}"
                  [attr.aria-label]="day.label + ': ' + (day.checkIn ? moodLabel(day.checkIn.mood) : 'no check-in')"
                >{{ day.checkIn ? day.checkIn.mood : '·' }}</span>
                <span class="text-[11px] font-semibold text-ink-muted" aria-hidden="true">{{ day.initial }}</span>
              </li>
            }
          </ol>
          @if (!checkInCount()) {
            <p class="mt-3 text-sm text-ink-muted">No check-ins yet. A 10-second check-in each day builds your picture over time.</p>
          }
        }
      </section>

      <nav class="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Health sections">
        @for (item of sections; track item.route) {
          <a [routerLink]="item.route" class="sc-tile flex items-start gap-4 rounded-[1.25rem] border border-ink/[0.07] bg-white p-5 shadow-card">
            <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true">
              <svg class="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                @for (d of item.icon; track $index) { <path [attr.d]="d" /> }
              </svg>
            </span>
            <span class="min-w-0">
              <strong class="block font-semibold text-ink">{{ item.label }}</strong>
              <span class="mt-0.5 block text-sm text-ink-muted">{{ item.hint }}</span>
            </span>
          </a>
        }
      </nav>
    </main>
  `,
})
export class PatientHealthHubPageComponent {
  private readonly api = inject(PatientDashboardApiService);
  private readonly timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly days = signal<readonly { localDate: string; label: string; initial: string; checkIn: DailyCheckIn | null }[]>([]);
  readonly checkInCount = signal(0);
  /** The week ends today, so the last day says whether today's check-in is done. */
  readonly checkedInToday = computed(() => this.days().at(-1)?.checkIn != null);

  readonly sections = [
    { label: 'Smart Health Passport', hint: 'Your health story, shared only when you choose', route: '/me/health-passport', icon: ['M5 3h11l3 3v15H5Z', 'M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0', 'M8 18h8'] },
    { label: 'Health Records', hint: 'Records from your care, and who can see them', route: '/me/health-records', icon: ['M6 3h9l4 4v14H6Z', 'M14 3v5h5M9 13h7M9 17h5'] },
    { label: 'Guided Self-Checks', hint: 'Understand your health from home', route: '/me/self-checks', icon: ['M9 11l2 2 4-4', 'M5 4h14v16H5Z'] },
    { label: 'Health Checks', hint: 'Book a checkup and see your results', route: '/me/health-checks', icon: ['M3 12h4l2-5 4 10 2-5h6'] },
    { label: 'Daily routines', hint: 'Water, movement, rest and reminders', route: '/me/dashboard', icon: ['M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z'] },
    { label: 'Family health', hint: 'Care for the people you look after', route: '/me/family', icon: ['M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M2 20a5 5 0 0 1 10 0M12 20a5 5 0 0 1 10 0'] },
  ] as const;

  constructor() {
    this.load();
  }

  load(now = new Date()): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getCheckIns(7, this.timezone).subscribe({
      next: ({ items }) => {
        const byDate = new Map(items.map((item) => [item.localDate, item]));
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: this.timezone }).format(now);
        this.days.set(
          Array.from({ length: 7 }, (_, index) => {
            const date = new Date(`${today}T12:00:00Z`);
            date.setUTCDate(date.getUTCDate() + index - 6);
            const localDate = date.toISOString().slice(0, 10);
            return {
              localDate,
              label: new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(date),
              initial: new Intl.DateTimeFormat('en-GB', { weekday: 'narrow', timeZone: 'UTC' }).format(date),
              checkIn: byDate.get(localDate) ?? null,
            };
          }),
        );
        this.checkInCount.set(items.length);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  tone(mood: number): string {
    return MOOD_TONES[mood] ?? MOOD_TONES[3];
  }

  moodLabel(mood: number): string {
    return MOOD_LABELS[mood] ?? 'Okay';
  }
}
