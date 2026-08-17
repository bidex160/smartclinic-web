import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { FulfilmentModesApiService } from '../../core/services/fulfilment-modes-api.service';
import { BookingFlowStateService } from './booking-flow-state.service';
import { BookingProgressComponent } from './booking-progress.component';

@Component({
  selector: 'app-fulfilment-selection-page',
  imports: [RouterLink, BookingProgressComponent],
  templateUrl: './fulfilment-selection-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FulfilmentSelectionPageComponent {
  private readonly modesApi = inject(FulfilmentModesApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  readonly bookingFlow = inject(BookingFlowStateService);

  readonly loading = signal(false);
  readonly modes = signal<FulfilmentMode[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadModes();
  }

  loadModes(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.modesApi
      .getFulfilmentModes()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (modes) => this.modes.set(modes),
        error: (error: HttpErrorResponse) => this.error.set(this.getErrorMessage(error)),
      });
  }

  selectMode(mode: FulfilmentMode): void {
    this.bookingFlow.selectFulfilmentMode(mode);
    void this.router.navigate(['/book/details']);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    return error.status === 0
      ? 'We could not reach SmartClinic. Check your connection and try again.'
      : 'We could not load fulfilment choices right now. Please try again.';
  }
}
