import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TranslatePipe } from '../../core/services/translation.service';

type Mark = 'hit' | 'near' | 'miss' | null;

/** Three worked examples, one per colour, so the rules make sense at a glance. */
const EXAMPLES: readonly { word: string; marks: readonly Mark[]; key: string; letter: string }[] = [
  { word: 'HEART', marks: ['hit', null, null, null, null], key: 'play.how.exHit', letter: 'H' },
  { word: 'STEPS', marks: [null, null, 'near', null, null], key: 'play.how.exNear', letter: 'E' },
  { word: 'LUNGS', marks: [null, 'miss', null, null, null], key: 'play.how.exMiss', letter: 'U' },
];

/** How to play the Health Word: shown before the first game and from the ? button. */
@Component({
  selector: 'app-how-to-play',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl bg-sand-50 p-4 text-left ring-1 ring-ink/[0.06] sm:p-5" aria-labelledby="how-heading" data-how-to-play>
      <h3 id="how-heading" class="font-display text-xl font-semibold text-ink">{{ 'play.how.title' | t }}</h3>
      <ol class="mt-3 grid gap-2 text-[15px] leading-6 text-ink">
        <li class="flex gap-2"><span class="grid size-6 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-bold text-white">1</span><span>{{ 'play.how.step1' | t: { tries: tries() } }}</span></li>
        <li class="flex gap-2"><span class="grid size-6 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-bold text-white">2</span><span>{{ 'play.how.step2' | t }}</span></li>
        <li class="flex gap-2"><span class="grid size-6 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-bold text-white">3</span><span>{{ 'play.how.step3' | t }}</span></li>
      </ol>
      <p class="mt-4 text-sm font-semibold text-ink">{{ 'play.how.examples' | t }}</p>
      <div class="mt-2 grid gap-3">
        @for (ex of examples; track ex.word) {
          <div>
            <div class="flex gap-1" aria-hidden="true">
              @for (ch of ex.word.split(''); track $index; let i = $index) {
                <span class="grid size-9 place-items-center rounded-md font-display text-lg font-bold {{ cls(ex.marks[i]) }}">{{ ch }}</span>
              }
            </div>
            <p class="mt-1 text-sm text-ink-soft">{{ ex.key | t: { letter: ex.letter } }}</p>
          </div>
        }
      </div>
      <ul class="mt-4 grid gap-1 text-sm text-ink-soft">
        <li>⏱ {{ 'play.how.clock' | t }}</li>
        <li>📅 {{ 'play.how.daily' | t }}</li>
        <li>🔤 {{ 'play.how.english' | t }}</li>
        <li>⭐ {{ 'play.how.points' | t }}</li>
      </ul>
      @if (closable()) {
        <button type="button" (click)="closed.emit()" class="mt-4 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white" data-how-close>{{ 'play.how.gotIt' | t }}</button>
      }
    </section>
  `,
})
export class HowToPlayComponent {
  readonly tries = input(6);
  readonly closable = input(false);
  readonly closed = output<void>();
  readonly examples = EXAMPLES;

  cls(m: Mark): string {
    if (m === 'hit') return 'bg-leaf-500 text-white';
    if (m === 'near') return 'bg-ochre-300 text-ink';
    if (m === 'miss') return 'bg-ink/30 text-white';
    return 'bg-white text-ink ring-2 ring-ink/10';
  }
}
