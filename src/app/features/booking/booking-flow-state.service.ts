import { computed, Injectable, signal } from '@angular/core';

import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { HealthCheckPackage } from '../../core/models/health-check-package.model';
import { PublicBookingResponse } from '../../core/models/public-booking.model';
import { BookingDetailsDraft } from './booking-flow.models';

@Injectable({ providedIn: 'root' })
export class BookingFlowStateService {
  private readonly selectedPackageState = signal<HealthCheckPackage | null>(null);
  private readonly selectedFulfilmentModeState = signal<FulfilmentMode | null>(null);
  private readonly detailsState = signal<BookingDetailsDraft | null>(null);
  private readonly confirmationState = signal<PublicBookingResponse | null>(null);

  readonly selectedPackage = this.selectedPackageState.asReadonly();
  readonly selectedFulfilmentMode = this.selectedFulfilmentModeState.asReadonly();
  readonly details = this.detailsState.asReadonly();
  readonly confirmation = this.confirmationState.asReadonly();

  readonly bookerDetails = computed(() => this.detailsState()?.booker ?? null);
  readonly participantDetails = computed(() => this.detailsState()?.participant ?? null);
  readonly preferredDate = computed(() => this.detailsState()?.preferences.preferredDate ?? '');
  readonly preferredTimeFrom = computed(
    () => this.detailsState()?.preferences.preferredTimeFrom ?? '',
  );
   readonly preferredTimezone = computed(
    () => this.detailsState()?.preferences.preferredTimezone ?? '',
  );
  readonly preferredTimeTo = computed(() => this.detailsState()?.preferences.preferredTimeTo ?? '');
  readonly locationNote = computed(() => this.detailsState()?.preferences.locationNote ?? '');
  readonly selectedPrice = computed(() => {
    const healthCheckPackage = this.selectedPackageState();
    const fulfilmentMode = this.selectedFulfilmentModeState();
    if (!healthCheckPackage || !fulfilmentMode) return null;
    return (
      healthCheckPackage.prices.find((price) => price.fulfilmentModeId === fulfilmentMode.id) ??
      null
    );
  });
  readonly canAccessFulfilment = computed(() => this.selectedPackageState() !== null);
  readonly canAccessDetails = computed(
    () =>
      this.selectedPackageState() !== null &&
      this.selectedFulfilmentModeState() !== null &&
      this.selectedPrice() !== null,
  );

  selectPackage(healthCheckPackage: HealthCheckPackage): void {
    if (this.selectedPackageState()?.id !== healthCheckPackage.id) {
      this.selectedFulfilmentModeState.set(null);
      this.detailsState.set(null);
      this.confirmationState.set(null);
    }
    this.selectedPackageState.set(healthCheckPackage);
  }

  selectFulfilmentMode(fulfilmentMode: FulfilmentMode): void {
    if (this.selectedFulfilmentModeState()?.id !== fulfilmentMode.id) {
      this.detailsState.set(null);
      this.confirmationState.set(null);
    }
    this.selectedFulfilmentModeState.set(fulfilmentMode);
  }

  saveDetails(details: BookingDetailsDraft): void {
    this.detailsState.set(details);
    this.confirmationState.set(null);
  }

  completeBooking(confirmation: PublicBookingResponse): void {
    this.confirmationState.set(confirmation);
  }

  clear(): void {
    this.selectedPackageState.set(null);
    this.selectedFulfilmentModeState.set(null);
    this.detailsState.set(null);
    this.confirmationState.set(null);
  }
}
