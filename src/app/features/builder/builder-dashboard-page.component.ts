import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BuilderDashboard, BuilderProgressItem } from '../../core/models/builder-dashboard.model';
import { ReferralTargetType } from '../../core/models/referral.model';
import { BuilderApiService } from '../../core/services/builder-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-builder-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      @if (loading()) {
        <section aria-label="Loading Builder dashboard" class="grid gap-5">
          <div class="h-36 animate-pulse rounded-[2rem] bg-white shadow-sm"></div>
          <div class="grid gap-4 md:grid-cols-4">
            @for (item of [1, 2, 3, 4]; track item) {
              <div class="h-28 animate-pulse rounded-2xl bg-white shadow-sm"></div>
            }
          </div>
          <div class="h-72 animate-pulse rounded-[2rem] bg-white shadow-sm"></div>
        </section>
      } @else if (error()) {
        <section class="rounded-[2rem] border border-red-100 bg-white p-8 shadow-sm" role="alert">
          <p class="text-sm font-bold uppercase tracking-[0.18em] text-red-600">Builder dashboard</p>
          <h1 class="mt-3 text-3xl font-bold text-slate-950">We couldn't load your Builder dashboard</h1>
          <p class="mt-3 max-w-2xl text-slate-600">Please try again. If this continues, sign out and sign back in.</p>
          <button type="button" (click)="load()" class="mt-6 min-h-11 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700">Retry</button>
        </section>
      } @else if (dashboard(); as data) {
        <section class="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-sm sm:p-8">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-sm font-bold uppercase tracking-[0.18em] text-brand-700">SmartClinic Builder</p>
              <h1 class="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Welcome back, {{ firstName() }}</h1>
              <p class="mt-3 max-w-2xl text-lg leading-8 text-slate-600">Build your healthcare impact by connecting people with trusted care.</p>
            </div>
            <a routerLink="/me/dashboard" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-3 font-bold text-brand-700 shadow-sm hover:border-brand-300 hover:shadow-md">Open Patient Portal</a>
          </div>
        </section>

        <section class="mt-7" aria-labelledby="impact-heading">
          <h2 id="impact-heading" class="text-xl font-bold text-slate-950">Your impact</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            @for (stat of stats(data); track stat.label) {
              <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-sm font-semibold text-slate-500">{{ stat.label }}</p>
                <p class="mt-3 text-4xl font-bold text-brand-700">{{ stat.value }}</p>
                <p class="mt-2 text-sm text-slate-500">Qualified referrals</p>
              </article>
            }
          </div>
        </section>

        <section class="mt-7 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 class="text-xl font-bold text-slate-950">Your referral level</h2>
                <p class="mt-2 text-slate-600">{{ levelSummary(data) }}</p>
              </div>
              <span class="w-fit rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">{{ data.currentLevel?.name ?? 'No level yet' }}</span>
            </div>

            <div class="mt-6 grid gap-5">
              @for (item of data.progress; track item.category) {
                <div>
                  <div class="flex items-center justify-between gap-4">
                    <p class="font-bold text-slate-800">{{ categoryLabel(item.category) }}</p>
                    <p class="text-sm font-bold text-slate-600">{{ item.qualified }} / {{ item.required }}</p>
                  </div>
                  <div class="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full rounded-full bg-brand-600" [style.width.%]="progressPercent(item)"></div>
                  </div>
                  @if (!item.completed) {
                    <p class="mt-1 text-sm text-slate-500">{{ item.remaining }} remaining</p>
                  }
                </div>
              }
            </div>
          </article>

          <article class="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-sm sm:p-7">
            <h2 class="text-xl font-bold text-slate-950">Your SmartClinic referral link</h2>
            <p class="mt-2 text-slate-600">Share this link with patients, clinics, laboratories and pharmacies you want to invite.</p>
            <div class="mt-5 break-all rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">{{ data.referralUrl }}</div>
            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" (click)="copyLink(data.referralUrl)" class="min-h-12 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700">Copy link</button>
              <button type="button" (click)="shareLink(data.referralUrl)" class="min-h-12 rounded-xl border border-brand-200 bg-white px-5 py-3 font-bold text-brand-700 hover:border-brand-300">Share</button>
            </div>
            @if (copyStatus()) {
              <p class="mt-3 text-sm font-bold text-emerald-700">{{ copyStatus() }}</p>
            }
          </article>
        </section>

        <section class="mt-7 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 class="text-xl font-bold text-slate-950">Quick access</h2>
            <div class="mt-5 grid grid-cols-2 gap-3">
              @for (action of quickActions(data.referralUrl); track action.label) {
                <button type="button" (click)="action.run()" class="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-bold text-slate-800 hover:border-brand-200 hover:bg-brand-50">{{ action.label }}</button>
              }
            </div>
          </article>

          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-xl font-bold text-slate-950">Recent referrals</h2>
            </div>
            <div class="mt-5 grid gap-3">
              @if (data.recentReferrals.length) {
                @for (referral of data.recentReferrals; track referral.reference) {
                  <div class="rounded-2xl border border-slate-200 p-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p class="font-bold text-slate-900">{{ referral.name }}</p>
                        <p class="mt-1 text-sm text-slate-500">{{ categoryLabel(referral.type) }} · {{ referral.status }}</p>
                      </div>
                      <time class="text-sm font-semibold text-slate-500">{{ formatDate(referral.createdAt) }}</time>
                    </div>
                  </div>
                }
              } @else {
                <p class="rounded-2xl border border-dashed border-slate-300 p-5 text-slate-600">No referrals yet. Share your link to start building your healthcare impact.</p>
              }
            </div>
          </article>
        </section>

        <section class="mt-7 rounded-[2rem] border border-brand-100 bg-brand-900 p-6 text-white shadow-sm sm:p-7">
          <h2 class="text-xl font-bold">Your Patient Portal</h2>
          <p class="mt-2 max-w-3xl text-brand-50">Your Builder account is also your SmartClinic patient account. Access your healthcare, appointments and health records from your Patient Portal.</p>
          <a routerLink="/me/dashboard" class="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 font-bold text-brand-800">Open Patient Portal</a>
        </section>
      }
    </main>
  `,
})
export class BuilderDashboardPageComponent {
  private readonly api = inject(BuilderApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authState = inject(AuthStateService);

  readonly dashboard = signal<BuilderDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly copyStatus = signal<string | null>(null);
  readonly firstName = computed(() => this.authState.currentUser()?.displayName?.split(/\s+/)[0] || 'Builder');

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getDashboard().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
      error: () => this.error.set(true),
    });
  }

  stats(data: BuilderDashboard) {
    return [
      { label: 'Patients referred', value: data.qualifiedPatients },
      { label: 'Clinics referred', value: data.qualifiedClinics },
      { label: 'Laboratories referred', value: data.qualifiedLaboratories },
      { label: 'Pharmacies referred', value: data.qualifiedPharmacies },
    ];
  }

  levelSummary(data: BuilderDashboard): string {
    if (!data.nextLevel) return data.currentLevel ? `${data.currentLevel.name} complete` : 'Start qualifying referrals to reach Level 1.';
    return data.currentLevel ? `Progress to ${data.nextLevel.name}` : `Progress to ${data.nextLevel.name}`;
  }

  categoryLabel(category: ReferralTargetType): string {
    switch (category) {
      case 'PATIENT': return 'Patients';
      case 'CLINIC': return 'Clinics';
      case 'LABORATORY': return 'Laboratories';
      case 'PHARMACY': return 'Pharmacies';
      case 'INDIVIDUAL': return 'Individual providers';
    }
  }

  progressPercent(item: BuilderProgressItem): number {
    if (!item.required) return 100;
    return Math.min(100, Math.round((item.qualified / item.required) * 100));
  }

  quickActions(link: string) {
    return [
      { label: 'Share referral link', run: () => this.shareLink(link) },
      { label: 'Invite a patient', run: () => this.shareLink(link) },
      { label: 'Invite a clinic', run: () => this.shareLink(link) },
      { label: 'Invite a laboratory', run: () => this.shareLink(link) },
      { label: 'Invite a pharmacy', run: () => this.shareLink(link) },
      { label: 'View referrals', run: () => this.copyLink(link) },
    ];
  }

  async copyLink(link: string): Promise<void> {
    await navigator.clipboard?.writeText(link);
    this.copyStatus.set('Link copied');
  }

  async shareLink(link: string): Promise<void> {
    const share = navigator.share?.bind(navigator);
    if (share) {
      await share({ title: 'SmartClinic Network', text: 'Join SmartClinic Network through my referral link.', url: link });
      return;
    }
    await this.copyLink(link);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }
}
