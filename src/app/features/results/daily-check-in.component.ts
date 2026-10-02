import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';

import { DailyCareProgress, DailyCheckInScores } from '../../core/models/patient-dashboard.model';
import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { TranslatePipe } from '../../core/services/translation.service';

interface ScaleOption {
  readonly value: number;
  /** Translation key. */
  readonly label: string;
}

const MOODS: readonly (ScaleOption & { readonly tone: string; readonly mouth: string })[] = [
  { value: 1, label: 'dashboard.checkIn.level.veryLow', tone: 'bg-clay-100 text-clay-700', mouth: 'M8 16.5c1.2-1.6 2.5-2.3 4-2.3s2.8.7 4 2.3' },
  { value: 2, label: 'dashboard.checkIn.level.low', tone: 'bg-ochre-100 text-ochre-700', mouth: 'M8.5 15.8c1-.9 2.2-1.3 3.5-1.3s2.5.4 3.5 1.3' },
  { value: 3, label: 'dashboard.checkIn.level.okay', tone: 'bg-sand-200 text-ink-soft', mouth: 'M8.5 15h7' },
  { value: 4, label: 'dashboard.checkIn.level.good', tone: 'bg-leaf-100 text-leaf-700', mouth: 'M8.5 14.3c1 .9 2.2 1.3 3.5 1.3s2.5-.4 3.5-1.3' },
  { value: 5, label: 'dashboard.checkIn.level.great', tone: 'bg-leaf-300 text-leaf-700', mouth: 'M8 13.8c1.2 1.8 2.5 2.6 4 2.6s2.8-.8 4-2.6' },
];

const LEVELS: readonly ScaleOption[] = [
  { value: 1, label: 'dashboard.checkIn.level.veryLow' },
  { value: 2, label: 'dashboard.checkIn.level.low' },
  { value: 3, label: 'dashboard.checkIn.level.okay' },
  { value: 4, label: 'dashboard.checkIn.level.good' },
  { value: 5, label: 'dashboard.checkIn.level.great' },
];

/**
 * A 10-second daily wellbeing check-in. Tapping a face saves immediately;
 * energy and sleep are optional follow-ups. Self-reported, never a diagnosis.
 */
@Component({
  selector: 'app-daily-check-in',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl bg-sand-50 p-4 ring-1 ring-ink/[0.06] sm:p-5" aria-labelledby="check-in-heading">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="check-in-heading" class="font-semibold text-ink">
          {{ (mood() ? 'dashboard.checkIn.thanks' : 'dashboard.checkIn.question') | t }}
        </h3>
        @if (mood()) {
          <p class="text-xs text-ink-muted" aria-live="polite">{{ (saving() ? 'dashboard.checkIn.saving' : 'dashboard.checkIn.saved') | t }}</p>
        }
      </div>

      <div class="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" [attr.aria-label]="'dashboard.checkIn.mood' | t">
        @for (option of moods; track option.value) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="mood() === option.value"
            [attr.aria-label]="option.label | t"
            [disabled]="saving()"
            (click)="save({ mood: option.value })"
            class="group flex flex-col items-center gap-1 rounded-2xl p-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-wait {{ mood() === option.value ? 'bg-white shadow-card ring-2 ring-brand-500' : 'hover:bg-white' }}"
          >
            <span class="grid size-11 place-items-center rounded-full transition group-hover:scale-105 sm:size-12 {{ option.tone }} {{ mood() && mood() !== option.value ? 'opacity-50' : '' }}" aria-hidden="true">
              <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <circle cx="12" cy="12" r="9.2" />
                <path d="M9 10h.01M15 10h.01" stroke-width="2.4" />
                <path [attr.d]="option.mouth" />
              </svg>
            </span>
            <span class="text-[11px] font-medium text-ink-soft">{{ option.label | t }}</span>
          </button>
        }
      </div>

      @if (mood()) {
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          @for (scale of followUps; track scale.key) {
            <div>
              <p class="text-xs font-semibold text-ink-soft" [id]="'check-in-' + scale.key">{{ scale.question | t }} <span class="font-normal text-ink-muted">{{ 'dashboard.checkIn.optional' | t }}</span></p>
              <div class="mt-1.5 flex gap-1" role="radiogroup" [attr.aria-labelledby]="'check-in-' + scale.key">
                @for (level of levels; track level.value) {
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="scoreFor(scale.key) === level.value"
                    [attr.aria-label]="(scale.question | t) + ' ' + (level.label | t)"
                    [disabled]="saving()"
                    (click)="setScore(scale.key, level.value)"
                    class="h-8 flex-1 rounded-lg text-xs font-semibold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 {{ (scoreFor(scale.key) ?? 0) >= level.value ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-muted ring-ink/10 hover:ring-brand-300' }}"
                  >{{ level.value }}</button>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (error()) {
        <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ error() | t }}</p>
      }
      <p class="mt-3 text-[11px] leading-4 text-ink-muted">{{ 'dashboard.checkIn.disclaimer' | t }}</p>
    </section>
  `,
})
export class DailyCheckInComponent {
  private readonly api = inject(PatientDashboardApiService);

  readonly checkIn = input<DailyCheckInScores | null | undefined>(null);
  readonly saved = output<DailyCareProgress>();

  readonly moods = MOODS;
  readonly levels = LEVELS;
  readonly followUps = [
    { key: 'energy', question: 'dashboard.checkIn.energy' },
    { key: 'sleep', question: 'dashboard.checkIn.sleep' },
  ] as const;

  readonly mood = linkedSignal(() => this.checkIn()?.mood ?? null);
  readonly energy = linkedSignal(() => this.checkIn()?.energy ?? null);
  readonly sleep = linkedSignal(() => this.checkIn()?.sleep ?? null);
  readonly saving = signal(false);
  readonly error = signal('');

  private readonly timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';

  scoreFor(key: 'energy' | 'sleep'): number | null {
    return key === 'energy' ? this.energy() : this.sleep();
  }

  setScore(key: 'energy' | 'sleep', value: number): void {
    this.save(key === 'energy' ? { energy: value } : { sleep: value });
  }

  save(change: Partial<DailyCheckInScores>): void {
    if (this.saving()) return;
    const mood = change.mood ?? this.mood();
    if (!mood) return;
    const previous = { mood: this.mood(), energy: this.energy(), sleep: this.sleep() };
    this.mood.set(mood);
    if (change.energy !== undefined) this.energy.set(change.energy);
    if (change.sleep !== undefined) this.sleep.set(change.sleep);

    this.saving.set(true);
    this.error.set('');
    this.api
      .saveTodayCheckIn({ mood, energy: this.energy(), sleep: this.sleep(), timezone: this.timezone })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (progress) => this.saved.emit(progress),
        error: () => {
          this.mood.set(previous.mood);
          this.energy.set(previous.energy);
          this.sleep.set(previous.sleep);
          this.error.set('dashboard.checkIn.error');
        },
      });
  }
}
