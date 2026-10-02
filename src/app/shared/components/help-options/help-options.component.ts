import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../../core/services/auth-state.service';
import {
  countryFromTimezone,
  SupportApiService,
  SupportCallbackTime,
  SupportTopic,
  whatsappLink,
} from '../../../core/services/support-api.service';

const TOPIC_TEXT: Record<SupportTopic, string> = {
  BOOK_CHECKUP: 'booking a checkup',
  SEE_DOCTOR: 'seeing a doctor',
  TEST_OR_RESULTS: 'a test or my results',
  MEDICINE: 'medicines',
  PAYMENT: 'a payment',
  ACCOUNT: 'my account',
  OTHER: 'using SmartClinic',
};

/**
 * "Talk to a person": call, WhatsApp, or ask for a call back. Works without an
 * account, so people who are less comfortable with apps can still get care.
 * Call and WhatsApp appear only when SmartClinic has set those numbers.
 */
@Component({
  selector: 'app-help-options',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl {{ tone() === 'dark' ? 'bg-white/[0.06] text-white ring-1 ring-white/15' : 'bg-white text-ink ring-1 ring-ink/[0.07]' }} p-5" [attr.aria-labelledby]="headingId">
      <h2 [id]="headingId" class="text-base font-semibold">{{ title() }}</h2>
      <p class="mt-1 text-sm {{ tone() === 'dark' ? 'text-white/70' : 'text-ink-soft' }}">
        {{ hint() }}@if (contact()?.hours; as hours) { <span> Open {{ hours }}.</span> }
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        @if (contact()?.phone; as phone) {
          <a [href]="'tel:' + phone" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800" data-help-call>
            <svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>
            Call {{ phone }}
          </a>
        }
        @if (contact()?.whatsapp; as wa) {
          <a [href]="whatsapp(wa)" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center gap-2 rounded-full bg-leaf-700 px-4 text-sm font-semibold text-white hover:bg-leaf-500" data-help-whatsapp>
            <svg aria-hidden="true" class="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.2-.2-.5-.3z"/></svg>
            WhatsApp us
          </a>
        }
        <button type="button" (click)="formOpen.set(!formOpen())" [attr.aria-expanded]="formOpen()" class="inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold {{ tone() === 'dark' ? 'border-white/30 text-white hover:bg-white/10' : 'border-ink/15 text-ink hover:bg-sand-50' }}" data-help-callback>
          Call me back
        </button>
      </div>

      @if (sent(); as reference) {
        <p role="status" class="mt-4 rounded-xl {{ tone() === 'dark' ? 'bg-white/10' : 'bg-leaf-50 text-leaf-700' }} p-3 text-sm font-semibold">
          Thank you. We'll call you{{ timeText() }}. Your reference is {{ reference }}.
        </p>
      } @else if (formOpen()) {
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-4 grid gap-3 sm:grid-cols-2" novalidate>
          <label class="grid gap-1 text-sm font-semibold">Your name
            <input formControlName="name" autocomplete="name" [id]="headingId + '-name'" class="min-h-11 rounded-xl border border-ink/15 bg-white px-3 font-normal text-ink" />
          </label>
          <label class="grid gap-1 text-sm font-semibold">Phone number
            <input formControlName="phone" type="tel" autocomplete="tel" inputmode="tel" [id]="headingId + '-phone'" class="min-h-11 rounded-xl border border-ink/15 bg-white px-3 font-normal text-ink" />
          </label>
          <label class="grid gap-1 text-sm font-semibold sm:col-span-2">Best time to call
            <select formControlName="preferredTime" [id]="headingId + '-time'" class="min-h-11 rounded-xl border border-ink/15 bg-white px-3 font-normal text-ink">
              <option value="ANYTIME">Any time</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
            </select>
          </label>
          @if (error()) { <p role="alert" class="text-sm font-semibold {{ tone() === 'dark' ? 'text-ochre-300' : 'text-clay-700' }} sm:col-span-2">{{ error() }}</p> }
          <button type="submit" [disabled]="sending()" class="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start {{ tone() === 'dark' ? 'bg-white !text-ink' : '' }}">
            {{ sending() ? 'Sending…' : 'Ask for a call' }}
          </button>
          <p class="text-xs {{ tone() === 'dark' ? 'text-white/60' : 'text-ink-muted' }} sm:col-span-2">We only use your number to call you about this. Please don't include health details here.</p>
        </form>
      }
    </section>
  `,
})
export class HelpOptionsComponent {
  private readonly api = inject(SupportApiService);
  private readonly auth = inject(AuthStateService);
  private readonly fb = inject(FormBuilder);

  readonly topic = input<SupportTopic>('OTHER');
  readonly title = input('Prefer to talk to someone?');
  readonly hint = input('Call or WhatsApp our team, or leave your number and we will call you.');
  readonly countryCode = input<string | null>(null);
  readonly tone = input<'light' | 'dark'>('light');

  private static nextId = 0;
  readonly headingId = `help-${++HelpOptionsComponent.nextId}`;

  private readonly contacts = toSignal(this.api.contacts(), { initialValue: null });
  readonly contact = computed(() => {
    const all = this.contacts();
    if (!all) return null;
    const country = this.countryCode() ?? countryFromTimezone();
    return all.countries[country] ?? all.default;
  });

  readonly formOpen = signal(false);
  readonly sending = signal(false);
  readonly sent = signal<string | null>(null);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: [this.auth.currentUser()?.displayName ?? '', [Validators.required, Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9][0-9 ()-]{6,22}$/)]],
    preferredTime: ['ANYTIME' as SupportCallbackTime],
  });

  private readonly sentTime = signal<SupportCallbackTime>('ANYTIME');
  readonly timeText = computed(() => ({ ANYTIME: '', MORNING: ' in the morning', AFTERNOON: ' in the afternoon', EVENING: ' in the evening' })[this.sentTime()]);

  whatsapp(number: string): string {
    return whatsappLink(number, `Hello SmartClinic, I need help with ${TOPIC_TEXT[this.topic()]}.`);
  }

  submit(): void {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(this.form.controls.phone.invalid ? 'Enter a phone number we can call, like +234 803 000 0000.' : 'Tell us your name.');
      return;
    }
    const v = this.form.getRawValue();
    this.sending.set(true);
    this.api
      .requestCallback({ name: v.name.trim(), phone: v.phone.trim(), topic: this.topic(), preferredTime: v.preferredTime, countryCode: this.countryCode() ?? countryFromTimezone() })
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (r) => {
          this.sentTime.set(r.preferredTime);
          this.sent.set(r.reference);
        },
        error: (e: HttpErrorResponse) =>
          this.error.set(e.status === 429 ? 'We already have your request and will call you soon.' : 'That didn’t go through. Check your number and try again.'),
      });
  }

}
