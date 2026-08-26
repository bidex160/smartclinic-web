import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminDashboardSummary } from '../../core/models/dashboard-summary.model';
import { AdminMatchingQueueItem } from '../../core/models/admin-matching-queue.model';
import { AdminDashboardApiService } from '../../core/services/admin-dashboard-api.service';
import { AdminMatchingQueueApiService } from '../../core/services/admin-matching-queue-api.service';
import { UtilsService } from '../../core/services/utils.service';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink],
  templateUrl: './admin-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPageComponent {
  private readonly dashboardApi = inject(AdminDashboardApiService);
  private readonly queueApi = inject(AdminMatchingQueueApiService);
  readonly utils = inject(UtilsService);
  readonly summary = signal<AdminDashboardSummary | null>(null);
  readonly summaryLoading = signal(true);
  readonly summaryError = signal<string | null>(null);
  readonly attention = signal<AdminMatchingQueueItem[]>([]);
  readonly attentionLoading = signal(true);
  readonly attentionError = signal<string | null>(null);

  constructor() {
    this.loadSummary();
    this.loadAttention();
  }

  loadSummary(): void {
    this.summaryLoading.set(true);
    this.summaryError.set(null);
    this.dashboardApi.getSummary().pipe(finalize(() => this.summaryLoading.set(false))).subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.summaryError.set('We could not load the operations summary.'),
    });
  }

  loadAttention(): void {
    this.attentionLoading.set(true);
    this.attentionError.set(null);
    this.queueApi.getQueue({ bookingStatus: 'UNFULFILLABLE', page: 1, limit: 5 })
      .pipe(finalize(() => this.attentionLoading.set(false)))
      .subscribe({
        next: (response) => this.attention.set(response.items),
        error: () => this.attentionError.set('We could not load bookings needing attention.'),
      });
  }
}
