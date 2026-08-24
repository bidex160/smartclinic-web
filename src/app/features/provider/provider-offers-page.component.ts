import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ProviderOffer, ProviderOfferStatus } from '../../core/models/provider-offer.model';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { ProviderSessionHeaderComponent } from './provider-session-header.component';
import { UtilsService } from '../../core/services/utils.service';

const OFFER_STATUSES: readonly ProviderOfferStatus[] = [
  'OFFERED',
  'ACCEPTED',
  'CONFIRMED',
  'DECLINED',
  'EXPIRED',
  'CANCELLED',
];

@Component({
  selector: 'app-provider-offers-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ProviderSessionHeaderComponent],
  templateUrl: './provider-offers-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderOffersPageComponent {
  utilsService = inject(UtilsService);

  private readonly api = inject(ProviderOffersApiService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);

  readonly offers = signal<ProviderOffer[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly statuses = OFFER_STATUSES;
  readonly filterForm = this.formBuilder.group({
    status: this.formBuilder.control<ProviderOfferStatus | ''>(''),
  });

  constructor() {
    this.loadOffers();
  }

  loadOffers(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const status = this.filterForm.controls.status.value || undefined;
    this.api
      .getOffers(status)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (offers) =>
          this.offers.set(
            status
              ? offers
              : offers.filter((offer) => offer.status === 'OFFERED' || offer.status === 'ACCEPTED'),
          ),
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  statusLabel(status: ProviderOfferStatus): string {
    const labels: Record<ProviderOfferStatus, string> = {
      OFFERED: 'Awaiting response',
      ACCEPTED: 'Accepted',
      CONFIRMED: 'Confirmed',
      DECLINED: 'Declined',
      EXPIRED: 'Expired',
      CANCELLED: 'Cancelled',
    };
    return labels[status];
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 403) {
      void this.router.navigate(['/provider/access-denied']);
      return;
    }
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : 'Your offers could not be loaded right now. Please try again.',
    );
  }
}
