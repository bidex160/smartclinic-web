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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  AdminProviderAssignment,
  BookingStatus,
} from '../../core/models/admin-provider-assignment.model';
import { ProviderOfferStatus } from '../../core/models/provider-offer.model';
import { AdminProviderAssignmentsApiService } from '../../core/services/admin-provider-assignments-api.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';
import { UtilsService } from '../../core/services/utils.service';

@Component({
  selector: 'app-provider-assignment-detail-page',
  imports: [AdminSessionHeaderComponent, DatePipe, RouterLink],
  templateUrl: './provider-assignment-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderAssignmentDetailPageComponent {
  utilsService = inject(UtilsService);

  private readonly api = inject(AdminProviderAssignmentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly assignmentId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly assignment = signal<AdminProviderAssignment | null>(null);
  readonly loading = signal(false);
  readonly confirming = signal(false);
  readonly confirmationOpen = signal(false);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);

  constructor() {
    this.loadAssignment();
  }

  loadAssignment(): void {
    if (this.loading() || !this.assignmentId) return;
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.api
      .getAssignment(this.assignmentId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (assignment) => this.assignment.set(assignment),
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  requestConfirmation(): void {
    if (this.assignment()?.status === 'ACCEPTED') this.confirmationOpen.set(true);
  }

  cancelConfirmation(): void {
    this.confirmationOpen.set(false);
  }

  confirmAssignment(): void {
    if (this.confirming() || !this.confirmationOpen() || this.assignment()?.status !== 'ACCEPTED')
      return;
    this.confirming.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
    this.api
      .confirmAssignment(this.assignmentId)
      .pipe(finalize(() => this.confirming.set(false)))
      .subscribe({
        next: (assignment) => {
          this.assignment.set(assignment);
          this.confirmationOpen.set(false);
          this.statusMessage.set(
            'Provider assignment confirmed. The booking is now provider assigned.',
          );
        },
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  assignmentStatusLabel(status: ProviderOfferStatus): string {
    return this.humanize(status);
  }

  bookingStatusLabel(status: BookingStatus): string {
    return this.humanize(status);
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 403) {
      void this.router.navigate(['/admin/access-denied']);
      return;
    }
    if (error.status === 404) {
      this.assignment.set(null);
      this.notFound.set(true);
      this.setError('This provider assignment could not be found.');
      return;
    }
    const messages: Record<number, string> = {
      409: 'This assignment can no longer be confirmed from its current workflow state.',
      422: 'The assignment could not be confirmed because required workflow information is incomplete.',
    };
    this.setError(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? 'This assignment could not be updated right now.'),
    );
  }

  private setError(message: string): void {
    this.error.set(message);
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }

  private humanize(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }
}
