import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { GuidedSelfCheckProduct } from '../../core/models/guided-self-check.model';
import { GuidedSelfChecksApiService } from '../../core/services/guided-self-checks-api.service';
import { HealthCheckPackagesApiService } from '../../core/services/health-check-packages-api.service';
import { formatEarningMoney } from '../provider/provider-earning-presentation';
@Component({
  selector: 'app-health-journey-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <a routerLink="/me/dashboard" class="font-bold text-brand-700">← Dashboard</a>
    <header class="mt-6">
      <p class="font-bold uppercase tracking-wider text-brand-700">Your health journey</p>
      <h1 class="mt-2 text-3xl font-bold text-brand-900 sm:text-4xl">Choose your first step</h1>
      <p class="mt-3 max-w-2xl text-slate-600">
        Start from home, or book a preventive check with a verified provider.
      </p>
    </header>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading your health choices…</p>
    } @else if (error()) {
      <div role="alert" class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p>We couldn't load the health journey options.</p>
        <button type="button" (click)="load()" class="mt-3 font-bold text-brand-700 underline">
          Try again
        </button>
      </div>
    } @else {
      <section class="mt-8 grid gap-5 lg:grid-cols-3" aria-label="Health journey choices">
        <article
          class="flex flex-col rounded-2xl border-2 border-brand-300 bg-white p-6 shadow-soft"
        >
          <p class="text-sm font-bold uppercase text-brand-700">From home</p>
          <h2 class="mt-2 text-2xl font-bold">Guided Self-Check</h2>
          <p class="mt-3 text-slate-600">
            Start understanding your health from home with guided questions and a summary saved to
            your Smart Health Passport.
          </p>
          @if (product(); as p) {
            <p class="mt-5 text-xl font-bold">{{ money(p.effectivePriceMinor, p.currency) }}</p>
            @if (p.promotionActive && p.standardPriceMinor !== p.effectivePriceMinor) {
              <p class="text-sm text-slate-500">
                Standard price <s>{{ money(p.standardPriceMinor, p.currency) }}</s>
              </p>
            }
          }
          <a routerLink="/me/self-checks/start" class="mt-auto pt-6 font-bold text-brand-700"
            >Learn about Self-Check →</a
          >
        </article>
        @for (option of checkChoices; track option.code) {
          <article class="flex flex-col rounded-2xl border bg-white p-6 shadow-soft">
            <p class="text-sm font-bold uppercase text-brand-700">With a provider</p>
            <h2 class="mt-2 text-2xl font-bold">{{ option.label }}</h2>
            @if (packageFor(option.code); as item) {
              <p class="mt-3 text-slate-600">
                {{
                  item.description ||
                    'Choose this preventive Health Check from the current SmartClinic catalogue.'
                }}
              </p>
              @if (item.estimatedDurationMinutes) {
                <p class="mt-3 text-sm text-slate-600">
                  About {{ item.estimatedDurationMinutes }} minutes
                </p>
              }
            } @else {
              <p class="mt-3 text-slate-600">
                This option is currently unavailable in the Health Check catalogue.
              </p>
            }
            <a routerLink="/health-check/packages" class="mt-auto pt-6 font-bold text-brand-700"
              >View Health Check options →</a
            >
          </article>
        }
      </section>
    }
  </main>`,
})
export class HealthJourneyPageComponent {
  private readonly self = inject(GuidedSelfChecksApiService);
  private readonly packagesApi = inject(HealthCheckPackagesApiService);
  readonly product = signal<GuidedSelfCheckProduct | null>(null);
  readonly packages = signal<readonly HealthCheckPackage[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly checkChoices = [
    { code: 'ESSENTIAL', label: 'Essential Check' },
    { code: 'COMPLETE', label: 'Complete Check' },
  ] as const;
  readonly money = formatEarningMoney;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    let remaining = 2;
    const done = () => {
      if (--remaining === 0) this.loading.set(false);
    };
    this.self
      .product()
      .pipe(finalize(done))
      .subscribe({ next: (v) => this.product.set(v), error: () => this.error.set(true) });
    this.packagesApi
      .getPackages()
      .pipe(finalize(done))
      .subscribe({ next: (v) => this.packages.set(v), error: () => this.error.set(true) });
  }
  packageFor(code: string) {
    return this.packages().find((x) => x.code === code);
  }
}
