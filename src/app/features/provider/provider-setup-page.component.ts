import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AcceptedProviderInvitation,
  PublicProviderInvitation,
} from '../../core/models/provider-invitation.model';
import { ProviderInvitationsApiService } from '../../core/services/provider-invitations-api.service';

function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  return control.get('password')?.value === control.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-provider-setup-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './provider-setup-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderSetupPageComponent {
  private readonly api = inject(ProviderInvitationsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  readonly invitation = signal<PublicProviderInvitation | null>(null);
  readonly accepted = signal<AcceptedProviderInvitation | null>(null);
  readonly inspecting = signal(true);
  readonly submitting = signal(false);
  readonly invalidInvitation = signal(false);
  readonly error = signal<string | null>(null);
  readonly setupForm = this.formBuilder.group(
    {
      displayName: ['', [Validators.required, Validators.maxLength(120)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchingPasswords },
  );

  constructor() {
    this.inspect();
  }

  acceptInvitation(): void {
    if (this.setupForm.invalid || this.submitting() || !this.invitation()) {
      this.setupForm.markAllAsTouched();
      return;
    }
    const value = this.setupForm.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .accept(this.token, { displayName: value.displayName.trim(), password: value.password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (accepted) => {
          this.accepted.set(accepted);
          this.invitation.set(null);
          this.setupForm.reset();
        },
        error: (error: HttpErrorResponse) => this.handleAcceptError(error),
      });
  }

  private inspect(): void {
    this.api
      .inspect(this.token)
      .pipe(finalize(() => this.inspecting.set(false)))
      .subscribe({
        next: (invitation) => this.invitation.set(invitation),
        error: () => {
          this.invalidInvitation.set(true);
          this.setError(
            'This invitation is invalid, expired, revoked, or has already been used. Please contact SmartClinic operations.',
          );
        },
      });
  }

  private handleAcceptError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.setError(
        'This email already belongs to an existing SmartClinic account. Please contact SmartClinic operations to link the existing account.',
      );
      return;
    }
    if ([400, 404, 410].includes(error.status)) {
      this.invitation.set(null);
      this.invalidInvitation.set(true);
      this.setError(
        'This invitation is no longer available. Please contact SmartClinic operations.',
      );
      return;
    }
    this.setError(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : 'The provider account could not be created. Please try again.',
    );
  }

  private setError(message: string): void {
    this.error.set(message);
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
