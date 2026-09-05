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
    <main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <p class="text-sm font-bold uppercase tracking-wider text-brand-600">
        Patient Portal
      </p>

      <h1 class="mt-2 text-3xl font-bold text-brand-950">
        Health Records
      </h1>

      <div class="mt-2 flex flex-wrap items-center justify-between gap-4"><p class="text-slate-600">Review finalized clinical records shared through your General Care appointments.</p><div class="flex flex-wrap gap-3"><a routerLink="/me/health-records/access-requests" class="rounded-xl border px-4 py-3 font-bold text-brand-700">Access Requests</a><a routerLink="/me/health-records/sharing" class="rounded-xl border px-4 py-3 font-bold text-brand-700">Manage sharing</a></div></div>

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
        <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
          <h2 class="text-xl font-bold">
            No finalized health records yet
          </h2>

          <p class="mt-2 text-slate-600">
            Records will appear here after your provider finalizes them.
          </p>
        </section>
      }
      @else {
        <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Record
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Type
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Service
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Provider
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Care Date
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Finalized
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Status
                  </th>

                  <th
                    scope="col"
                    class="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100 bg-white">
                @for (record of records(); track record.reference) {
                  <tr class="transition hover:bg-slate-50">
                    <td class="whitespace-nowrap px-5 py-4">
                      <div class="max-w-xs">
                        <p class="truncate font-semibold text-slate-900">
                          {{ record.title }}
                        </p>

                        <p class="mt-1 text-xs text-slate-500">
                          {{ record.reference }}
                        </p>
                      </div>
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {{ typeLabel(record.recordType) }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {{ record.service?.name || 'General Care' }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {{ record.provider.displayName }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {{ formatDate(record.occurredAt) }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
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
