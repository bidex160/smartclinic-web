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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PatientAccountLinkingApiService } from '../../core/services/patient-account-linking-api.service';
import { parseResultAccessToken } from './result-access-token.parser';

const BOOKING_REFERENCE_PATTERN = /^SC-\d{4}-[A-F0-9]{12}$/i;

@Component({
  selector: 'app-link-health-history-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './link-health-history-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkHealthHistoryPageComponent {
  private readonly api = inject(PatientAccountLinkingApiService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly bookingPending = signal(false);
  readonly resultPending = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly bookingForm = this.formBuilder.group({
    bookingReference: ['', [Validators.required, Validators.pattern(BOOKING_REFERENCE_PATTERN)]],
  });
  readonly resultForm = this.formBuilder.group({
    resultLinkOrToken: ['', Validators.required],
  });

  linkFromBooking(): void {
    if (
      this.bookingForm.invalid ||
      this.bookingPending() ||
      this.resultPending() ||
      this.success()
    ) {
      this.bookingForm.markAllAsTouched();
      return;
    }
    const reference = this.bookingForm.controls.bookingReference.value.trim().toUpperCase();
    this.begin();
    this.bookingPending.set(true);
    this.api
      .linkFromBooking(reference)
      .pipe(finalize(() => this.bookingPending.set(false)))
      .subscribe({
        next: () => this.complete(),
        error: (error: HttpErrorResponse) => this.handleError(error, 'booking'),
      });
  }

  linkFromResult(): void {
    if (
      this.resultForm.invalid ||
      this.bookingPending() ||
      this.resultPending() ||
      this.success()
    ) {
      this.resultForm.markAllAsTouched();
      return;
    }
    const token = parseResultAccessToken(
      this.resultForm.controls.resultLinkOrToken.value,
      globalThis.location.origin,
    );
    if (!token) {
      this.error.set('Enter a valid SmartClinic result link or result access token.');
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }
    this.begin();
    this.resultPending.set(true);
    this.api
      .linkFromResult(token)
      .pipe(finalize(() => this.resultPending.set(false)))
      .subscribe({
        next: () => {
          this.resultForm.reset({ resultLinkOrToken: '' });
          this.complete();
        },
        error: (error: HttpErrorResponse) => this.handleError(error, 'result'),
      });
  }

  private begin(): void {
    this.error.set(null);
  }
  private complete(): void {
    this.error.set(null);
    this.success.set(true);
  }
  private handleError(error: HttpErrorResponse, proof: 'booking' | 'result'): void {
    const message =
      error.status === 409
        ? 'This health history cannot be linked to this account. Please contact SmartClinic support if you believe this is incorrect.'
        : error.status === 0
          ? 'SmartClinic could not be reached. Check your connection and try again.'
          : proof === 'booking'
            ? 'This booking session cannot verify the health history. Make sure this is the browser used for the guest booking.'
            : 'This result link is invalid, expired, revoked, or no longer available.';
    this.error.set(message);
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }
}
