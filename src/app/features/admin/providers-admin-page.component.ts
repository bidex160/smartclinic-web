import { DatePipe, DOCUMENT } from '@angular/common';
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
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  AdminProviderFilters,
  AdminProviderListResponse,
  ProviderOnboardingStatus,
  ProviderStatus,
  ProviderType,
} from '../../core/models/admin-provider.model';
import { AdminProvidersApiService } from '../../core/services/admin-providers-api.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';

@Component({
  selector: 'app-providers-admin-page',
  imports: [AdminSessionHeaderComponent, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './providers-admin-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProvidersAdminPageComponent {
  private readonly api = inject(AdminProvidersApiService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  readonly response = signal<AdminProviderListResponse | null>(null);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly createdProviderId = signal<string | null>(null);
  readonly invitationDeliveryStatus = signal<'SENT' | 'MANUAL_REQUIRED' | 'FAILED' | null>(null);
  readonly oneTimeInvitationLink = signal<string | null>(null);

  readonly filterForm = this.formBuilder.group({
    search: ['', Validators.maxLength(200)],
    status: this.formBuilder.control<ProviderStatus | ''>(''),
    onboardingStatus: this.formBuilder.control<ProviderOnboardingStatus | ''>(''),
    limit: this.formBuilder.control<10 | 25 | 50>(25),
  });
  readonly createForm = this.formBuilder.group({
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.minLength(7), Validators.maxLength(32)]],
    professionalReference: ['', Validators.maxLength(200)],
    providerType: this.formBuilder.control<ProviderType>('INDIVIDUAL', Validators.required),
    countryCode: ['NG', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    stateOrRegion: ['', [Validators.required, Validators.maxLength(120)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
  });

  constructor() {
    this.load(1);
  }

  applyFilters(): void {
    if (this.filterForm.valid) this.load(1);
  }
  clearFilters(): void {
    this.filterForm.reset({ search: '', status: '', onboardingStatus: '', limit: 25 });
    this.load(1);
  }
  goToPage(page: number): void {
    const current = this.response();
    if (!this.loading() && page >= 1 && (!current || page <= current.totalPages)) this.load(page);
  }

  createProvider(): void {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }
    const value = this.createForm.getRawValue();
    this.creating.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
    this.createdProviderId.set(null);
    this.invitationDeliveryStatus.set(null);
    this.oneTimeInvitationLink.set(null);
    this.api
      .create({
        displayName: value.displayName.trim(),
        email: value.email.trim().toLowerCase(),
        ...(value.phone.trim() && { phone: value.phone.trim() }),
        ...(value.professionalReference.trim() && {
          professionalReference: value.professionalReference.trim(),
        }),
        providerType: value.providerType,
        countryCode: value.countryCode.trim().toUpperCase(),
        stateOrRegion: value.stateOrRegion.trim(),
        city: value.city.trim(),
      })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: ({ provider, invitation }) => {
          this.createdProviderId.set(provider.id);
          this.invitationDeliveryStatus.set(invitation.deliveryStatus);
          this.oneTimeInvitationLink.set(invitation.manualInvitationLink ?? null);
          const delivery = {
            SENT: 'Invitation email sent successfully.',
            MANUAL_REQUIRED:
              'Automatic email delivery is unavailable. Share the one-time link manually.',
            FAILED:
              'The provider and invitation were created, but email delivery failed. Share the one-time link manually.',
          } as const;
          this.statusMessage.set(
            `${provider.displayName} was created. ${delivery[invitation.deliveryStatus]}`,
          );
          this.createForm.reset({ providerType: 'INDIVIDUAL', countryCode: 'NG' });
          this.load(1);
        },
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'Provider could not be created.'),
      });
  }

  async copyInvitationLink(): Promise<void> {
    const link = this.oneTimeInvitationLink();
    if (!link) return;
    try {
      await this.document.defaultView?.navigator.clipboard.writeText(link);
      this.statusMessage.set('Invitation link copied.');
    } catch {
      this.error.set('The invitation link could not be copied. Select and copy it manually.');
    }
  }

  private load(page: number): void {
    if (this.loading()) return;
    const value = this.filterForm.getRawValue();
    const filters: AdminProviderFilters = {
      page,
      limit: value.limit,
      ...(value.search.trim() && { search: value.search.trim() }),
      ...(value.status && { status: value.status }),
      ...(value.onboardingStatus && { onboardingStatus: value.onboardingStatus }),
    };
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(filters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'Providers could not be loaded.'),
      });
  }

  private handleError(error: HttpErrorResponse, fallback: string): void {
    if (error.status === 403) {
      void this.router.navigate(['/admin/access-denied']);
      return;
    }
    const messages: Record<number, string> = {
      400: 'Review the provider information and try again.',
      409: 'This provider conflicts with an existing record or workflow.',
    };
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? fallback),
    );
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
