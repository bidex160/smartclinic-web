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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminProviderDetail } from '../../core/models/admin-provider.model';
import { AdminProvidersApiService } from '../../core/services/admin-providers-api.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';

type Confirmation = 'activate' | 'suspend' | 'unlink' | null;

@Component({
  selector: 'app-provider-admin-detail-page',
  imports: [AdminSessionHeaderComponent, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './provider-admin-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderAdminDetailPageComponent {
  private readonly api = inject(AdminProvidersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  readonly provider = signal<AdminProviderDetail | null>(null);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly confirmation = signal<Confirmation>(null);
  readonly profileForm = this.formBuilder.group({
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    professionalReference: ['', Validators.maxLength(200)],
  });

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.id || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.api
      .get(this.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (provider) => {
          this.provider.set(provider);
          this.profileForm.setValue({
            displayName: provider.displayName,
            professionalReference: provider.professionalReference ?? '',
          });
        },
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'Provider details could not be loaded.'),
      });
  }

  updateProfile(): void {
    if (this.profileForm.invalid || this.mutating()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.getRawValue();
    this.run(
      this.api.update(this.id, {
        displayName: value.displayName.trim(),
        professionalReference: value.professionalReference.trim(),
      }),
      'Provider profile updated.',
    );
  }

  requestConfirmation(action: Exclude<Confirmation, null>): void {
    if (!this.mutating()) this.confirmation.set(action);
  }
  cancelConfirmation(): void {
    this.confirmation.set(null);
  }
  confirmAction(): void {
    const action = this.confirmation();
    if (!action || this.mutating()) return;
    const operation =
      action === 'activate'
        ? this.api.activate(this.id)
        : action === 'suspend'
          ? this.api.suspend(this.id)
          : this.api.unlinkUser(this.id);
    const message =
      action === 'activate'
        ? 'Provider activated.'
        : action === 'suspend'
          ? 'Provider suspended.'
          : 'Provider account unlinked safely.';
    this.run(operation, message);
  }

  private run(operation: ReturnType<AdminProvidersApiService['update']>, message: string): void {
    this.mutating.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
    operation.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: (provider) => {
        this.provider.set(provider);
        this.confirmation.set(null);
        this.statusMessage.set(message);
        this.profileForm.setValue({
          displayName: provider.displayName,
          professionalReference: provider.professionalReference ?? '',
        });
      },
      error: (error: HttpErrorResponse) =>
        this.handleError(error, 'Provider operation could not be completed.'),
    });
  }

  private handleError(error: HttpErrorResponse, fallback: string): void {
    if (error.status === 403) {
      void this.router.navigate(['/admin/access-denied']);
      return;
    }
    if (error.status === 404) {
      this.notFound.set(true);
      this.provider.set(null);
    }
    const messages: Record<number, string> = {
      400: 'Review the provider information and try again.',
      404: 'This provider or linked user is unavailable.',
      409: 'This operation conflicts with the provider’s current status, linked account, or active work.',
    };
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? fallback),
    );
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
