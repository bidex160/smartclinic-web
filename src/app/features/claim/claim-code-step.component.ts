import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';

import { CodeChannel, CodeOption, FacilityOutreachApiService } from '../../core/services/facility-outreach-api.service';

const CHANNEL_LABEL: Record<CodeChannel, string> = { SMS: 'Text message', WHATSAPP: 'WhatsApp', EMAIL: 'Email' };
const CHANNEL_ICON: Record<CodeChannel, string> = { SMS: '💬', WHATSAPP: '🟢', EMAIL: '✉️' };

/**
 * Prove you manage this facility: we send a 6-digit code to the phone, WhatsApp or email in the
 * national registry (shown masked), and you type it in. Emits the claim token when it's right.
 */
@Component({
  selector: 'app-claim-code-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/[0.06]" data-code-step aria-labelledby="code-step-title">
      <h2 id="code-step-title" class="text-lg font-semibold text-ink">Confirm you manage {{ displayName() }}</h2>
      @if (loading()) {
        <p class="mt-3 text-ink-muted" role="status">Loading…</p>
      } @else if (!options().length) {
        <p class="mt-3 text-ink-soft" data-no-channels>We don’t have a registered phone or email for this facility, so we can’t send a code. You can still join: we’ll check your licence ourselves.</p>
      } @else if (!sentTo()) {
        <p class="mt-2 text-ink-soft">We’ll send a 6-digit code to the contact registered for this facility in the national Health Facility Registry.</p>
        <div class="mt-4 grid gap-2">
          @for (o of options(); track o.channel) {
            <button type="button" (click)="send(o.channel)" [disabled]="busy()"
              class="flex min-h-14 items-center gap-3 rounded-xl px-4 text-left ring-1 ring-ink/10 transition hover:ring-brand-600 disabled:opacity-50"
              [attr.data-send]="o.channel">
              <span aria-hidden="true" class="text-xl">{{ icon(o.channel) }}</span>
              <span class="grid"><span class="font-semibold text-ink">{{ label(o.channel) }}</span><span class="text-sm text-ink-muted">{{ o.masked }}</span></span>
            </button>
          }
        </div>
        <p class="mt-3 text-sm text-ink-muted">Not your number or email any more? Join anyway below and we’ll check your licence ourselves.</p>
      } @else {
        <p class="mt-2 text-ink-soft" data-sent>We sent a code by {{ label(sentChannel()!) }} to <strong class="text-ink">{{ sentTo() }}</strong>. It works for 10 minutes.</p>
        <form class="mt-4 flex flex-wrap items-end gap-3" (submit)="$event.preventDefault(); verify()">
          <label class="grid gap-1 text-sm font-semibold text-ink" for="claim-code">6-digit code
            <input id="claim-code" [value]="code()" (input)="code.set(digits($any($event.target).value))" inputmode="numeric" autocomplete="one-time-code" maxlength="7"
              class="min-h-12 w-40 rounded-xl border border-ink/20 px-3 text-center text-2xl tracking-[0.3em] focus:border-brand-600 focus:ring-4 focus:ring-brand-100" data-code-input />
          </label>
          <button type="submit" [disabled]="busy() || code().length !== 6" class="min-h-12 rounded-full bg-brand-700 px-6 font-semibold text-white disabled:opacity-50" data-verify>Confirm</button>
        </form>
        <p class="mt-3 text-sm text-ink-muted">
          No code?
          @if (wait() > 0) { You can ask again in {{ wait() }}s. }
          @else { <button type="button" class="font-semibold text-brand-700 underline" (click)="sentTo.set(null)" data-resend>Send another</button> }
        </p>
      }
      @if (error()) { <p role="alert" class="mt-3 text-sm font-semibold text-red-700" data-code-error>{{ error() }}</p> }
    </section>
  `,
})
export class ClaimCodeStepComponent implements OnInit {
  private readonly api = inject(FacilityOutreachApiService);
  readonly listingId = input.required<string>();
  readonly displayName = input<string>('this facility');
  /** Already known (from search), so we skip a request. */
  readonly initialOptions = input<readonly CodeOption[] | null>(null);
  readonly verified = output<string>();

  readonly options = signal<readonly CodeOption[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly sentTo = signal<string | null>(null);
  readonly sentChannel = signal<CodeChannel | null>(null);
  readonly code = signal('');
  readonly error = signal('');
  private readonly sentAt = signal(0);
  private readonly now = signal(Date.now());
  readonly wait = computed(() => Math.max(0, 60 - Math.floor((this.now() - this.sentAt()) / 1000)));

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    const known = this.initialOptions();
    if (known) { this.options.set(known); this.loading.set(false); return; }
    this.api.codeOptions(this.listingId()).subscribe({
      next: (r) => { this.options.set(r.channels); this.loading.set(false); },
      error: () => { this.options.set([]); this.loading.set(false); },
    });
  }

  label(c: CodeChannel) { return CHANNEL_LABEL[c]; }
  icon(c: CodeChannel) { return CHANNEL_ICON[c]; }
  digits(v: string) { return String(v ?? '').replace(/\D/g, '').slice(0, 6); }

  send(channel: CodeChannel): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api.sendCode(this.listingId(), channel).subscribe({
      next: (r) => { this.sentTo.set(r.sentTo); this.sentChannel.set(r.channel); this.sentAt.set(Date.now()); this.now.set(Date.now()); this.code.set(''); this.busy.set(false); },
      error: (e: HttpErrorResponse) => { this.error.set(message(e, 'We couldn’t send the code. Try another option.')); this.busy.set(false); },
    });
  }

  verify(): void {
    if (this.busy() || this.code().length !== 6) return;
    this.busy.set(true);
    this.error.set('');
    this.api.verifyCode(this.listingId(), this.code()).subscribe({
      next: (r) => { this.busy.set(false); this.verified.emit(r.claimToken); },
      error: (e: HttpErrorResponse) => { this.error.set(message(e, 'That didn’t work. Try again.')); this.busy.set(false); },
    });
  }
}

function message(e: HttpErrorResponse, fallback: string): string {
  const m = e?.error?.message;
  if (e?.status === 0) return 'SmartClinic could not be reached. Check your connection.';
  return typeof m === 'string' && m.length < 200 ? m : fallback;
}
