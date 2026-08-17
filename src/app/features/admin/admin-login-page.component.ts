import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  readonly authState = inject(AuthStateService);
  readonly accessDenied = signal(false);
  readonly submitted = signal(false);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(128)]],
  });

  login(): void {
    this.submitted.set(true);
    this.accessDenied.set(false);
    this.authState.setError('');
    if (this.form.invalid || this.authState.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.authState.loading.set(true);
    const value = this.form.getRawValue();
    this.authApi
      .login({ email: value.email.trim().toLowerCase(), password: value.password })
      .pipe(finalize(() => this.authState.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.authState.setSession(response);
          if (this.authState.canManagePricing()) {
            void this.router.navigate(['/admin/package-prices']);
            return;
          }
          if (this.authState.isProvider()) {
            void this.router.navigate(['/provider/offers']);
            return;
          }
          if (!this.authState.canManagePricing() && !this.authState.isProvider()) {
            this.accessDenied.set(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.authState.setError(
            error.status === 0
              ? 'SmartClinic could not be reached. Check your connection and try again.'
              : 'We could not sign you in with those details.',
          );
        },
      });
  }

  showError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }
}
