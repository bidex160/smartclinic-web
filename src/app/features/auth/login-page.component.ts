import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { safeInternalReturnUrl } from '../../core/auth/safe-return-url';
import { AuthVisualPanelComponent } from '../../shared/components/auth-visual-panel.component';
import { requestedMarket, rwandaLocale } from '../../core/config/market-context';
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthVisualPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
   

    <main
  class="min-h-[calc(100vh-4rem)] bg-gradient-to-br
         from-sand-50 via-sand-50 to-brand-50/40 px-5 py-8
         sm:px-8 lg:py-10"
>
  <div
    class="mx-auto grid max-w-6xl items-stretch gap-8
           lg:grid-cols-[1.08fr_.92fr]"
  >
    <app-auth-visual-panel
      eyebrow="Your SmartClinic"
      title="Your health journey continues here."
      description="Sign in to manage Health Checks, care requests, providers, prescriptions and your SmartClinic health journey."
    />

    <section
      class="auth-form-enter flex items-center"
    >
      <div
        class="w-full rounded-[2rem] border border-ink/[0.07]
               bg-white p-6 shadow-card
               sm:p-9 lg:p-10"
      >
        <div>
          <div
            class="inline-flex items-center gap-2 rounded-full
                   bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700"
          >
            <span class="h-2 w-2 rounded-full bg-brand-500"></span>
            SmartClinic secure access
          </div>

          <h1 class="mt-5 font-display text-[2.1rem] font-semibold leading-tight text-ink">
            Welcome back
          </h1>

          <p class="mt-3 leading-7 text-ink-soft">
            Sign in with the email address or phone number linked
            to your SmartClinic account.
          </p>
        </div>

        @if (errorMessage) {
          <div
            role="alert"
            class="mt-6 rounded-xl border border-clay-100 bg-clay-50
                   p-4 text-clay-700"
          >
            {{ errorMessage }}
          </div>
        }

            <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 grid gap-5" novalidate>
              <p class="text-sm text-ink-soft">
                New to SmartClinic?
                <a
                  routerLink="/register"
                  [queryParams]="registrationQueryParams"
                  class="font-bold text-brand-700 underline"
                  >Create an account</a
                >
              </p>
              <div>
                <label for="identifier" class="font-bold"> Email or phone number </label>

          <input
            id="identifier"
            type="text"
            formControlName="identifier"
            autocomplete="username"
            [placeholder]="identifierPlaceholder"
            class="mt-2 min-h-12 w-full rounded-xl border border-ink/15 bg-white px-4 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />

          @if (form.controls.identifier.touched && form.controls.identifier.invalid) {
            <p class="mt-2 text-sm text-clay-700">Email or phone number is required.</p>
          }
          <p class="mt-2 text-sm text-ink-soft">
            Use the email address or phone number linked to your SmartClinic account.
          </p>
        </div>

        <div>
          <label for="password" class="font-bold"> Password </label>

          <div class="relative mt-2">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              class="min-h-12 w-full rounded-xl border border-ink/15 bg-white px-4 pr-12 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />

            <button
              type="button"
              (click)="showPassword.update((value) => !value)"
              class="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-muted transition hover:text-brand-700 focus:outline-none focus:text-brand-700"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              [attr.title]="showPassword() ? 'Hide password' : 'Show password'"
            >
              @if (showPassword()) {
                <!-- Eye slash -->
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m2 2 20 20" />
                  <path
                    d="M6.71 6.71C4.92 7.9 3.5 9.67 2.73 12c1.67 5 5 7.5 9.27 7.5 1.29 0 2.49-.23 3.57-.68"
                  />
                  <path
                    d="M10.73 5.08A9.8 9.8 0 0 1 12 5c4.27 0 7.6 2.5 9.27 7a11.1 11.1 0 0 1-2.1 3.6"
                  />
                  <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                </svg>
              } @else {
                <!-- Eye -->
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.73 12s3-7 9.27-7 9.27 7 9.27 7-3 7-9.27 7-9.27-7-9.27-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              }
            </button>
          </div>
          <a
            routerLink="/forgot-password"
            [queryParams]="registrationQueryParams"
            class="mt-2 inline-block text-sm font-bold text-brand-700 underline"
            >Forgot password?</a
          >

          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="mt-2 text-sm text-clay-700">Password is required.</p>
          }
        </div>

      <button
  type="submit"
  [disabled]="form.invalid || authState.loading()"
  class="group relative min-h-12 overflow-hidden rounded-full
         bg-ink px-5 py-3 font-semibold text-white
         shadow-lg shadow-ink/20
         transition duration-200
         hover:-translate-y-0.5 hover:bg-brand-900
         hover:shadow-xl hover:shadow-ink/20
         active:translate-y-0
         focus:outline-none focus:ring-4 focus:ring-brand-200
         disabled:cursor-not-allowed disabled:opacity-60
         disabled:hover:translate-y-0"
>
  <span class="relative z-10">
    {{ authState.loading() ? 'Signing in…' : 'Sign in' }}
  </span>

  <span
    class="absolute inset-y-0 -left-24 w-20 rotate-12
           bg-white/20 blur-xl transition-all duration-700
           group-hover:left-[120%]"
  ></span>
</button>
      </form>

      <section class="mt-7 rounded-2xl border border-brand-100 bg-brand-50/60 p-5" aria-labelledby="provider-access-heading">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Healthcare provider?</p>
        <h2 id="provider-access-heading" class="mt-2 font-display text-xl font-semibold text-ink">Join or access your provider workspace.</h2>
        <p class="mt-2 text-sm leading-6 text-ink-soft">For clinics, pharmacies, laboratories, hospitals and health professionals.</p>
        <a routerLink="/provider/register" [queryParams]="registrationQueryParams" class="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-brand-200 bg-white px-5 font-bold text-brand-700">Join SmartClinic as a provider →</a>
      </section>

      <section
        class="mt-7 rounded-2xl border border-brand-100 bg-gradient-to-br from-sand-50 via-white to-amber-50/50 p-5"
        aria-labelledby="create-account-heading"
      >
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">New to SmartClinic?</p>
        <h2 id="create-account-heading" class="mt-2 font-display text-xl font-semibold text-ink">
          Keep your healthcare together.
        </h2>
        <p class="mt-2 text-sm leading-6 text-ink-soft">
          Create your SmartClinic account for appointments, tests, prescriptions and hospital connections.
        </p>
        <a
          routerLink="/register"
          [queryParams]="registrationQueryParams"
          class="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-3 font-bold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-brand-100"
        >
          Create my SmartClinic account →
        </a>
        @if (hasReferral) {
          <div class="mt-4 flex items-start gap-3 rounded-xl bg-white/80 px-4 py-3 text-sm text-ink-soft">
            <span class="mt-0.5 text-amber-500" aria-hidden="true">✦</span>
            <p>
              <span class="font-bold text-ink">You were invited to SmartClinic.</span>
              Your invitation will be carried into account creation automatically.
            </p>
          </div>
        } @else {
          <p class="mt-4 text-center text-sm text-ink-muted">
            Have an invitation link? Open it first and SmartClinic will carry your referral automatically.
          </p>
        }
      </section>

      <div class="mt-6 text-center">
        <a [routerLink]="marketHomeRoute" class="text-sm font-bold text-brand-700 underline underline-offset-4">
          Back to SmartClinic
        </a>
      </div>

      </div>
    </section>
  </div>
</main>
  `,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);

  private readonly authApi = inject(AuthApiService);

  readonly authState = inject(AuthStateService);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  errorMessage: string | null = null;

  readonly showPassword = signal(false);
  readonly registrationQueryParams = this.authFlowQueryParams();
  readonly hasReferral = Boolean(this.route.snapshot.queryParamMap.get('ref')?.trim());
  readonly market = requestedMarket(this.route.snapshot.queryParamMap.get('market'));
  readonly identifierPlaceholder = this.market === 'RW'
    ? 'you@example.com or +250 7XX XXX XXX'
    : 'you@example.com or +234 801 234 5678';
  readonly marketLanguage = rwandaLocale(this.route.snapshot.queryParamMap.get('lang'));
  readonly marketHomeRoute = this.market === 'RW' ? '/rw' : '/';

  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],

    password: ['', Validators.required],
  });

  private authFlowQueryParams(): Record<string, string> | null {
    const returnUrl = safeInternalReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    const referralCode = this.route.snapshot.queryParamMap.get('ref')?.trim();
    const market = requestedMarket(this.route.snapshot.queryParamMap.get('market'));
    const language = rwandaLocale(this.route.snapshot.queryParamMap.get('lang'));
    return returnUrl || referralCode || market === 'RW'
      ? { ...(returnUrl && { returnUrl }), ...(referralCode && { ref: referralCode }), ...(market === 'RW' && { market, lang: language }) }
      : null;
  }

  submit(): void {
    if (this.form.invalid || this.authState.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.authState.loading.set(true);

    const value = this.form.getRawValue();
    this.authApi
      .login({ identifier: value.identifier.trim(), password: value.password })
      .pipe(finalize(() => this.authState.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.authState.setSession(response);

          const user = this.authState.currentUser();

          const roles = user?.roles ?? [];

          if (roles.includes('ADMIN') || roles.includes('OPERATIONS')) {
            void this.router.navigate(['/admin/dashboard']);

            return;
          }

          if (roles.includes('PROVIDER')) {
            void this.router.navigate(['/provider/dashboard']);

            return;
          }

          if (roles.includes('USER')) {
            const returnUrl = safeInternalReturnUrl(
              this.route.snapshot.queryParamMap.get('returnUrl'),
            );
            if (returnUrl) {
              void this.router.navigateByUrl(returnUrl);
              return;
            }
            if (user?.networkRole === 'BUILDER' || user?.networkRole === 'AMBASSADOR') {
              void this.router.navigate(['/builder/dashboard']);
              return;
            }
            if (this.market === 'RW') {
              void this.router.navigate(['/me/dashboard'], {
                queryParams: { market: 'RW', lang: this.marketLanguage },
              });
              return;
            }
            void this.router.navigate(['/me/dashboard']);

            return;
          }

          void this.router.navigate(['/']);
        },

        error: () => {
          this.errorMessage = 'We could not sign you in. Check your login details and try again.';
        },
      });
  }
}
