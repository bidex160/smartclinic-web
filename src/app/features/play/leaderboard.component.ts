import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { BoardRow } from '../../core/services/play-api.service';
import { TranslatePipe } from '../../core/services/translation.service';

const MEDAL: Partial<Record<number, string>> = { 1: '🥇', 2: '🥈', 3: '🥉' };

/** Names, scores and active days only. Nobody's health information is ever on a board. */
@Component({
  selector: 'app-leaderboard',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="grid gap-1.5" data-leaderboard>
      @for (r of rows(); track $index) {
        <li class="flex items-center gap-3 rounded-xl px-3 py-2.5 {{ r.isMe ? 'bg-brand-50 ring-1 ring-brand-200' : 'bg-sand-50' }}" [attr.data-me]="r.isMe">
          <span class="grid w-8 shrink-0 place-items-center text-lg font-bold text-ink" [attr.aria-label]="'play.board.place' | t: { n: r.rank }">{{ medal[r.rank] ?? r.rank }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold text-ink">{{ r.name }} @if (r.isMe) { <span class="text-xs font-semibold text-brand-700">({{ 'play.board.you' | t }})</span> }</span>
            <span class="block text-xs text-ink-muted">{{ 'play.board.activeDays' | t: { n: r.daysActive } }}@if (r.doneToday) { · ✅ {{ 'play.board.today' | t }} }</span>
          </span>
          <span class="shrink-0 font-display text-xl font-semibold text-ink">{{ r.score }}</span>
        </li>
      }
    </ol>
  `,
})
export class LeaderboardComponent {
  readonly rows = input.required<readonly BoardRow[]>();
  readonly medal = MEDAL;
}
