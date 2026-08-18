import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { HealthCheckResult } from '../../core/models/health-check-result.model';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { HealthCheckResultViewComponent } from './health-check-result-view.component';

@Component({
  selector: 'app-registered-health-check-result-page',
  imports: [HealthCheckResultViewComponent],
  template: `
    @if (loading()) {
      <main class="mx-auto max-w-5xl px-5 py-10">
        <p role="status" aria-live="polite" class="rounded-xl bg-brand-50 p-5">
          Loading your Smart Health Check result…
        </p>
      </main>
    }
    @if (error()) {
      <main class="mx-auto max-w-3xl px-5 py-10">
        <section
          #errorSummary
          tabindex="-1"
          role="alert"
          class="rounded-2xl border border-red-200 bg-red-50 p-6 outline-none focus:ring-4 focus:ring-red-200"
        >
          <h1 class="text-2xl font-bold">Result unavailable</h1>
          <p class="mt-2">{{ error() }}</p>
          <button
            type="button"
            (click)="load()"
            class="mt-5 min-h-12 rounded-xl bg-brand-700 px-5 font-bold text-white"
          >
            Try again
          </button>
        </section>
      </main>
    }
    @if (result(); as value) {
      <app-health-check-result-view [result]="value" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisteredHealthCheckResultPageComponent {
  private readonly api = inject(HealthCheckResultsApiService);
  private readonly reference =
    inject(ActivatedRoute).snapshot.paramMap.get('bookingReference') ?? '';
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly result = signal<HealthCheckResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  constructor() {
    this.load();
  }
  load(): void {
    if (!this.reference || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getOwnResult(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: HttpErrorResponse) => {
          this.result.set(null);
          this.error.set(
            error.status === 0
              ? 'SmartClinic could not be reached. Check your connection and try again.'
              : 'This completed result is not available to this account.',
          );
          queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
        },
      });
  }
}
