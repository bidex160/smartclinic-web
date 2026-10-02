import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FamilyKidsApiService, FamilyOverview, KidView } from '../../core/services/family-kids-api.service';
import { TranslatePipe, TranslationService } from '../../core/services/translation.service';

/** Top of the Family page: the family streak and a card per child linking to their kids corner. */
@Component({
  selector: 'app-family-kids-panel',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (overview(); as o) {
      <section class="mt-6 grid gap-4" aria-label="Family progress" data-family-panel>
        <div class="relative overflow-hidden rounded-[1.5rem] bg-ink p-5 text-white shadow-lift sm:p-6">
          <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true"></div>
          <div class="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-ochre-300">{{ 'kids.family.streakTitle' | t }}</p>
              <p class="font-display mt-1 text-3xl font-semibold" data-family-streak>
                @if (o.familyStreak.current) { 🔥 {{ 'kids.family.streakDays' | t: { n: o.familyStreak.current } }} }
                @else { {{ 'kids.family.streakNone' | t }} }
              </p>
              <p class="mt-1 max-w-xl text-sm text-white/70">{{ 'kids.family.streakHint' | t }}</p>
            </div>
            <div class="text-right text-sm">
              @if (o.familyStreak.activeToday) { <p class="rounded-full bg-leaf-500/20 px-3 py-1 font-semibold text-leaf-300">{{ 'kids.family.doneToday' | t }}</p> }
              @if (o.familyStreak.best) { <p class="mt-2 text-white/60">{{ 'kids.family.streakBest' | t: { n: o.familyStreak.best } }}</p> }
            </div>
          </div>
        </div>

        @if (kids().length) {
          <h2 class="font-display mt-2 text-xl font-semibold text-ink">{{ 'kids.family.kidsCorner' | t }}</h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (k of kids(); track k.patientReference) {
              <a [routerLink]="['/me/family/kids', k.patientReference]" class="group rounded-[1.25rem] bg-gradient-to-br from-ochre-50 via-white to-leaf-50 p-5 ring-1 ring-ochre-100 transition hover:-translate-y-0.5 hover:shadow-card" [attr.data-kid]="k.patientReference">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate font-display text-xl font-semibold text-ink">{{ k.firstName }}</p>
                    <p class="text-sm text-ink-muted">{{ ageLabel(k) }}</p>
                  </div>
                  <span class="grid size-14 shrink-0 place-items-center rounded-full bg-ochre-300 text-2xl shadow-card" aria-hidden="true">⭐</span>
                </div>
                <p class="mt-3 text-sm font-semibold text-ink">{{ 'kids.family.tasksToday' | t: { done: doneCount(k), total: k.tasks.length } }} · {{ 'kids.family.starsTotal' | t: { n: k.stars?.total ?? 0 } }}</p>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-ink/[0.06]" aria-hidden="true">
                  <div class="h-full rounded-full bg-leaf-500 transition-[width]" [style.width.%]="k.tasks.length ? (doneCount(k) / k.tasks.length) * 100 : 0"></div>
                </div>
                @if (k.nextVisit; as v) {
                  <p class="mt-3 text-xs text-ink-soft">🩺 {{ 'kids.visit.title' | t }}: {{ ('kids.visit.' + v.key) | t }} · {{ when(v.daysAway) }}</p>
                }
                <p class="mt-3 text-sm font-semibold text-brand-700 group-hover:underline">{{ 'kids.family.openCorner' | t: { name: k.firstName } }} →</p>
              </a>
            }
          </div>
        } @else {
          <p class="rounded-2xl bg-white p-5 text-ink-soft ring-1 ring-ink/[0.06]">{{ 'kids.family.noKids' | t }}</p>
        }
      </section>
    } @else if (error()) {
      <p role="alert" class="mt-6 rounded-2xl bg-clay-50 p-4 text-sm text-clay-700">{{ 'kids.family.loadError' | t }}</p>
    }
  `,
})
export class FamilyKidsPanelComponent {
  private readonly api = inject(FamilyKidsApiService);
  private readonly i18n = inject(TranslationService);
  readonly overview = signal<FamilyOverview | null>(null);
  readonly kids = signal<readonly KidView[]>([]);
  readonly error = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.api.overview().subscribe({
      next: (o) => {
        this.overview.set(o);
        this.kids.set(o.children.filter((c) => c.kidsCorner));
      },
      error: () => this.error.set(true),
    });
  }

  doneCount(k: KidView): number {
    return k.tasks.filter((t) => t.doneToday).length;
  }

  ageLabel(k: KidView): string {
    return k.age === null ? '' : k.age < 1 ? this.i18n.t('kids.family.ageBaby') : this.i18n.t('kids.family.age', { n: k.age });
  }

  when(daysAway: number): string {
    if (daysAway === 0) return this.i18n.t('kids.visit.today');
    return daysAway > 0 ? this.i18n.t('kids.visit.inDays', { n: daysAway }) : this.i18n.t('kids.visit.missed', { n: -daysAway });
  }
}
