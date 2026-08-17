import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BookingFlowStateService } from './booking-flow-state.service';

@Component({
  selector: 'app-booking-confirmation-page',
  templateUrl: './booking-confirmation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingConfirmationPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly bookingFlow = inject(BookingFlowStateService);
  private readonly routeReference = this.route.snapshot.paramMap.get('reference');

  readonly confirmation = computed(() => {
    const confirmation = this.bookingFlow.confirmation();
    return confirmation?.bookingReference === this.routeReference ? confirmation : null;
  });

  bookAnother(): void {
    this.bookingFlow.clear();
    void this.router.navigate(['/health-check/packages']);
  }
}
