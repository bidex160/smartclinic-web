import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClinicalRecord } from '../../core/models/clinical-record.model';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';

@Component({
  selector: 'app-health-records-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <header class="rounded-[2rem] border border-ink/[0.08] bg-white p-6 shadow-sm sm:p-8">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">My health records</p>
        <h1 class="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">Health Records</h1>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-4"><p class="max-w-2xl text-ink-soft">Your finalized clinical records from care delivered through SmartClinic.</p><div class="flex flex-wrap gap-3"><a routerLink="/me/health-records/access-requests" class="rounded-xl border px-4 py-3 font-bold text-brand-700">Access Requests</a><a routerLink="/me/health-records/sharing" class="rounded-xl border px-4 py-3 font-bold text-brand-700">Manage sharing</a></div></div>
      </header>

      @if (loading()) {
        <p
          role="status"
          class="mt-8 rounded-2xl border bg-white p-6"
        >
          Loading health records…
        </p>
      }
      @else if (error()) {
        <div
          role="alert"
          class="mt-8 rounded-2xl bg-red-50 p-6"
        >
          We couldn't load your health records.

          <button
            type="button"
            (click)="load()"
            class="font-bold underline"
          >
            Try again
          </button>
        </div>
      }
      @else if (!records().length) {
        <section class="mt-6 rounded-[2rem] border border-ink/[0.08] bg-white p-8 text-center shadow-sm">
          <h2 class="font-display text-xl font-semibold">
            No finalized health records yet
          </h2>

          <p class="mt-2 text-ink-soft">
            Records will appear here after your provider finalizes them.
          </p>
        </section>
      }
      @else {
        <div class="mt-6 overflow-hidden rounded-[2rem] border border-ink/[0.08] bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-ink/[0.08]">
              <thead class="bg-sand-50">
                <tr>
                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    Record
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    Type
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    Service
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    Provider
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    Care Date
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    Finalized
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    Status
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-ink/[0.06] bg-white">
                @for (record of records(); track record.reference) {
                  <tr class="transition hover:bg-sand-50">
                    <td class="whitespace-nowrap px-5 py-4">
                      <div class="max-w-xs">
                        <p class="truncate font-semibold text-ink">
                          {{ record.title }}
                        </p>

                        <p class="mt-1 text-xs text-ink-muted">
                          {{ record.reference }}
                        </p>
                      </div>
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-ink-soft">
                      {{ typeLabel(record.recordType) }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-ink-soft">
                      {{ record.service?.name || 'General Care' }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-ink-soft">
                      {{ record.provider.displayName }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-ink-soft">
                      {{ formatDate(record.occurredAt) }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-ink-soft">
                      {{ formatDate(record.finalizedAt) }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4">
                      <span
                        class="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800"
                      >
                        Finalized
                      </span>
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-right">
                      <a
                        [routerLink]="[
                          '/me/health-records',
                          record.reference
                        ]"
                        class="inline-flex items-center font-bold text-brand-700 hover:underline"
                      >
                        View record
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </main>
  `,
})
export class HealthRecordsPageComponent {
  private readonly api = inject(ClinicalRecordsApiService);

  readonly records = signal<readonly ClinicalRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.api
      .listMine()
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.records.set(page.items);
        },
        error: () => {
          this.error.set(true);
        },
      });
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
    }).format(new Date(value));
  }

  typeLabel(value: string): string {
    return value
      .split('_')
      .map(
        (part) =>
          part[0] + part.slice(1).toLowerCase(),
      )
      .join(' ');
  }
}
