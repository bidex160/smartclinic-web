import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { whatsappLink } from '../../core/services/play-api.service';
import { TranslatePipe } from '../../core/services/translation.service';

/**
 * WhatsApp first (it's how most people here share), then the phone's own share sheet
 * (contacts, SMS, any app), then copy. The text never contains health information.
 */
@Component({
  selector: 'app-share-buttons',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-2" data-share>
      <a [href]="wa()" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1f8f4e] px-4 text-sm font-semibold text-white shadow-card hover:bg-[#187a42]" data-share-whatsapp>
        <svg viewBox="0 0 24 24" class="size-4" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>
        {{ 'play.share.whatsapp' | t }}
      </a>
      @if (canShare) {
        <button type="button" (click)="shareSheet()" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white shadow-card" data-share-native>
          <svg viewBox="0 0 24 24" class="size-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>
          {{ 'play.share.more' | t }}
        </button>
      }
      <button type="button" (click)="copy()" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-ink/15" data-share-copy>
        {{ (copied() ? 'play.share.copied' : 'play.share.copy') | t }}
      </button>
    </div>
  `,
})
export class ShareButtonsComponent {
  readonly text = input.required<string>();
  readonly url = input.required<string>();
  readonly title = input('SmartClinic');
  readonly copied = signal(false);
  readonly canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  readonly full = computed(() => `${this.text()}\n${this.url()}`);
  readonly wa = computed(() => whatsappLink(this.full()));

  shareSheet(): void {
    navigator.share?.({ title: this.title(), text: this.text(), url: this.url() }).catch(() => undefined);
  }

  copy(): void {
    navigator.clipboard?.writeText(this.full()).then(
      () => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2500);
      },
      () => undefined,
    );
  }
}
