import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { GuidedSelfCheckProduct } from '../../core/models/guided-self-check.model';
import { GuidedSelfChecksApiService } from '../../core/services/guided-self-checks-api.service';
import { formatEarningMoney } from '../provider/provider-earning-presentation';
@Component({
  selector: 'app-guided-self-check-start-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-3xl px-5 py-10 sm:px-8">
    <a routerLink="/me/health-journey" class="font-bold text-brand-700">← Health journey</a>
    <article class="mt-6 rounded-3xl border bg-white p-6 shadow-soft sm:p-9">
      <p class="font-bold uppercase tracking-wider text-brand-700">Guided Self-Check</p>
      <h1 class="mt-2 text-3xl font-bold">Start understanding your health from home.</h1>
      <p class="mt-3 text-slate-600">
        Complete guided questions at your own pace. It is okay not to know every answer.
      </p>
      <div class="mt-7 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 class="text-lg font-bold">You'll complete</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>Guided health questions</li>
            <li>Measurements you already know</li>
            <li>Lifestyle and health-history information</li>
          </ul>
        </section>
        <section>
          <h2 class="text-lg font-bold">You'll receive</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>A completion summary when available</li>
            <li>Professional review where required</li>
            <li>One recommended next action</li>
            <li>A contribution to your Smart Health Passport</li>
          </ul>
        </section>
      </div>
      <div class="mt-7 rounded-xl bg-amber-50 p-4 text-amber-950">
        <strong>This is not a diagnosis.</strong>
        <p class="mt-1">
          Urgent medical concerns should not wait for a Self-Check. Seek urgent care when needed.
        </p>
      </div>
      @if (loading()) {
        <p role="status" class="mt-6">Loading current price…</p>
      } @else if (error()) {
        <div role="alert" class="mt-6">
          <p>The Self-Check product is unavailable right now.</p>
          <button type="button" (click)="load()" class="mt-2 font-bold text-brand-700 underline">
            Try again
          </button>
        </div>
      } @else if (product(); as p) {
        <div class="mt-7 border-t pt-6">
          <p class="text-sm text-slate-600">Current price</p>
          <p class="text-2xl font-bold">{{ money(p.effectivePriceMinor, p.currency) }}</p>
          @if (p.promotionActive && p.standardPriceMinor !== p.effectivePriceMinor) {
            <p class="text-sm text-slate-500">
              Standard price <s>{{ money(p.standardPriceMinor, p.currency) }}</s>
            </p>
          }
          <button
            type="button"
            (click)="proceed()"
            [disabled]="creating() || !p.available"
            class="mt-5 min-h-12 rounded-xl bg-brand-700 px-6 font-bold text-white disabled:opacity-50"
          >
            {{ creating() ? 'Preparing your Self-Check…' : 'Continue' }}
          </button>
          @if (createError()) {
            <p role="alert" class="mt-3 text-red-800">{{ createError() }}</p>
          }
        </div>
      }
    </article>
  </main>`,
})
export class GuidedSelfCheckStartPageComponent {
  private readonly api = inject(GuidedSelfChecksApiService);
  private readonly router = inject(Router);
  readonly product = signal<GuidedSelfCheckProduct | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly money = formatEarningMoney;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .product()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (v) => this.product.set(v), error: () => this.error.set(true) });
  }
  proceed() {
    if (this.creating()) return;
    this.creating.set(true);
    this.createError.set('');
    this.api
      .create()
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (v) => this.router.navigate(['/me/self-checks', v.reference]),
        error: () =>
          this.createError.set('We could not prepare your Self-Check. Please try again.'),
      });
  }
}
