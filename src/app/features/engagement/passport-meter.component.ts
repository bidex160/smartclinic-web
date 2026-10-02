import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EngagementSummary } from '../../core/models/engagement.model';

/** A ring showing how complete the Health Passport is, with the one next thing to do. */
@Component({
  selector: 'app-passport-meter',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-4" data-passport-meter>
      <div class="relative size-[4.5rem] shrink-0">
        <svg viewBox="0 0 36 36" class="size-full -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke-width="3.2" class="{{ tone() === 'dark' ? 'stroke-white/15' : 'stroke-sand-200' }}" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke-width="3.2" stroke-linecap="round" class="stroke-ochre-300 transition-[stroke-dasharray] duration-700"
            [attr.stroke-dasharray]="passport().percent + ' 100'" />
        </svg>
        <span class="absolute inset-0 grid place-items-center text-sm font-bold">{{ passport().percent }}%</span>
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold">Passport {{ passport().done }} of {{ passport().total }} complete</p>
        @if (passport().nextStep; as next) {
          <a [routerLink]="next.route" class="mt-1 inline-flex min-h-9 items-center gap-1 text-sm font-semibold {{ tone() === 'dark' ? 'text-ochre-300' : 'text-brand-700' }} underline-offset-2 hover:underline" data-passport-next>
            Next: {{ next.label }} <span aria-hidden="true">→</span>
          </a>
        } @else {
          <p class="mt-1 text-sm {{ tone() === 'dark' ? 'text-white/70' : 'text-ink-soft' }}">Every page filled in. Well done.</p>
        }
      </div>
    </div>
  `,
})
export class PassportMeterComponent {
  readonly summary = input.required<EngagementSummary>();
  readonly tone = input<'light' | 'dark'>('light');
  readonly passport = computed(() => this.summary().passport);
}
