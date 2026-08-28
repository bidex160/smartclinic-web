import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-md px-5 py-12 sm:px-8">
      <div class="text-center">
        <p
          class="text-sm font-bold uppercase tracking-wider text-brand-600"
        >
          SmartClinic
        </p>

        <h1
          class="mt-2 text-3xl font-bold text-brand-900"
        >
          Sign in
        </h1>

        <p class="mt-3 text-slate-600">
          Access your SmartClinic account, Health Checks,
          provider workspace, or operations portal.
        </p>
      </div>

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
        novalidate
      >
        <div>
          <label
            for="email"
            class="font-bold"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="e.g. ada@example.com"
            class="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />

          @if (
            form.controls.email.touched &&
            form.controls.email.invalid
          ) {
            <p class="mt-2 text-sm text-red-700">
              Enter a valid email address.
            </p>
          }
        </div>

        <div>
          <label
            for="password"
            class="font-bold"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            placeholder="Enter your password"
            class="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />

          @if (
            form.controls.password.touched &&
            form.controls.password.invalid
          ) {
            <p class="mt-2 text-sm text-red-700">
              Password is required.
            </p>
          }
        </div>

        <button
          type="submit"
          [disabled]="
            form.invalid ||
            authState.loading()
          "
          class="min-h-12 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{
            authState.loading()
              ? 'Signing in…'
              : 'Sign in'
          }}
        </button>
      </form>

      <section
        class="mt-8 border-t border-slate-200 pt-6"
        aria-labelledby="create-account-heading"
      >
        <h2
          id="create-account-heading"
          class="text-center text-sm font-bold text-slate-800"
        >
          New to SmartClinic?
        </h2>

        <div class="mt-4 grid gap-3">
          <a
            routerLink="/register"
            class="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-600 px-4 py-3 text-center font-bold text-brand-700 transition hover:bg-brand-50 focus:outline-none focus:ring-4 focus:ring-brand-200"
          >
            Create a patient account
          </a>

          <a
            routerLink="/provider/register"
            class="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-center font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            Register as a healthcare provider
          </a>
        </div>

        <p class="mt-4 text-center text-sm text-slate-500">
          Clinic, laboratory and pharmacy registrations
          continue through the healthcare provider application.
        </p>
      </section>

      <div class="mt-8 text-center">
        <a
          routerLink="/"
          class="text-sm font-bold text-brand-700 underline underline-offset-4"
        >
          Back to SmartClinic
        </a>
      </div>
    </main>
  `,
})
export class LoginPageComponent {
  private readonly fb =
    inject(FormBuilder);

  private readonly authApi =
    inject(AuthApiService);

  readonly authState =
    inject(AuthStateService);

  private readonly router =
    inject(Router);
  private readonly route = inject(ActivatedRoute);

  errorMessage: string | null = null;

  readonly form =
    this.fb.nonNullable.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
        ],
      ],

      password: [
        '',
        Validators.required,
      ],
    });

  submit(): void {
    if (
      this.form.invalid ||
      this.authState.loading()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.authState.loading.set(true);

    this.authApi
      .login(
        this.form.getRawValue(),
      )
      .pipe(
        finalize(() =>
          this.authState.loading.set(false),
        ),
      )
      .subscribe({
        next: (response) => {
          this.authState.setSession(
            response,
          );

          const user =
            this.authState.currentUser();

          const roles =
            user?.roles ?? [];

          if (
            roles.includes('ADMIN') ||
            roles.includes('OPERATIONS')
          ) {
            void this.router.navigate([
              '/admin/dashboard',
            ]);

            return;
          }

          if (
            roles.includes('PROVIDER')
          ) {
            void this.router.navigate([
              '/provider/dashboard',
            ]);

            return;
          }

          if (
            roles.includes('USER')
          ) {
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
              void this.router.navigateByUrl(returnUrl);
              return;
            }
            void this.router.navigate([
              '/me/dashboard',
            ]);

            return;
          }

          void this.router.navigate([
            '/',
          ]);
        },

        error: () => {
          this.errorMessage =
            'We could not sign you in. Check your email and password and try again.';
        },
      });
  }
}
