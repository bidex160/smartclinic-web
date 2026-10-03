import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

import { Specialty } from '../../../core/services/provider-credentials-api.service';

/**
 * Pick up to N specialties from the fixed list; tap ★ to make one the main one.
 * Searchable, grouped, large tap targets for phones.
 */
@Component({
  selector: 'app-specialty-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-specialty-picker>
      @if (selected().length) {
        <ul class="flex flex-wrap gap-2" aria-label="Chosen specialties">
          @for (code of selected(); track code) {
            <li class="flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-sm font-semibold text-brand-800 ring-1 ring-brand-200" [attr.data-chosen]="code">
              {{ nameOf(code) }}
              <button type="button" (click)="primary.set(code)" class="grid size-8 place-items-center rounded-full {{ primary() === code ? 'text-ochre-500' : 'text-slate-400 hover:text-ochre-500' }}" [attr.aria-label]="primary() === code ? nameOf(code) + ' is your main specialty' : 'Make ' + nameOf(code) + ' your main specialty'" [attr.aria-pressed]="primary() === code" data-make-primary>★</button>
              <button type="button" (click)="toggle(code)" class="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-white" [attr.aria-label]="'Remove ' + nameOf(code)">✕</button>
            </li>
          }
        </ul>
        @if (selected().length > 1) { <p class="mt-1 text-xs text-slate-500">★ marks your main specialty. Patients see it first.</p> }
      }
      <input
        type="search"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
        [placeholder]="placeholder()"
        class="mt-3 min-h-12 w-full rounded-lg border border-slate-300 px-3 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
        aria-label="Search specialties"
        data-specialty-search
      />
      <div class="mt-2 max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-2">
        @for (g of groups(); track g.name) {
          <p class="px-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ g.name }}</p>
          <div class="mt-1 flex flex-wrap gap-1.5">
            @for (s of g.items; track s.code) {
              <button
                type="button"
                (click)="toggle(s.code)"
                [disabled]="!isChosen(s.code) && full()"
                [attr.aria-pressed]="isChosen(s.code)"
                class="min-h-10 rounded-full px-3 text-sm ring-1 transition disabled:opacity-40 {{ isChosen(s.code) ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-slate-800 ring-slate-300 hover:ring-brand-400' }}"
                [attr.data-specialty]="s.code"
              >{{ s.name }}</button>
            }
          </div>
        } @empty {
          <p class="p-2 text-sm text-slate-500">No specialty matches “{{ query() }}”.</p>
        }
      </div>
      <p class="mt-1 text-xs text-slate-500">{{ selected().length }} of {{ max() }} chosen.</p>
    </div>
  `,
})
export class SpecialtyPickerComponent {
  readonly specialties = input.required<readonly Specialty[]>();
  readonly max = input(3);
  readonly placeholder = input('Search, e.g. paediatrics, heart, skin');
  readonly selected = model<readonly string[]>([]);
  readonly primary = model<string | null>(null);
  readonly query = signal('');

  readonly full = computed(() => this.selected().length >= this.max());
  readonly groups = computed(() => {
    const q = this.query().trim().toLowerCase();
    // Common lay words, so "heart" finds Cardiology and "children" finds Pediatrics.
    const alias: Record<string, string> = {
      CARDIOLOGY: 'heart', PEDIATRICS: 'children child baby paediatrics', OBSTETRICS_GYNECOLOGY: 'women pregnancy obgyn',
      DERMATOLOGY: 'skin', OPHTHALMOLOGY: 'eye eyes', ENT: 'ear nose throat', DENTISTRY: 'teeth dental tooth',
      PSYCHIATRY: 'mental mind', GENERAL_PRACTICE: 'gp family doctor', ORTHOPAEDICS: 'bone bones', NEPHROLOGY: 'kidney',
      ENDOCRINOLOGY: 'diabetes sugar', NEUROLOGY: 'brain nerves', PULMONOLOGY: 'lungs chest breathing', GASTROENTEROLOGY: 'stomach',
    };
    const items = this.specialties().filter((s) => !q || `${s.name} ${s.group ?? ''} ${alias[s.code] ?? ''}`.toLowerCase().includes(q));
    const out: { name: string; items: Specialty[] }[] = [];
    for (const s of items) {
      const name = s.group ?? 'Other';
      let g = out.find((x) => x.name === name);
      if (!g) out.push((g = { name, items: [] }));
      g.items.push(s);
    }
    return out;
  });

  nameOf(code: string): string {
    return this.specialties().find((s) => s.code === code)?.name ?? code;
  }

  isChosen(code: string): boolean {
    return this.selected().includes(code);
  }

  toggle(code: string): void {
    if (this.isChosen(code)) {
      const next = this.selected().filter((c) => c !== code);
      this.selected.set(next);
      if (this.primary() === code) this.primary.set(next[0] ?? null);
      return;
    }
    if (this.full()) return;
    this.selected.set([...this.selected(), code]);
    if (!this.primary()) this.primary.set(code);
  }
}
