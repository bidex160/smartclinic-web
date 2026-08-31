import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  MyReviewRow,
  MyReviewStatus,
  SelfCheckReviewPriority,
} from '../../core/models/guided-self-check-operations.model';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';

@Component({
  selector: 'app-internal-guided-self-check-reviews-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase text-brand-700">Internal clinical workspace</p>
        <h1 class="mt-2 text-3xl font-bold">My Self-Check Reviews</h1>
        <p class="mt-2 text-slate-600">
          Reviews currently assigned to your SmartClinic clinical-professional identity.
        </p>
      </div>
      <button
        type="button"
        (click)="load()"
        [disabled]="loading()"
        class="min-h-11 rounded-xl border px-4 font-bold disabled:opacity-50"
      >
        {{ loading() ? 'Refreshing…' : 'Refresh' }}
      </button>
    </header>
    <section class="mt-6 rounded-2xl border bg-white p-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="font-semibold"
          >Work status<select
            [(ngModel)]="status"
            (ngModelChange)="filtersChanged()"
            class="mt-1 w-full rounded-lg border p-3"
          >
            <option value="">Active</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_REVIEW">In clinical review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option></select
          ><span class="mt-1 block text-xs font-normal text-slate-600"
            >Active uses the backend's assigned and in-review worklist.</span
          ></label
        ><label class="font-semibold"
          >Priority<select
            [(ngModel)]="priority"
            (ngModelChange)="filtersChanged()"
            class="mt-1 w-full rounded-lg border p-3"
          >
            <option value="">All priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="ROUTINE">Routine</option>
          </select></label
        >
      </div>
    </section>
    @if (loading() && !loaded()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">
        Loading your assigned reviews…
      </p>
    } @else if (error()) {
      <div role="alert" class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p>{{ error() }}</p>
        <button type="button" (click)="load()" class="mt-3 font-bold underline">Try again</button>
      </div>
    } @else if (!reviews().length) {
      <p class="mt-6 rounded-2xl border bg-white p-6">{{ emptyMessage() }}</p>
    } @else {
      <section aria-label="Assigned Self-Check reviews" class="mt-6 grid gap-4 sm:grid-cols-2">
        @for (r of reviews(); track r.reference) {
          <article class="rounded-2xl border bg-white p-5">
            <div class="flex items-start justify-between gap-3">
              <span
                class="rounded-full px-3 py-1 text-sm font-bold"
                [class.bg-red-100]="r.priority === 'URGENT'"
                [class.text-red-900]="r.priority === 'URGENT'"
                [class.bg-slate-100]="r.priority === 'ROUTINE'"
                >{{ label(r.priority) }} priority</span
              ><strong>{{ statusLabel(r.status) }}</strong>
            </div>
            <dl class="mt-4 space-y-3">
              <div>
                <dt class="text-sm text-slate-600">Self-Check</dt>
                <dd class="break-all font-bold">{{ r.selfCheckReference }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Review</dt>
                <dd class="break-all font-bold">{{ r.reference }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Assigned</dt>
                <dd>{{ date(r.assignedAt) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-600">Started</dt>
                <dd>{{ r.startedAt ? date(r.startedAt) : 'Not started' }}</dd>
              </div>
            </dl>
            <a
              [routerLink]="['/internal/guided-self-check-reviews', r.reference]"
              class="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-4 font-bold text-white"
              >Open Review</a
            >
          </article>
        }
      </section>
      <nav aria-label="Review pages" class="mt-6 flex items-center justify-between">
        <button
          type="button"
          (click)="go(page() - 1)"
          [disabled]="loading() || page() === 1"
          class="min-h-11 rounded-lg border px-4 font-bold disabled:opacity-40"
        >
          Previous</button
        ><span>Page {{ page() }} of {{ totalPages() }}</span
        ><button
          type="button"
          (click)="go(page() + 1)"
          [disabled]="loading() || page() >= totalPages()"
          class="min-h-11 rounded-lg border px-4 font-bold disabled:opacity-40"
        >
          Next
        </button>
      </nav>
    }
  </main>`,
})
export class InternalGuidedSelfCheckReviewsPageComponent {
  private api = inject(GuidedSelfCheckOperationsApiService);
  reviews = signal<readonly MyReviewRow[]>([]);
  loading = signal(true);
  loaded = signal(false);
  error = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);
  status: MyReviewStatus | '' = '';
  priority: SelfCheckReviewPriority | '' = '';
  constructor() {
    this.load();
  }
  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }
  filtersChanged() {
    this.page.set(1);
    this.load();
  }
  go(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.load();
  }
  load() {
    if (this.loading() && this.loaded()) return;
    this.loading.set(true);
    this.error.set('');
    this.api
      .listMyReviews({
        ...(this.status && { status: this.status }),
        ...(this.priority && { priority: this.priority }),
        page: this.page(),
        limit: this.limit,
      })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.loaded.set(true);
        }),
      )
      .subscribe({
        next: (r) => {
          this.reviews.set(r.items);
          this.total.set(r.total);
          this.page.set(r.page);
          this.limit = r.limit;
        },
        error: (e) => {
          this.reviews.set([]);
          this.error.set(
            e.status === 403
              ? 'You do not currently have access to the internal Self-Check review worklist.'
              : 'Your Self-Check reviews could not be loaded. Please try again.',
          );
        },
      });
  }
  emptyMessage() {
    if (this.status === 'COMPLETED') return 'No completed Self-Check reviews found.';
    if (this.status === 'CANCELLED') return 'No cancelled Self-Check reviews found.';
    return 'No Self-Check reviews are currently assigned to you.';
  }
  statusLabel(v: MyReviewStatus) {
    return v === 'IN_REVIEW' ? 'In clinical review' : this.label(v);
  }
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
  date(v: string) {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(v),
    );
  }
}
