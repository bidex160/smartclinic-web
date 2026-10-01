import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PROVIDER_MEMBER_ROLES, ProviderMemberRole, ProviderTeamMember, TeamInviteResult } from '../../../core/models/provider-team.model';
import { ProviderMembershipService } from '../../../core/services/provider-membership.service';
import { ProviderTeamApiService } from '../../../core/services/provider-team-api.service';

/** The facility's staff: invite by email, set each person's role, remove access. */
@Component({
  selector: 'app-provider-team-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <a routerLink="/provider/dashboard" class="text-sm font-semibold text-brand-700">← Dashboard</a>
      <header class="mt-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{{ membership.membership()?.provider?.displayName ?? 'Your facility' }}</p>
        <h1 class="font-display mt-1 text-3xl font-semibold text-ink sm:text-4xl">Team</h1>
        <p class="mt-2 text-ink-soft">Give each person their own login. Their role decides what they see first — a lab scientist sees test requests, a pharmacist sees prescriptions.</p>
      </header>

      @if (!membership.canManageTeam()) {
        <p role="alert" class="mt-6 rounded-2xl bg-sand-100 p-5 text-ink-soft">Only the facility owner or a team admin can manage the team.</p>
      } @else {
        <section class="sc-card mt-6 p-5 sm:p-6" aria-labelledby="invite-heading">
          <h2 id="invite-heading" class="font-display text-xl font-semibold text-ink">Invite someone</h2>
          <form [formGroup]="form" (ngSubmit)="invite()" class="mt-4 grid gap-3 sm:grid-cols-2" novalidate>
            <label class="text-sm font-medium text-ink-soft">Email
              <input formControlName="email" type="email" autocomplete="off" placeholder="name@yourclinic.ng" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
              @if (form.controls.email.invalid && form.controls.email.touched) { <span class="mt-1 block text-xs font-semibold text-clay-700">Enter a valid email address.</span> }
            </label>
            <label class="text-sm font-medium text-ink-soft">Name <span class="font-normal text-ink-muted">(optional)</span>
              <input formControlName="displayName" maxlength="120" placeholder="e.g. Ngozi Eze" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
            </label>
            <fieldset class="sm:col-span-2">
              <legend class="text-sm font-medium text-ink-soft">Role</legend>
              <div class="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup">
                @for (option of roles; track option.role) {
                  <button type="button" role="radio" [attr.aria-checked]="form.controls.role.value === option.role" (click)="form.controls.role.setValue(option.role)"
                    class="rounded-2xl p-3 text-left ring-1 transition {{ form.controls.role.value === option.role ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-ink ring-ink/10 hover:ring-brand-300' }}">
                    <span class="block text-sm font-semibold">{{ option.label }}</span>
                    <span class="mt-0.5 block text-xs {{ form.controls.role.value === option.role ? 'text-white/80' : 'text-ink-muted' }}">{{ option.hint }}</span>
                  </button>
                }
              </div>
            </fieldset>
            @if (inviteError()) { <p role="alert" class="text-sm font-semibold text-clay-700 sm:col-span-2">{{ inviteError() }}</p> }
            <button type="submit" [disabled]="form.invalid || inviting()" class="min-h-12 rounded-full bg-ink px-6 font-semibold text-white hover:bg-brand-900 disabled:opacity-50 sm:col-span-2 sm:justify-self-start">{{ inviting() ? 'Sending…' : 'Send invitation' }}</button>
          </form>

          @if (lastInvite(); as sent) {
            <div class="mt-5 rounded-2xl bg-leaf-50 p-4 ring-1 ring-leaf-100" role="status" data-invite-sent>
              <p class="font-semibold text-ink">
                @if (sent.deliveryStatus === 'SENT') { Invitation emailed to {{ sent.member.email }}. } @else { We couldn’t email {{ sent.member.email }} — share the link below instead. }
              </p>
              <p class="mt-1 text-sm text-ink-soft">You can also send the link yourself. It works once and expires in 7 days.</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" (click)="copy(sent.inviteUrl)" class="min-h-10 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:bg-sand-50">Copy link</button>
                <a [href]="whatsApp(sent)" target="_blank" rel="noopener" class="inline-flex min-h-10 items-center rounded-full bg-leaf-700 px-4 text-sm font-semibold text-white hover:bg-ink">Send on WhatsApp</a>
              </div>
              <p aria-live="polite" class="mt-2 text-sm text-leaf-700">{{ copied() }}</p>
            </div>
          }
        </section>

        <section class="mt-6" aria-labelledby="members-heading">
          <h2 id="members-heading" class="font-display text-xl font-semibold text-ink">People</h2>
          @if (loading()) {
            <div role="status" class="mt-3 h-24 animate-pulse rounded-2xl bg-sand-200"><span class="sr-only">Loading your team…</span></div>
          } @else if (loadError()) {
            <p role="alert" class="mt-3 rounded-2xl bg-clay-50 p-4 text-clay-700">Your team couldn’t be loaded. <button type="button" (click)="load()" class="font-semibold underline">Try again</button></p>
          } @else if (!members().length) {
            <p class="mt-3 rounded-2xl bg-sand-100 p-5 text-ink-soft">No one yet. Invite your doctors, lab scientists, pharmacists and front desk so each has their own login.</p>
          } @else {
            <ul class="sc-card mt-3 divide-y divide-ink/[0.06] overflow-hidden">
              @for (person of members(); track person.id) {
                <li class="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center" data-member>
                  <div class="min-w-0">
                    <p class="font-semibold text-ink">{{ person.displayName || person.email }}
                      @if (person.status === 'INVITED') { <span class="ml-1 rounded-full bg-ochre-50 px-2 py-0.5 text-xs font-semibold text-ochre-700 ring-1 ring-ochre-100">Invited</span> }
                    </p>
                    <p class="truncate text-sm text-ink-muted">{{ person.email }}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <label><span class="sr-only">Role for {{ person.displayName || person.email }}</span>
                      <select (change)="changeRole(person, $any($event.target).value)" class="min-h-10 rounded-full border border-ink/15 bg-white px-3 text-sm font-semibold text-ink" data-role-select>
                        @for (option of roles; track option.role) { <option [value]="option.role" [selected]="option.role === person.role">{{ option.label }}</option> }
                      </select>
                    </label>
                    @if (person.status === 'INVITED') {
                      <button type="button" (click)="resend(person)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Resend</button>
                    }
                    @if (confirmingRemove() === person.id) {
                      <button type="button" (click)="remove(person)" class="min-h-10 rounded-full bg-clay-700 px-3 text-sm font-semibold text-white">Remove access</button>
                      <button type="button" (click)="confirmingRemove.set(null)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sand-50">Keep</button>
                    } @else {
                      <button type="button" (click)="confirmingRemove.set(person.id)" class="min-h-10 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sand-50">Remove</button>
                    }
                  </div>
                </li>
              }
            </ul>
          }
          @if (actionError()) { <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ actionError() }}</p> }
        </section>
      }
    </main>
  `,
})
export class ProviderTeamPageComponent {
  private readonly api = inject(ProviderTeamApiService);
  private readonly fb = inject(FormBuilder);
  readonly membership = inject(ProviderMembershipService);

  readonly roles = PROVIDER_MEMBER_ROLES;
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    displayName: ['', Validators.maxLength(120)],
    role: this.fb.nonNullable.control<ProviderMemberRole>('DOCTOR', Validators.required),
  });

  readonly members = signal<readonly ProviderTeamMember[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly inviting = signal(false);
  readonly inviteError = signal('');
  readonly lastInvite = signal<TeamInviteResult | null>(null);
  readonly copied = signal('');
  readonly confirmingRemove = signal<string | null>(null);
  readonly actionError = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (page) => this.members.set(page.items), error: () => this.loadError.set(true) });
  }

  invite(): void {
    if (this.form.invalid || this.inviting()) return;
    const value = this.form.getRawValue();
    this.inviting.set(true);
    this.inviteError.set('');
    this.api
      .invite({ email: value.email.trim(), displayName: value.displayName.trim() || null, role: value.role })
      .pipe(finalize(() => this.inviting.set(false)))
      .subscribe({
        next: (result) => {
          this.lastInvite.set(result);
          this.members.update((members) => [...members, result.member]);
          this.form.reset({ email: '', displayName: '', role: value.role });
        },
        error: (error) => this.inviteError.set(typeof error?.error?.message === 'string' ? error.error.message : 'The invitation couldn’t be sent. Try again.'),
      });
  }

  resend(person: ProviderTeamMember): void {
    this.actionError.set('');
    this.api.resend(person.id).subscribe({
      next: (result) => this.lastInvite.set(result),
      error: () => this.actionError.set('The invitation couldn’t be resent. Try again.'),
    });
  }

  changeRole(person: ProviderTeamMember, role: ProviderMemberRole): void {
    if (role === person.role) return;
    this.actionError.set('');
    this.api.updateRole(person.id, role).subscribe({
      next: (updated) => this.members.update((members) => members.map((m) => (m.id === person.id ? updated : m))),
      error: (error) => {
        this.actionError.set(typeof error?.error?.message === 'string' ? error.error.message : 'The role couldn’t be changed.');
        this.members.update((members) => [...members]);
      },
    });
  }

  remove(person: ProviderTeamMember): void {
    this.actionError.set('');
    this.api.remove(person.id).subscribe({
      next: () => {
        this.confirmingRemove.set(null);
        this.members.update((members) => members.filter((m) => m.id !== person.id));
      },
      error: (error) => this.actionError.set(typeof error?.error?.message === 'string' ? error.error.message : 'Access couldn’t be removed. Try again.'),
    });
  }

  async copy(link: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(link);
      this.copied.set('Link copied.');
    } catch {
      this.copied.set('Copy was unavailable. Use WhatsApp instead.');
    }
  }

  whatsApp(sent: TeamInviteResult): string {
    const facility = this.membership.membership()?.provider.displayName ?? 'our facility';
    return `https://wa.me/?text=${encodeURIComponent(`You're invited to join ${facility} on SmartClinic as ${sent.member.roleLabel.toLowerCase()}. Sign in with ${sent.member.email} and accept here: ${sent.inviteUrl}`)}`;
  }
}
