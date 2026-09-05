import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { safeInternalReturnUrl } from '../../core/auth/safe-return-url';

@Component({
  selector: 'app-patient-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './patient-register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientRegisterPageComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly referralCode = this.route.snapshot.queryParamMap.get('ref')?.trim() || null;
  private readonly returnUrl = safeInternalReturnUrl(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );
  readonly loginQueryParams = this.returnUrl ? { returnUrl: this.returnUrl } : null;
  readonly pending = signal(false);
  readonly submitted = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    givenName: ['', [Validators.required, Validators.maxLength(80)]],
    familyName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.maxLength(30)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]],
  });

  readonly showPassword = signal(false);
 register(): void {
  this.submitted.set(true);
  this.error.set(null);

  if (this.form.invalid || this.pending()) {
    this.form.markAllAsTouched();
    return;
  }

  const value = this.form.getRawValue();

  this.pending.set(true);

  this.api
    .register({
      givenName: value.givenName.trim(),
      familyName: value.familyName.trim(),

      // Email is still required during registration
      email: value.email.trim().toLowerCase(),

      ...(value.phone.trim() && {
        phone: value.phone.trim(),
      }),

      password: value.password,

      ...(this.referralCode && {
        referralCode: this.referralCode,
      }),
    })
    .pipe(finalize(() => this.pending.set(false)))
    .subscribe({
      next: () => {
        this.form.reset();
        this.success.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          this.referralCode && error.status === 400
            ? 'This referral link is no longer valid. Ask the person who invited you for a new link.'
            : error.status === 409
              ? 'An account already exists with this email or phone number. Sign in instead.'
              : error.status === 0
                ? 'SmartClinic could not be reached. Check your connection and try again.'
                : 'We could not create your account. Check the form and try again.',
        );
      },
    });
}

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }
}
