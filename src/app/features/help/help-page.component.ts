import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthStateService } from '../../core/services/auth-state.service';
import { SupportTopic } from '../../core/services/support-api.service';
import { HelpOptionsComponent } from '../../shared/components/help-options/help-options.component';

/** One place to reach a person, for anyone, signed in or not. */
@Component({
  selector: 'app-help-page',
  imports: [HelpOptionsComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Help</p>
      <h1 class="font-display mt-2 text-4xl font-semibold text-ink">Talk to a person</h1>
      <p class="mt-3 text-lg leading-8 text-ink-soft">
        You don't need to use the app to get care. Tell us what you need and our team will help you book, find a doctor, a lab or medicines.
      </p>

      <fieldset class="mt-8">
        <legend class="font-semibold text-ink">What do you need help with?</legend>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          @for (option of topics; track option.code) {
            <label class="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-white px-4 ring-1 {{ topic() === option.code ? 'ring-2 ring-brand-700' : 'ring-ink/[0.08]' }}">
              <input type="radio" name="help-topic" [value]="option.code" [checked]="topic() === option.code" (change)="topic.set(option.code)" class="size-4 accent-brand-700" />
              <span>{{ option.label }}</span>
            </label>
          }
        </div>
      </fieldset>

      <div class="mt-6">
        <app-help-options [topic]="topic()" title="Reach us now" hint="Call, WhatsApp, or leave your number and we'll call you." />
      </div>

      <section class="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Do it yourself">
        <a [routerLink]="isPatient() ? '/me/book' : '/health-check/packages'" class="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.07] hover:ring-brand-300">
          <p class="font-semibold text-ink">Book a Smart Health Check</p>
          <p class="mt-1 text-sm text-ink-soft">At home or at a clinic near you.</p>
        </a>
        <a [routerLink]="isPatient() ? '/me/request-care' : '/login'" [queryParams]="isPatient() ? null : { returnUrl: '/me/request-care' }" class="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.07] hover:ring-brand-300">
          <p class="font-semibold text-ink">See a doctor or get a test</p>
          <p class="mt-1 text-sm text-ink-soft">Tell us what's going on and choose where.</p>
        </a>
      </section>

      <p class="mt-8 rounded-xl bg-clay-50 p-4 text-sm text-clay-700">
        In an emergency, go to the nearest hospital or call your local emergency number straight away.
      </p>
    </main>
  `,
})
export class HelpPageComponent {
  private readonly auth = inject(AuthStateService);
  readonly isPatient = computed(() => this.auth.isPatient());
  readonly topic = signal<SupportTopic>('BOOK_CHECKUP');
  readonly topics: readonly { code: SupportTopic; label: string }[] = [
    { code: 'BOOK_CHECKUP', label: 'Booking a checkup' },
    { code: 'SEE_DOCTOR', label: 'Seeing a doctor' },
    { code: 'TEST_OR_RESULTS', label: 'A test or my results' },
    { code: 'MEDICINE', label: 'Medicines' },
    { code: 'PAYMENT', label: 'A payment' },
    { code: 'ACCOUNT', label: 'My account' },
  ];
}
