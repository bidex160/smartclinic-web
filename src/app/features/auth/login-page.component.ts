import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-md px-5 py-12 sm:px-8">
      <p class="text-sm font-bold uppercase tracking-wider text-brand-600">
        My SmartClinic
      </p>

      <h1 class="mt-2 text-3xl font-bold text-brand-900">
        Sign in
      </h1>

      <p class="mt-3 text-slate-600">
        Access your Health Checks, appointments and results.
      </p>

      @if (errorMessage) {
        <div
          role="alert"
          class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
        >
          {{ errorMessage }}
        </div>
      }

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="mt-8 grid gap-5"
      >
        <div>
          <label for="email" class="font-bold">
            Email
          </label>

          <input
            id="email"
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="e.g. ada@example.com"
            class="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        <div>
          <label for="password" class="font-bold">
            Password
          </label>

          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            placeholder="Enter your password"
            class="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4"
          />
        </div>

        <button
          type="submit"
          [disabled]="form.invalid || authState.loading()"
          class="min-h-12 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ authState.loading() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-6 text-sm text-slate-600">
        New to SmartClinic?
        <a
          routerLink="/register"
          class="font-bold text-brand-700 underline underline-offset-4"
        >
          Create an account
        </a>
      </p>
    </main>
  `,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);

  errorMessage: string | null = null;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.authState.loading()) {
      return;
    }

    this.errorMessage = null;
    this.authState.loading.set(true);

    this.authApi
      .login(this.form.getRawValue())
      .pipe(
        finalize(() => this.authState.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
           this.authState.setSession(response);
          const user = this.authState.currentUser();

          if (user?.roles?.includes('ADMIN') || user?.roles?.includes('OPERATIONS')) {
            void this.router.navigate(['/admin/dashboard']);
            return;
          }

          if (user?.roles?.includes('PROVIDER')) {
            void this.router.navigate(['/provider/dashboard']);
            return;
          }

          void this.router.navigate(['/me/dashboard']);
        },
        error: () => {
          this.errorMessage =
            'We could not sign you in. Check your email and password and try again.';
        },
      });
  }
}