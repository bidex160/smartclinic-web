import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { LanguageFeedbackApiService, LanguageFeedbackItem, LanguageFeedbackStatus } from '../../core/services/language-feedback-api.service';
import { APP_LANGUAGES, AppLanguage } from '../../core/services/locale-preferences.service';

/** Words people reported as reading wrong. Fix them in src/app/i18n/<language>/, then mark as fixed. */
@Component({
  selector: 'app-language-feedback-admin-page',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <h1 class="text-3xl font-bold text-brand-900">Language feedback</h1>
      <p class="mt-1 text-slate-600">Words people say read wrong in their language. Fix the text in the translation files, then mark it fixed.</p>
      <div class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter">
        @for (s of statuses; track s) {
          <button type="button" (click)="setStatus(s)" [attr.aria-pressed]="status() === s" class="min-h-10 rounded-full px-4 text-sm font-semibold {{ status() === s ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-300' }}">{{ s === 'OPEN' ? 'Open' : s === 'FIXED' ? 'Fixed' : 'Dismissed' }}</button>
        }
        @for (entry of openCounts(); track entry[0]) {
          <span class="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">{{ name(entry[0]) }}: {{ entry[1] }} open</span>
        }
      </div>
      @if (error()) { <p role="alert" class="mt-4 rounded-lg bg-red-50 p-3 text-red-800">{{ error() }}</p> }
      <ul class="mt-5 grid gap-3" data-feedback-list>
        @for (f of items(); track f.id) {
          <li class="rounded-2xl border border-slate-200 bg-white p-4" [attr.data-feedback]="f.id">
            <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
              <span><strong class="text-slate-800">{{ name(f.language) }}</strong> · {{ f.page || 'unknown page' }} · {{ f.createdAt | date: 'medium' }}</span>
              @if (f.status === 'OPEN') {
                <span class="flex gap-2">
                  <button type="button" (click)="mark(f, 'FIXED')" class="min-h-9 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white" data-mark-fixed>Mark fixed</button>
                  <button type="button" (click)="mark(f, 'DISMISSED')" class="min-h-9 rounded-lg px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300">Dismiss</button>
                </span>
              }
            </div>
            <p class="mt-2"><span class="text-xs font-semibold uppercase text-slate-500">Shown</span><br />{{ f.shownText }}</p>
            @if (f.suggestion) { <p class="mt-2"><span class="text-xs font-semibold uppercase text-slate-500">Suggested</span><br />{{ f.suggestion }}</p> }
            @if (f.catalogKeys.length) { <p class="mt-2 font-mono text-xs text-slate-500">{{ f.catalogKeys.join(', ') }}</p> }
          </li>
        } @empty {
          <li class="rounded-2xl bg-slate-50 p-5 text-slate-600">Nothing here.</li>
        }
      </ul>
    </main>
  `,
})
export class LanguageFeedbackAdminPageComponent {
  private readonly api = inject(LanguageFeedbackApiService);
  readonly statuses: readonly LanguageFeedbackStatus[] = ['OPEN', 'FIXED', 'DISMISSED'];
  readonly status = signal<LanguageFeedbackStatus>('OPEN');
  readonly items = signal<readonly LanguageFeedbackItem[]>([]);
  readonly openCounts = signal<readonly [string, number][]>([]);
  readonly error = signal('');

  constructor() {
    this.load();
  }

  name(code: string): string {
    return APP_LANGUAGES[code as AppLanguage]?.english ?? code;
  }

  setStatus(s: LanguageFeedbackStatus): void {
    this.status.set(s);
    this.load();
  }

  mark(f: LanguageFeedbackItem, status: LanguageFeedbackStatus): void {
    this.api.update(f.id, status).subscribe({ next: () => this.load(), error: () => this.error.set('Couldn’t update it. Try again.') });
  }

  private load(): void {
    this.api.list(this.status()).subscribe({
      next: (r) => { this.items.set(r.items); this.openCounts.set(Object.entries(r.openByLanguage)); this.error.set(''); },
      error: () => this.error.set('Couldn’t load language feedback.'),
    });
  }
}
