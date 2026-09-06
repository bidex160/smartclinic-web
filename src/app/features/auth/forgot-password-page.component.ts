import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { safeInternalReturnUrl } from '../../core/auth/safe-return-url';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="mx-auto max-w-md px-5 py-12 sm:px-8">
    <a
      routerLink="/login"
      [queryParams]="loginQueryParams"
      class="font-bold text-brand-700 underline"
      >← Back to sign in</a
    >
    <h1 class="mt-8 text-3xl font-bold">Forgot your password?</h1>
    <p class="mt-3 text-slate-600">
      Enter the email address associated with your SmartClinic account and we'll send you a link to
      reset your password.
    </p>
    @if (success()) {
      <section class="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5" role="status">
        <h2 class="text-xl font-bold">Check your email</h2>
        <p class="mt-2">{{ message() }}</p>
        <button type="button" (click)="success.set(false)" class="mt-4 font-bold underline">
          Send again
        </button>
      </section>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 grid gap-5" novalidate>
        <label class="font-bold" for="email"
          >Email address<input
            id="email"
            type="email"
            autocomplete="email"
            formControlName="email"
            placeholder="you@example.com"
            class="mt-2 min-h-12 w-full rounded-xl border px-4"
          />
        </label>
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <p class="text-sm text-red-700" role="alert">Enter a valid email address.</p>
        }
        @if (error()) {
          <p role="alert" class="rounded-xl bg-red-50 p-4 text-red-800">{{ error() }}</p>
        }
        <button
          type="submit"
          [disabled]="pending()"
          class="min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60"
        >
          {{ pending() ? 'Sending…' : 'Send reset link' }}
        </button>
      </form>
    }
  </main>`,
})
export class ForgotPasswordPageComponent {
  private readonly api = inject(AuthApiService);
  private readonly fb = inject(FormBuilder);
  readonly route = inject(ActivatedRoute);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
  });
  readonly pending = signal(false);
  readonly success = signal(false);
  readonly message = signal(
    'If an account exists for that email, password reset instructions have been sent.',
  );
  readonly error = signal<string | null>(null);
  readonly loginQueryParams = (() => {
    const value = safeInternalReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    return value ? { returnUrl: value } : null;
  })();
  submit() {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }
    this.pending.set(true);
    this.error.set(null);
    this.api
      .forgotPassword({ email: this.form.controls.email.value.trim().toLowerCase() })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (r) => {
          this.message.set(r.message);
          this.success.set(true);
        },
        error: () =>
          this.error.set('We could not process that request right now. Please try again.'),
      });
  }
}
