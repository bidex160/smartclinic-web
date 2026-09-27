import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { PartnerApiService } from '../../core/services/partner-api.service';

interface PublicPartnerInvitation {
  token: string;
  status: string;
  partner: { id?: string; name?: string; type?: string };
  programId: string | null;
  campaignId: string | null;
}

@Component({
  selector: 'app-healthy-family-join',
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-2xl px-5 py-12">
      <p class="text-sm font-bold uppercase tracking-widest text-brand-700">Healthy Families · SmartClinic</p>
      <h1 class="mt-3 text-4xl font-black text-slate-950">Connect your family to continuous care</h1>
      @if (loading()) {
        <p role="status" class="mt-8 rounded-2xl bg-slate-50 p-5">Checking your invitation…</p>
      } @else if (loadError()) {
        <p role="alert" class="mt-8 rounded-2xl bg-red-50 p-5 text-red-900">{{ loadError() }}</p>
      } @else if (invitation(); as invite) {
        <p class="mt-4 text-lg text-slate-600">{{ invite.partner.name || 'Your school' }} invited your family to SmartClinic. This adds a programme relationship to your normal SmartClinic identity; it does not create a separate school account.</p>
        <p class="mt-3 text-slate-600">Your school can see privacy-safe programme participation, but not diagnoses, consultations, tests, prescriptions or medical records.</p>
        @if (!auth.authenticated()) {
          <section class="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
            <h2 class="text-xl font-black">Continue with your SmartClinic identity</h2>
            <p class="mt-2 text-slate-600">Sign in if you already use SmartClinic, or create the same normal SmartClinic patient account used for all care.</p>
            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <a routerLink="/login" [queryParams]="authQueryParams" class="rounded-xl bg-brand-700 px-5 py-3 text-center font-bold text-white">Sign in</a>
              <a routerLink="/register" [queryParams]="authQueryParams" class="rounded-xl border border-brand-700 px-5 py-3 text-center font-bold text-brand-800">Create SmartClinic account</a>
            </div>
          </section>
        } @else if (!auth.isPatient()) {
          <p role="alert" class="mt-8 rounded-2xl bg-amber-50 p-5 text-amber-950">Use a SmartClinic patient account to activate this family invitation.</p>
        } @else {
          <section class="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
            <h2 class="text-xl font-black">Before you join</h2>
            <ul class="mt-4 space-y-3 text-slate-700">
              <li>✓ Your family's clinical records remain protected by SmartClinic access controls.</li>
              <li>✓ You choose and manage authorised family/dependant relationships.</li>
              <li>✓ Wellness reminders guide engagement; they do not force unnecessary tests.</li>
              <li>✓ Programme benefits and wellness credits are for eligible healthcare use under programme rules.</li>
            </ul>
            <label class="mt-6 flex gap-3 rounded-2xl bg-slate-50 p-4"><input type="checkbox" [checked]="consented()" (change)="setConsent($event)"><span>I understand what SmartClinic processes and that my school receives only privacy-safe programme information unless I separately authorise more.</span></label>
            <button type="button" [disabled]="!consented() || saving()" (click)="activate()" class="mt-5 w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-40">{{ saving() ? 'Activating…' : 'Join Healthy Families' }}</button>
            @if (message()) { <p role="status" class="mt-4 font-semibold">{{ message() }}</p> }
          </section>
        }
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthyFamilyJoinPageComponent {
  private readonly api = inject(PartnerApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthStateService);
  private readonly token = this.route.snapshot.paramMap.get('token') || '';
  private readonly returnUrl = `/healthy-families/join/${encodeURIComponent(this.token)}`;
  readonly authQueryParams = { returnUrl: this.returnUrl };
  readonly invitation = signal<PublicPartnerInvitation | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly consented = signal(false);
  readonly message = signal('');

  constructor() {
    this.api.invitation(this.token).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (value) => this.invitation.set(value),
      error: () => this.loadError.set('This invitation is invalid or no longer available. Ask the school for a fresh invitation.'),
    });
  }

  setConsent(event: Event): void {
    this.consented.set((event.target as HTMLInputElement).checked);
  }

  activate(): void {
    if (!this.auth.isPatient() || !this.consented() || this.saving()) return;
    this.saving.set(true);
    this.api.activate(this.token, 'healthy-families-v1').pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.message.set('Your family is connected. Opening My Family…');
        void this.router.navigateByUrl('/me/family');
      },
      error: () => this.message.set('We could not activate this invitation. Confirm that it was addressed to this SmartClinic account or ask the school for a fresh invitation.'),
    });
  }
}
