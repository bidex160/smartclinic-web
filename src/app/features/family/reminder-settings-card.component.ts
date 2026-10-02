import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { NudgeSettings, NudgesApiService } from '../../core/services/family-kids-api.service';
import { APP_LANGUAGES, isLanguage, LocalePreferencesService } from '../../core/services/locale-preferences.service';
import { TranslatePipe } from '../../core/services/translation.service';

/** "Daily reminder" on the Me page: on/off, time, and WhatsApp when it's available. */
@Component({
  selector: 'app-reminder-settings-card',
  imports: [FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (settings(); as s) {
      <section class="sc-card p-5 sm:p-6" aria-labelledby="reminder-title" data-reminder-card>
        <h2 id="reminder-title" class="font-display text-xl font-semibold text-ink">⏰ {{ 'kids.reminder.title' | t }}</h2>
        <p class="mt-1 text-sm text-ink-muted">{{ 'kids.reminder.hint' | t }}</p>
        <label class="mt-4 flex min-h-11 items-center gap-3 text-ink">
          <input type="checkbox" [ngModel]="enabled()" (ngModelChange)="enabled.set($event)" class="size-5 accent-brand-700" data-reminder-on />
          <span class="font-semibold">{{ 'kids.reminder.on' | t }}</span>
        </label>
        @if (enabled()) {
          <div class="mt-3 flex flex-wrap items-end gap-4">
            <label class="grid gap-1 text-sm text-ink-soft">{{ 'kids.reminder.time' | t }}
              <input type="time" [ngModel]="time()" (ngModelChange)="time.set($event)" class="min-h-11 rounded-xl border border-ink/15 bg-white px-3 text-ink" data-reminder-time />
            </label>
            @if (s.whatsappAvailable) {
              <label class="flex min-h-11 items-center gap-2 text-sm text-ink">
                <input type="checkbox" [ngModel]="whatsapp()" (ngModelChange)="whatsapp.set($event)" class="size-5 accent-leaf-700" />
                {{ 'kids.reminder.whatsapp' | t }}
              </label>
            } @else {
              <p class="text-xs text-ink-muted">{{ 'kids.reminder.whatsappSoon' | t }}</p>
            }
          </div>
          <p class="mt-3 text-xs text-ink-muted">{{ 'kids.reminder.language' | t: { language: languageName() } }}</p>
        }
        <div class="mt-4 flex items-center gap-3">
          <button type="button" (click)="save()" [disabled]="saving()" class="min-h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:opacity-60" data-reminder-save>{{ 'kids.reminder.save' | t }}</button>
          @if (saved()) { <span role="status" class="text-sm font-semibold text-leaf-700">{{ 'kids.reminder.saved' | t }} ✓</span> }
          @if (error()) { <span role="alert" class="text-sm font-semibold text-clay-700">{{ 'kids.reminder.error' | t }}</span> }
        </div>
      </section>
    }
  `,
})
export class ReminderSettingsCardComponent {
  private readonly api = inject(NudgesApiService);
  private readonly locale = inject(LocalePreferencesService);
  readonly settings = signal<NudgeSettings | null>(null);
  readonly enabled = signal(true);
  readonly time = signal('08:00');
  readonly whatsapp = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal(false);
  readonly languageName = computed(() => APP_LANGUAGES[this.locale.language()].label);

  constructor() {
    if (!this.api.available()) return;
    this.api.get().subscribe({
      next: (s) => {
        this.settings.set(s);
        this.enabled.set(s.enabled);
        this.time.set(s.localTime);
        this.whatsapp.set(s.whatsapp);
      },
      error: () => undefined,
    });
  }

  save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(false);
    const lang = this.locale.language();
    this.api
      .update({
        enabled: this.enabled(),
        localTime: /^\d{2}:\d{2}$/.test(this.time()) ? this.time() : '08:00',
        whatsapp: this.whatsapp(),
        language: isLanguage(lang) ? lang : 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos',
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({ next: (s) => { this.settings.set(s); this.saved.set(true); }, error: () => this.error.set(true) });
  }
}
