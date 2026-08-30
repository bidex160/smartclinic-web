import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ReferralImpact, ReferralTargetType } from '../../core/models/referral.model';
import { ReferralsApiService } from '../../core/services/referrals-api.service';

@Component({
  selector: 'app-my-impact-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
      <header>
        <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Patient Portal</p>
        <h1 class="mt-2 text-3xl font-bold text-brand-900">My Impact</h1>
        <p class="mt-2 max-w-3xl text-slate-600">Track the healthcare network you are helping build, your verified referral activity, and your progress through SmartClinic Builder levels.</p>
      </header>

      @if (loading()) {
        <div role="status" aria-label="Loading your impact" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">@for (item of [1,2,3,4]; track item) { <div class="h-32 animate-pulse rounded-2xl bg-slate-100"></div> }</div>
      } @else if (error()) {
        <section role="alert" class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><h2 class="font-bold">We couldn't load your impact right now.</h2><button type="button" (click)="load()" class="mt-4 min-h-11 rounded-lg border border-red-300 px-4 font-bold focus:ring-4 focus:ring-red-200">Try again</button></section>
      } @else if (impact(); as value) {
        <section class="mt-8" aria-labelledby="points-heading">
          <h2 id="points-heading" class="text-2xl font-bold text-brand-900">Points summary</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @for (metric of pointMetrics(value); track metric.label) { <article class="min-w-0 rounded-2xl border bg-white p-5"><p class="font-semibold text-slate-600">{{ metric.label }}</p><p class="mt-2 break-words text-3xl font-bold text-brand-900">{{ metric.value }}</p></article> }
          </div>
          <p class="mt-3 text-sm text-slate-600">Available points may be used for eligible rewards. Reserved points are held for pending reward operations.</p>
        </section>

        <section class="mt-8 rounded-2xl border bg-white p-6" aria-labelledby="earning-heading">
          <h2 id="earning-heading" class="text-2xl font-bold text-brand-900">How points are earned</h2>
          <p class="mt-2 text-slate-600">Current reward model</p>
          <div class="mt-5 grid gap-6 md:grid-cols-2">
            <article><h3 class="text-lg font-bold">Core Provider</h3><dl class="mt-3 divide-y rounded-xl border">@for (row of providerRewards; track row.label) { <div class="flex justify-between gap-4 p-3"><dt>{{ row.label }}</dt><dd class="font-bold">{{ row.points }}</dd></div> }</dl></article>
            <article><h3 class="text-lg font-bold">Patient</h3><dl class="mt-3 divide-y rounded-xl border">@for (row of patientRewards; track row.label) { <div class="flex justify-between gap-4 p-3"><dt>{{ row.label }}</dt><dd class="font-bold">{{ row.points }}</dd></div> }</dl></article>
          </div>
          <p class="mt-5 text-sm text-slate-600">Provider milestones are awarded only after backend-verified lifecycle events. Patient care points are awarded only after a first completed meaningful healthcare action.</p>
          <p class="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Older referrals may retain points awarded under a previous reward model. Historical points are preserved.</p>
        </section>

        <section class="mt-8 rounded-2xl border bg-white p-6" aria-labelledby="builder-heading">
          <h2 id="builder-heading" class="text-2xl font-bold text-brand-900">Builder Level Progress</h2>
          <p class="mt-2 font-semibold text-slate-700">Builder Levels are based on qualified referral mix, not your points balance.</p>
          @if (value.levelProgress.currentLevel; as current) { <p class="mt-4 text-xl font-bold">{{ current.name }} achieved</p> } @else { <p class="mt-4 text-xl font-bold">No level achieved yet</p> }
          @if (value.levelProgress.highestConfiguredLevelReached) {
            <p class="mt-4 rounded-xl bg-brand-50 p-4 font-semibold text-brand-900">Highest referral level achieved</p>
          } @else if (value.levelProgress.nextLevel; as next) {
            <h3 class="mt-5 text-lg font-bold">Next: {{ next.name }}</h3>
            <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">@for (requirement of value.levelProgress.requirements; track requirement.targetType) {
              <article class="rounded-xl bg-slate-50 p-4"><h4 class="font-bold">{{ targetLabel(requirement.targetType) }}</h4><p class="mt-2 text-xl font-bold">{{ requirement.qualified }} / {{ requirement.required }}</p><p class="mt-1 text-sm">{{ requirement.qualified }} qualified of {{ requirement.required }} required</p><p class="mt-2 font-semibold">{{ requirement.completed ? 'Completed' : requirement.remaining + ' remaining' }}</p><progress class="mt-3 h-2 w-full" [value]="requirement.qualified" [max]="requirement.required || 1">{{ requirement.qualified }} of {{ requirement.required }}</progress></article>
            }</div>
            @if (!value.levelProgress.currentLevel) { <p class="mt-4 text-slate-600">Complete these qualification requirements to reach {{ next.name }}.</p> }
          }
        </section>

        <div class="mt-8 grid gap-6 lg:grid-cols-3">
          <section class="rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold text-brand-900">Your referral code</h2><p class="mt-3 break-all font-mono text-2xl font-bold">{{ value.referralCode }}</p><button type="button" (click)="copyCode()" class="mt-4 min-h-11 rounded-lg bg-brand-700 px-4 font-bold text-white focus:ring-4 focus:ring-brand-200">Copy code</button><p aria-live="polite" class="mt-2 text-sm font-semibold text-brand-700">{{ copyFeedback() }}</p><p class="mt-3 text-sm text-slate-600">This code identifies your referrals. It is not an account password or access credential.</p></section>
          <section class="rounded-2xl border bg-white p-6 lg:col-span-2" aria-labelledby="pipeline-heading"><h2 id="pipeline-heading" class="text-xl font-bold text-brand-900">Referral pipeline</h2><div class="mt-4 grid gap-4 sm:grid-cols-3"><div><p class="text-sm text-slate-600">Registered referrals</p><p class="text-2xl font-bold">{{ value.summary.registeredReferrals }}</p></div><div><p class="text-sm text-slate-600">Qualified referrals</p><p class="text-2xl font-bold">{{ value.summary.qualifiedReferrals }}</p></div><div><p class="text-sm text-slate-600">Pending qualification</p><p class="text-2xl font-bold">{{ value.summary.pendingReferrals }}</p></div></div><p class="mt-4 text-sm text-slate-600">These counts come from referral lifecycle state and are not derived from points.</p></section>
        </div>

        <section class="mt-8" aria-labelledby="invite-heading"><h2 id="invite-heading" class="text-2xl font-bold text-brand-900">Invite someone</h2><div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">@for (target of inviteTargets(); track target) { <article class="rounded-2xl border bg-white p-5"><h3 class="font-bold">Invite a {{ inviteLabel(target) }}</h3><p class="mt-2 text-sm text-slate-600">{{ inviteHelp(target) }}</p><div class="mt-4 flex flex-wrap gap-2"><button type="button" (click)="copyInvite(target)" class="min-h-11 rounded-lg bg-brand-700 px-4 font-bold text-white focus:ring-4 focus:ring-brand-200">Copy invite link</button>@if (canShare) { <button type="button" (click)="shareInvite(target)" class="min-h-11 rounded-lg border border-brand-700 px-4 font-bold text-brand-700 focus:ring-4 focus:ring-brand-200">Share</button> }</div></article> }</div><p aria-live="polite" class="mt-3 font-semibold text-brand-700">{{ inviteFeedback() }}</p></section>

        <div class="mt-8 grid gap-6 lg:grid-cols-2"><section class="rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold text-brand-900">Qualified connections</h2><div class="mt-4 grid grid-cols-2 gap-4">@for (target of targets; track target) { <div><p class="text-sm text-slate-600">{{ targetLabel(target) }}</p><p class="text-2xl font-bold">{{ value.qualifiedCounts[target] }}</p></div> }</div></section>
          <section class="rounded-2xl border bg-white p-6" aria-labelledby="leaderboard-heading"><h2 id="leaderboard-heading" class="text-xl font-bold text-brand-900">Public leaderboard</h2><p class="mt-2 text-slate-600">Users appear publicly only when they choose to participate. Rankings are backend-authoritative.</p><p class="mt-4 font-semibold">Current state: {{ value.leaderboard.optedIn ? 'Participating' : 'Not participating' }}</p>@if (value.leaderboard.optedIn) { <p class="mt-1">{{ value.leaderboard.position ? 'Your current position: #' + value.leaderboard.position : "You're participating, but you're not ranked yet." }}</p> }<button type="button" (click)="updateLeaderboard(!value.leaderboard.optedIn)" [disabled]="preferenceUpdating()" class="mt-5 min-h-11 rounded-lg border border-brand-700 px-4 font-bold text-brand-700 focus:ring-4 focus:ring-brand-200 disabled:opacity-50">{{ preferenceUpdating() ? 'Updating preference…' : value.leaderboard.optedIn ? 'Leave public leaderboard' : 'Join public leaderboard' }}</button><p aria-live="polite" class="mt-3 text-sm font-semibold" [class.text-red-800]="preferenceError()">{{ preferenceFeedback() }}</p></section>
        </div>

        <section class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-900 p-6 text-white"><div><h2 class="text-xl font-bold">Referral activity</h2><p class="mt-1 text-brand-100">Review your direct referral history and reward operations.</p></div><a routerLink="/me/referrals" class="rounded-lg bg-white px-5 py-3 font-bold text-brand-900">View referral history</a></section>
      }
    </main>
  `,
})
export class MyImpactPageComponent {
  private readonly api = inject(ReferralsApiService);
  readonly impact = signal<ReferralImpact | null>(null); readonly loading = signal(false); readonly error = signal(false);
  readonly preferenceUpdating = signal(false); readonly preferenceError = signal(false); readonly preferenceFeedback = signal(''); readonly copyFeedback = signal(''); readonly inviteFeedback = signal('');
  readonly canShare = typeof navigator.share === 'function'; readonly targets: ReferralTargetType[] = ['PATIENT', 'CLINIC', 'LABORATORY', 'PHARMACY'];
  readonly providerRewards = [{ label: 'Registered', points: '+2' }, { label: 'Verified', points: '+4' }, { label: 'Activated', points: '+8' }, { label: 'Maximum', points: '14' }];
  readonly patientRewards = [{ label: 'Registered', points: '+1' }, { label: 'First completed care', points: '+1' }, { label: 'Maximum', points: '2' }];
  readonly inviteTargets = computed(() => { const links = this.impact()?.inviteLinks; return links ? this.targets.filter(target => Boolean(links[target])) : []; });
  constructor() { this.load(); }
  load(): void { if (this.loading()) return; this.loading.set(true); this.error.set(false); this.api.getMyImpact().pipe(finalize(() => this.loading.set(false))).subscribe({ next: value => this.impact.set(value), error: () => this.error.set(true) }); }
  pointMetrics(value: ReferralImpact) { return [{ label: 'Available points', value: value.balances.availablePoints }, { label: 'Lifetime earned points', value: value.balances.lifetimeEarnedPoints }, { label: 'Reserved points', value: value.balances.reservedPoints }, { label: 'Lifetime redeemed points', value: value.balances.lifetimeRedeemedPoints }]; }
  targetLabel(target: ReferralTargetType) { return ({ PATIENT: 'Patients', CLINIC: 'Clinics', LABORATORY: 'Laboratories', PHARMACY: 'Pharmacies' } as const)[target]; }
  inviteLabel(target: ReferralTargetType) { return ({ PATIENT: 'Patient', CLINIC: 'Clinic', LABORATORY: 'Laboratory', PHARMACY: 'Pharmacy' } as const)[target]; }
  inviteHelp(target: ReferralTargetType) { return target === 'PATIENT' ? 'Invite someone to create a SmartClinic patient account.' : `Invite a ${this.inviteLabel(target).toLowerCase()} to join SmartClinic.`; }
  async copyCode(): Promise<void> { const code = this.impact()?.referralCode; if (!code) return; try { await navigator.clipboard.writeText(code); this.copyFeedback.set('Referral code copied.'); } catch { this.copyFeedback.set('Copy was unavailable. Select the code and copy it manually.'); } }
  async copyInvite(target: ReferralTargetType): Promise<void> { const link = this.impact()?.inviteLinks[target]; if (!link) return; try { await navigator.clipboard.writeText(link); this.inviteFeedback.set(`${this.inviteLabel(target)} invite link copied.`); } catch { this.inviteFeedback.set('Copy was unavailable. Try again.'); } }
  async shareInvite(target: ReferralTargetType): Promise<void> { const link = this.impact()?.inviteLinks[target]; if (link && navigator.share) await navigator.share({ title: `SmartClinic ${this.inviteLabel(target)} invitation`, text: 'Join SmartClinic using my referral link.', url: link }).catch(() => undefined); }
  updateLeaderboard(publicLeaderboard: boolean): void { if (this.preferenceUpdating()) return; this.preferenceUpdating.set(true); this.preferenceError.set(false); this.preferenceFeedback.set(''); this.api.updateLeaderboardPreference(publicLeaderboard).subscribe({ next: () => { this.preferenceUpdating.set(false); this.preferenceFeedback.set(publicLeaderboard ? 'You are now participating in the public leaderboard.' : 'You have left the public leaderboard.'); this.reloadImpact(); }, error: () => { this.preferenceUpdating.set(false); this.preferenceError.set(true); this.preferenceFeedback.set('We could not update your leaderboard preference. Try again.'); } }); }
  private reloadImpact(): void { this.api.getMyImpact().subscribe({ next: value => this.impact.set(value), error: () => { this.preferenceError.set(true); this.preferenceFeedback.set('Preference saved, but we could not refresh your position yet.'); } }); }
}
