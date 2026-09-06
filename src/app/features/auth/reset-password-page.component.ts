import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-md px-5 py-12 sm:px-8">
      <a routerLink="/login" class="font-bold text-brand-700 underline">
        ← Back to sign in
      </a>

      @if (!token) {
        <section class="mt-8 rounded-2xl border bg-white p-6">
          <h1 class="text-3xl font-bold">
            This password reset link is invalid or has expired.
          </h1>

          <a
            routerLink="/forgot-password"
            class="mt-5 inline-block font-bold text-brand-700 underline"
          >
            Request a new reset link
          </a>
        </section>
      } @else if (success()) {
        <section
          class="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6"
        >
          <h1 class="text-2xl font-bold">Password reset successfully</h1>

          <p class="mt-2">
            Your password has been updated. You can now sign in with your new
            password.
          </p>

          <a
            routerLink="/login"
            class="mt-5 inline-block rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
          >
            Sign in
          </a>
        </section>
      } @else {
        <h1 class="mt-8 text-3xl font-bold">Create a new password</h1>

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="mt-8 grid gap-5"
          novalidate
        >
          <!-- New password -->
          <div>
            <label class="font-bold" for="new-password">
              New password
            </label>

            <div class="relative mt-2">
              <input
                id="new-password"
                [type]="showPassword() ? 'text' : 'password'"
                autocomplete="new-password"
                formControlName="password"
                placeholder="Enter your new password"
                class="min-h-12 w-full rounded-xl border px-4 pr-20"
              />

              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-semibold text-brand-700"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                [attr.aria-pressed]="showPassword()"
              >
                {{ showPassword() ? 'Hide' : 'Show' }}
              </button>
            </div>

            @if (
              form.controls.password.touched &&
              form.controls.password.invalid
            ) {
              <p class="mt-1 text-sm text-red-700" role="alert">
                Password must be 6–128 characters.
              </p>
            }
          </div>

          <!-- Confirm password -->
          <div>
            <label class="font-bold" for="confirm-password">
              Confirm new password
            </label>

            <div class="relative mt-2">
              <input
                id="confirm-password"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                autocomplete="new-password"
                formControlName="confirmPassword"
                placeholder="Re-enter your new password"
                class="min-h-12 w-full rounded-xl border px-4 pr-20"
              />

              <button
                type="button"
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                class="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-semibold text-brand-700"
                [attr.aria-label]="
                  showConfirmPassword()
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                "
                [attr.aria-pressed]="showConfirmPassword()"
              >
                {{ showConfirmPassword() ? 'Hide' : 'Show' }}
              </button>
            </div>

            @if (
              form.controls.confirmPassword.touched &&
              form.controls.confirmPassword.value !==
                form.controls.password.value
            ) {
              <p class="mt-1 text-sm text-red-700" role="alert">
                Passwords do not match.
              </p>
            }
          </div>

          @if (error()) {
            <p
              role="alert"
              class="rounded-xl bg-red-50 p-4 text-red-800"
            >
              {{ error() }}
            </p>
          }

          <button
            type="submit"
            [disabled]="pending()"
            class="min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {{ pending() ? 'Updating…' : 'Reset password' }}
          </button>
        </form>
      }
    </main>
  `,
})
export class ResetPasswordPageComponent {
  private readonly api = inject(AuthApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly token =
    this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

  readonly pending = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  // Password visibility
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(128),
      ],
    ],
    confirmPassword: ['', Validators.required],
  });

  submit() {
    if (
      this.form.invalid ||
      this.form.controls.password.value !==
        this.form.controls.confirmPassword.value ||
      this.pending()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set(null);

    this.api
      .resetPassword({
        token: this.token,
        password: this.form.controls.password.value,
      })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.success.set(true),

        error: (e) => {
          const message = e?.error?.message;

          this.error.set(
            message ===
              'This password reset link is invalid or has expired.'
              ? message
              : e?.status === 400
                ? 'Please choose a password that meets the requirements.'
                : 'We could not reset your password right now. Please try again.',
          );
        },
      });
  }
}