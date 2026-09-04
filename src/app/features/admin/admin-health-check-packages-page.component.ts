import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminHealthCheckPackageSummary } from '../../core/models/admin-health-check-catalogue.model';
import { AdminHealthCheckCatalogueApiService } from '../../core/services/admin-health-check-catalogue-api.service';

@Component({
  selector: 'app-admin-health-check-packages-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm font-bold uppercase tracking-wider text-brand-700">Health Checks</p>
          <h1 class="mt-2 text-3xl font-bold text-brand-950">Health Check Packages</h1>
          <p class="mt-2 max-w-3xl text-slate-600">
            Manage SmartClinic Health Check packages, included clinical contents and approved
            optional add-ons.
          </p>
        </div>
        <a
          routerLink="/admin/health-checks/packages/new"
          class="inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-5 font-bold text-white focus:ring-4 focus:ring-brand-200"
          >+ New package</a
        >
      </header>
      @if (loading()) {
        <p role="status" class="mt-8 rounded-2xl bg-white p-6">Loading Health Check packages…</p>
      } @else if (error()) {
        <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6 text-red-900">
          <p>{{ error() }}</p>
          <button type="button" (click)="load()" class="mt-3 font-bold underline">Try again</button>
        </div>
      } @else if (packages().length === 0) {
        <p class="mt-8 rounded-2xl bg-white p-6">No Health Check packages exist yet.</p>
      } @else {
        <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (pkg of packages(); track pkg.code) {
            <article class="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="text-xl font-bold">{{ pkg.name }}</h2>
                  <p class="font-mono text-sm text-slate-600">{{ pkg.code }}</p>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-xs font-bold"
                  [class.bg-green-100]="pkg.isActive"
                  [class.text-green-900]="pkg.isActive"
                  [class.bg-slate-200]="!pkg.isActive"
                  >{{ pkg.isActive ? 'Active' : 'Inactive' }}</span
                >
              </div>
              <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-slate-500">Included contents</dt>
                  <dd class="text-lg font-bold">{{ pkg.includedContentCount }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500">Optional add-ons</dt>
                  <dd class="text-lg font-bold">{{ pkg.optionalAddonCount }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500">Duration</dt>
                  <dd class="font-bold">
                    {{
                      pkg.estimatedDurationMinutes === null
                        ? 'Not set'
                        : pkg.estimatedDurationMinutes + ' minutes'
                    }}
                  </dd>
                </div>
                <div>
                  <dt class="text-slate-500">Updated</dt>
                  <dd>{{ date(pkg.updatedAt) }}</dd>
                </div>
              </dl>
              <a
                [routerLink]="['/admin/health-checks/packages', pkg.code]"
                class="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-4 font-bold text-white focus:ring-4 focus:ring-brand-200"
                >View and edit</a
              >
            </article>
          }
        </div>
      }
    </main>
  `,
})
export class AdminHealthCheckPackagesPageComponent {
  private readonly api = inject(AdminHealthCheckCatalogueApiService);
  readonly packages = signal<readonly AdminHealthCheckPackageSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .listPackages()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (value) => this.packages.set(value),
        error: () => this.error.set('We could not load the Health Check packages. Try again.'),
      });
  }
  date(value: string): string {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value));
  }
}
