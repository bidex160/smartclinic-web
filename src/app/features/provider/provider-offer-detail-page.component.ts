import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ProviderOffer, ProviderOfferStatus } from '../../core/models/provider-offer.model';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderSessionHeaderComponent } from './provider-session-header.component';
import { UtilsService } from '../../core/services/utils.service';

@Component({
  selector: 'app-provider-offer-detail-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ProviderSessionHeaderComponent],
  templateUrl: './provider-offer-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderOfferDetailPageComponent {
  utilsService = inject(UtilsService);

  private readonly api = inject(ProviderOffersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly assignmentId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly offer = signal<ProviderOffer | null>(null);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly declineOpen = signal(false);
  readonly acceptConfirmationOpen = signal(false);
  readonly conflictLocked = signal(false);
  readonly canRespond = computed(
    () => this.offer()?.status === 'OFFERED' && !this.conflictLocked(),
  );
  readonly declineForm = this.formBuilder.group({
    reason: ['', Validators.maxLength(500)],
  });

  constructor() {
    this.loadOffer();
  }

  loadOffer(preserveMessage = false): void {
    if (this.loading() || !this.assignmentId) return;
    this.loading.set(true);
    this.notFound.set(false);
    if (!preserveMessage) {
      this.error.set(null);
      this.conflictLocked.set(false);
    }
    this.api
      .getOffer(this.assignmentId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (offer) => this.offer.set(offer),
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  requestAcceptance(): void {
    if (this.canRespond()) this.acceptConfirmationOpen.set(true);
  }

  cancelAcceptance(): void {
    if (!this.mutating()) this.acceptConfirmationOpen.set(false);
  }

  accept(): void {
    if (this.mutating() || !this.canRespond()) return;
    this.beginMutation();
    this.api
      .acceptOffer(this.assignmentId)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (offer) => {
          this.offer.set(offer);
          this.acceptConfirmationOpen.set(false);
          this.statusMessage.set(
            'Appointment accepted and scheduled. It is now available under Appointments / Health Checks.',
          );
        },
        error: (error: HttpErrorResponse) => this.handleMutationError(error),
      });
  }

  showDecline(): void {
    if (this.canRespond()) this.declineOpen.set(true);
  }

  cancelDecline(): void {
    this.declineOpen.set(false);
    this.declineForm.reset({ reason: '' });
  }

  decline(): void {
    if (this.mutating() || !this.canRespond()) return;
    if (this.declineForm.invalid) {
      this.declineForm.markAllAsTouched();
      return;
    }
    this.beginMutation();
    const reason = this.declineForm.controls.reason.value.trim();
    this.api
      .declineOffer(this.assignmentId, reason ? { reason } : {})
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (offer) => {
          this.offer.set(offer);
          this.declineOpen.set(false);
          this.statusMessage.set('Offer declined. Your response has been recorded.');
        },
        error: (error: HttpErrorResponse) => this.handleMutationError(error),
      });
  }

  statusLabel(status: ProviderOfferStatus): string {
    const labels: Record<ProviderOfferStatus, string> = {
      OFFERED: 'Awaiting response',
      ACCEPTED: 'Accepted (refreshing)',
      CONFIRMED: 'Confirmed',
      DECLINED: 'Declined',
      EXPIRED: 'Expired',
      CANCELLED: 'Cancelled',
    };
    return labels[status];
  }

  private beginMutation(): void {
    this.mutating.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
  }

  private handleMutationError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.conflictLocked.set(true);
      this.declineOpen.set(false);
      this.setError('This offer is no longer actionable. It may have expired or changed.');
      this.loadOffer(true);
      return;
    }
    this.handleError(error);
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 403) {
      void this.router.navigate(['/provider/access-denied']);
      return;
    }
    if (error.status === 404) {
      this.offer.set(null);
      this.notFound.set(true);
      this.setError('This offer could not be found or is not available to this provider account.');
      return;
    }
    this.setError(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : 'This offer could not be loaded right now. Please try again.',
    );
  }

  private setError(message: string): void {
    this.error.set(message);
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
