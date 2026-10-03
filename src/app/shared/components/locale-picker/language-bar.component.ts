import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AppLanguage, LocalePreferencesService } from '../../../core/services/locale-preferences.service';
import { TranslatePipe } from '../../../core/services/translation.service';

/**
 * Until someone picks a language, a slim bar under the header offers this country's languages in
 * their own names: one tap and it's set (and saved to their account when signed in). ✓ keeps the
 * current one. It never comes back once they've chosen.
 */
@Component({
  selector: 'app-language-bar',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (locale.guessed()) {
      <div class="border-b border-ink/[0.06] bg-white/95" role="region" [attr.aria-label]="'common.locale.language' | t" data-language-bar>
        <div class="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-8">
          <span class="shrink-0 text-sm font-semibold text-ink-soft">🌐 {{ 'common.locale.pick' | t }}</span>
          @for (l of options(); track l.code) {
            <button type="button" (click)="pick(l.code)" [attr.lang]="l.code" [attr.aria-pressed]="locale.language() === l.code"
              class="min-h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold transition {{ locale.language() === l.code ? 'bg-ink text-white' : 'bg-sand-50 text-ink ring-1 ring-ink/10 hover:ring-ink/30' }}"
              [attr.data-bar-language]="l.code">{{ l.label }}</button>
          }
          <button type="button" (click)="locale.confirm()" class="ml-auto grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-sand-50" [attr.aria-label]="'common.locale.keep' | t" data-bar-keep>✓</button>
        </div>
      </div>
    }
  `,
})
export class LanguageBarComponent {
  readonly locale = inject(LocalePreferencesService);
  readonly options = computed(() => this.locale.languages().local);

  pick(code: AppLanguage): void {
    this.locale.chooseLanguage(code);
  }
}
