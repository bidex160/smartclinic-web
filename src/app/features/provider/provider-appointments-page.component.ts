import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProviderOffer } from '../../core/models/provider-offer.model';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { UtilsService } from '../../core/services/utils.service';

@Component({
  selector: 'app-provider-appointments-page',
  imports: [RouterLink],
  templateUrl: './provider-appointments-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderAppointmentsPageComponent {
  private readonly api = inject(ProviderOffersApiService);
  readonly utils = inject(UtilsService);
  readonly appointments = signal<ProviderOffer[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getOffers('CONFIRMED')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (offers) =>
          this.appointments.set(offers.filter((offer) => offer.confirmedSchedule !== null)),
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.status === 0
              ? 'SmartClinic could not be reached. Check your connection and try again.'
              : 'Appointments could not be loaded right now.',
          ),
      });
  }
}
