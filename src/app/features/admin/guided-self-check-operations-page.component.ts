import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
import {
  ClassificationProcessingRow,
  ContactWorkItemRow,
  InternalClinicalCapability,
  InternalClinicalProfessional,
  SelfCheckAnalysis,
  SelfCheckReviewRow,
} from '../../core/models/guided-self-check-operations.model';

@Component({
  selector: 'app-guided-self-check-operations-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <header>
      <p class="text-sm font-bold uppercase text-brand-700">Guided Self-Check</p>
      <h1 class="mt-2 text-3xl font-bold">Clinical Operations</h1>
      <p class="mt-2 text-slate-600">
        SmartClinic internal queues for urgent reviews, AMBER analysis and classification
        processing.
      </p>
    </header>
    <nav aria-label="Clinical operations sections" class="mt-6 flex flex-wrap gap-2">
      @for (t of tabs; track t.key) {
        <button
          type="button"
          (click)="select(t.key)"
          [class.bg-brand-800]="tab() === t.key"
          [class.text-white]="tab() === t.key"
          class="min-h-11 rounded-xl border px-4 font-bold"
        >
          {{ t.label }}
        </button>
      }
      <a
        routerLink="/admin/guided-self-check/governance"
        class="inline-flex min-h-11 items-center rounded-xl border px-4 font-bold"
        >Clinical Governance</a
      >
    </nav>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">
        Loading {{ tabLabel().toLowerCase() }}…
      </p>
    } @else if (error()) {
      <div role="alert" class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p>{{ error() }}</p>
        <button type="button" (click)="load()" class="mt-3 font-bold underline">Try again</button>
      </div>
    } @else {
      @switch (tab()) {
        @case ('reviews') {
          <section class="mt-6">
            <div class="flex flex-wrap gap-3">
              <label class="font-semibold"
                >Status<select [(ngModel)]="reviewStatus" class="ml-2 rounded-lg border p-2">
                  <option value="">All statuses</option>
                  @for (s of reviewStatuses; track s) {
                    <option [value]="s">{{ label(s) }}</option>
                  }
                </select></label
              ><button
                type="button"
                (click)="load()"
                class="rounded-lg bg-brand-700 px-4 font-bold text-white"
              >
                Apply
              </button>
            </div>
            @if (!reviews().length) {
              <p class="mt-5 rounded-2xl border bg-white p-6">
                No urgent reviews match these filters.
              </p>
            } @else {
              <div class="mt-5 grid gap-4">
                @for (r of reviews(); track r.reference) {
                  <article class="rounded-2xl border bg-white p-5">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span
                          class="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-900"
                          >{{ r.priority }}</span
                        >
                        <h2 class="mt-3 font-bold">{{ r.reference }}</h2>
                        <p class="text-sm text-slate-600">Self-Check {{ r.selfCheckReference }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold">{{ label(r.status) }}</p>
                        <p class="text-sm">{{ date(r.createdAt) }}</p>
                      </div>
                    </div>
                    <p class="mt-3">
                      Assigned: {{ r.assignedProfessional?.displayName || 'Not assigned' }}
                    </p>
                    <a
                      [routerLink]="['/admin/guided-self-check/reviews', r.reference]"
                      class="mt-4 inline-flex font-bold text-brand-700 underline"
                      >Open review</a
                    >
                  </article>
                }
              </div>
            }
          </section>
        }
        @case ('routine') {
          <section class="mt-6">
            <h2 class="text-xl font-bold">Routine AMBER Reviews</h2>
            <p class="mt-1 text-slate-600">
              Internal clinical review prompted by validated AMBER decision support.
            </p>
            <div class="mt-4 flex flex-wrap gap-3">
              <label class="font-semibold"
                >Status<select [(ngModel)]="reviewStatus" class="ml-2 rounded-lg border p-2">
                  <option value="">All statuses</option>
                  @for (s of reviewStatuses; track s) {
                    <option [value]="s">{{ label(s) }}</option>
                  }
                </select></label
              ><button
                type="button"
                (click)="applyFilters()"
                class="rounded-lg bg-brand-700 px-4 font-bold text-white"
              >
                Apply
              </button>
            </div>
            @if (!reviews().length) {
              <p class="mt-5 rounded-2xl border bg-white p-6">
                No routine AMBER reviews match this view.
              </p>
            } @else {
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                @for (r of reviews(); track r.reference) {
                  <article class="rounded-2xl border border-amber-200 bg-white p-5">
                    <div class="flex justify-between gap-3">
                      <div>
                        <span
                          class="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-950"
                          >AMBER · Routine</span
                        >
                        <h3 class="mt-3 font-bold">{{ r.reference }}</h3>
                        <p class="text-sm">Self-Check {{ r.selfCheckReference }}</p>
                      </div>
                      <strong>{{ label(r.status) }}</strong>
                    </div>
                    <p class="mt-3">
                      Assigned: {{ r.assignedProfessional?.displayName || 'Not assigned' }}
                    </p>
                    <a
                      [routerLink]="['/admin/guided-self-check/reviews', r.reference]"
                      class="mt-4 inline-flex font-bold text-brand-700 underline"
                      >Open routine review</a
                    >
                  </article>
                }
              </div>
            }
          </section>
        }
        @case ('analyses') {
          <section class="mt-6">
            @if (!analyses().length) {
              <p class="rounded-2xl border bg-white p-6">No AI analyses match this view.</p>
            } @else {
              <div class="grid gap-4">
                @for (a of analyses(); track a.reference) {
                  <article class="rounded-2xl border bg-white p-5">
                    <div class="flex justify-between gap-3">
                      <div>
                        <p class="font-bold">{{ a.reference }}</p>
                        <p class="text-sm">
                          Self-Check {{ a.selfCheckReference }} · Classification remains AMBER
                        </p>
                      </div>
                      <span class="font-bold">{{ label(a.status) }}</span>
                    </div>
                    @if (a.output?.humanReviewSuggested) {
                      <p class="mt-3 rounded-lg bg-amber-50 p-3 font-semibold">
                        Human review recommended. Check Routine Reviews for the authoritative review
                        workflow.
                      </p>
                    }
                    <a
                      [routerLink]="['/admin/guided-self-check/analyses', a.reference]"
                      class="mt-4 inline-flex font-bold text-brand-700 underline"
                      >View analysis</a
                    >
                  </article>
                }
              </div>
            }
          </section>
        }
        <!-- @case ('contacts') {
          <section class="mt-6">
            <h2 class="text-xl font-bold">Professional Contact</h2>
            <p class="mt-1 text-slate-600">
              Manual SmartClinic Operations contact work. Opening a task does not call or message
              the patient.
            </p>
            <div class="mt-4 flex flex-wrap gap-3">
              <label class="font-semibold"
                >Status<select [(ngModel)]="contactStatusFilter" class="ml-2 rounded-lg border p-2">
                  <option value="">All statuses</option>
                  @for (s of contactStatuses; track s) {
                    <option [value]="s">{{ contactStatus(s) }}</option>
                  }
                </select></label
              ><label class="font-semibold"
                >Priority<select [(ngModel)]="contactPriority" class="ml-2 rounded-lg border p-2">
                  <option value="">All priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="ROUTINE">Routine</option>
                </select></label
              ><button
                type="button"
                (click)="applyFilters()"
                class="rounded-lg bg-brand-700 px-4 font-bold text-white"
              >
                Apply
              </button>
            </div>
            @if (!contacts().length) {
              <p class="mt-5 rounded-2xl border bg-white p-6">
                No active professional-contact work items.
              </p>
            } @else {
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                @for (c of contacts(); track c.reference) {
                  <article class="rounded-2xl border bg-white p-5">
                    <div class="flex justify-between gap-3">
                      <span class="font-bold">{{ label(c.priority) }} priority</span
                      ><strong>{{ contactStatus(c.status) }}</strong>
                    </div>
                    <h3 class="mt-3 font-bold">{{ c.reference }}</h3>
                    <p class="text-sm">Self-Check {{ c.selfCheckReference }}</p>
                    <p class="mt-2 text-sm">Created {{ date(c.createdAt) }}</p>
                    <a
                      [routerLink]="['/admin/guided-self-check/contact-work-items', c.reference]"
                      class="mt-4 inline-flex font-bold text-brand-700 underline"
                      >Open contact work item</a
                    >
                  </article>
                }
              </div>
            }
          </section>
        } -->
        @case ('processing') {
          <section class="mt-6">
            <div class="flex flex-wrap items-end gap-3">
              <label class="font-semibold"
                >Questionnaire version<input
                  [(ngModel)]="questionnaireVersion"
                  type="number"
                  min="1"
                  placeholder="e.g. 3"
                  class="mt-1 block rounded-lg border p-2"
                /><span class="mt-1 block text-xs font-normal text-slate-600"
                  >Required for a bounded batch.</span
                ></label
              ><label class="font-semibold"
                >Maximum cases<input
                  [(ngModel)]="batchLimit"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 25"
                  class="mt-1 block rounded-lg border p-2" /></label
              ><button
                type="button"
                (click)="batch()"
                [disabled]="busy() || !questionnaireVersion"
                class="min-h-11 rounded-lg bg-brand-700 px-4 font-bold text-white disabled:opacity-50"
              >
                {{ busy() ? 'Processing batch…' : 'Run bounded batch' }}
              </button>
            </div>
            @if (batchMessage()) {
              <p role="status" class="mt-3 rounded-lg bg-brand-50 p-3">{{ batchMessage() }}</p>
            }
            <div class="mt-5 grid gap-4">
              @for (row of processing(); track row.reference) {
                <article class="rounded-2xl border bg-white p-5">
                  <div class="flex flex-wrap justify-between gap-3">
                    <div>
                      <p class="font-bold">{{ row.reference }}</p>
                      <p>Questionnaire v{{ row.questionnaireVersion ?? 'Unavailable' }}</p>
                    </div>
                    <span class="font-bold">{{ label(row.classificationStatus) }}</span>
                  </div>
                  <p class="mt-2 text-sm">
                    Attempts: {{ row.attemptCount }} · Last attempt:
                    {{ date(row.lastProcessingAttemptAt) }}
                  </p>
                  <p class="mt-1 text-sm">
                    Failure: {{ row.failureCode ? label(row.failureCode) : 'None recorded' }}
                  </p>
                  <button
                    type="button"
                    (click)="retry(row)"
                    [disabled]="busy()"
                    class="mt-4 font-bold text-brand-700 underline"
                  >
                    Reprocess
                  </button>
                </article>
              }
            </div>
          </section>
        }
        @case ('professionals') {
          <section class="mt-6">
            @if (isAdmin()) {
              <details class="rounded-2xl border bg-white p-5">
                <summary class="cursor-pointer font-bold">Authorize clinical professional</summary>
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                  <label class="font-semibold"
                    >User email<input
                      [(ngModel)]="email"
                      type="email"
                      placeholder="clinician@smartclinic.example"
                      class="mt-1 w-full rounded-lg border p-3"
                    /><span class="mt-1 block text-xs font-normal"
                      >Authorize an existing SmartClinic user as an internal clinical
                      professional.</span
                    ></label
                  ><label class="font-semibold"
                    >Display name<input
                      [(ngModel)]="displayName"
                      placeholder="e.g. Dr Ada Okafor"
                      class="mt-1 w-full rounded-lg border p-3" /></label
                  ><label class="font-semibold"
                    >Professional type<select
                      [(ngModel)]="professionalType"
                      class="mt-1 w-full rounded-lg border p-3"
                    >
                      <option value="DOCTOR">Doctor</option>
                      <option value="NURSE">Nurse</option>
                      <option value="OTHER_CLINICAL_PROFESSIONAL">
                        Other clinical professional
                      </option>
                    </select></label
                  >
                  <fieldset>
                    <legend class="font-semibold">Capabilities</legend>
                    @for (c of capabilities; track c) {
                      <label class="mt-2 flex gap-2"
                        ><input
                          type="checkbox"
                          [checked]="selectedCapabilities().includes(c)"
                          (change)="toggleCapability(c)"
                        />{{ label(c) }}</label
                      >
                    }
                  </fieldset>
                </div>
                <button
                  type="button"
                  (click)="authorize()"
                  [disabled]="busy() || !email || !displayName || !selectedCapabilities().length"
                  class="mt-5 min-h-11 rounded-lg bg-brand-700 px-4 font-bold text-white disabled:opacity-50"
                >
                  {{ busy() ? 'Authorizing…' : 'Authorize professional' }}
                </button>
              </details>
            } @else {
              <p class="rounded-xl bg-slate-100 p-4">
                Operations may view this directory. Authorization and capability changes require an
                Admin account.
              </p>
            }
            <div class="mt-5 grid gap-4">
              @for (p of professionals(); track p.reference) {
                <article class="rounded-2xl border bg-white p-5">
                  <div class="flex flex-wrap justify-between gap-3">
                    <div>
                      <h2 class="font-bold">{{ p.displayName }}</h2>
                      <p class="text-sm">{{ p.reference }} · {{ label(p.professionalType) }}</p>
                    </div>
                    <span class="font-bold">{{ label(p.status) }}</span>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (c of p.capabilities; track c) {
                      <span class="rounded-full bg-brand-50 px-3 py-1 text-sm">{{ label(c) }}</span>
                    }
                  </div>
                  @if (isAdmin() && p.status === 'ACTIVE') {
                    <div class="mt-4 flex flex-wrap gap-3">
                      @for (c of capabilities; track c) {
                        <button
                          type="button"
                          (click)="changeCapability(p, c, !p.capabilities.includes(c))"
                          [disabled]="busy()"
                          class="font-bold text-brand-700 underline"
                        >
                          {{ p.capabilities.includes(c) ? 'Revoke' : 'Grant' }} {{ label(c) }}
                        </button>
                      }
                      <button
                        type="button"
                        (click)="disable(p)"
                        [disabled]="busy()"
                        class="font-bold text-red-700 underline"
                      >
                        Disable
                      </button>
                    </div>
                  }
                </article>
              }
            </div>
          </section>
        }
      }
      @if (tab() === 'reviews' || tab() === 'routine') {
        <nav aria-label="Operations queue pages" class="mt-6 flex items-center justify-between">
          <button
            type="button"
            (click)="go(page() - 1)"
            [disabled]="loading() || page() === 1"
            class="min-h-11 rounded-lg border px-4 font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {{ page() }} of {{ totalPages() }}</span>
          <button
            type="button"
            (click)="go(page() + 1)"
            [disabled]="loading() || page() >= totalPages()"
            class="min-h-11 rounded-lg border px-4 font-bold disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      }
    }
    @if (actionError()) {
      <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4 text-red-900">{{ actionError() }}</p>
    }
  </main>`,
})
export class GuidedSelfCheckOperationsPageComponent {
  private api = inject(GuidedSelfCheckOperationsApiService);
  private auth = inject(AuthStateService);
  tabs = [
    { key: 'reviews', label: 'Urgent Reviews' },
    { key: 'routine', label: 'Routine Reviews' },
    { key: 'analyses', label: 'AI Analysis' },
    // { key: 'contacts', label: 'Professional Contact' },
    { key: 'processing', label: 'Classification Processing' },
    { key: 'professionals', label: 'Clinical Professionals' },
  ] as const;
  tab = signal<(typeof this.tabs)[number]['key']>('reviews');
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  actionError = signal('');
  reviews = signal<readonly SelfCheckReviewRow[]>([]);
  contacts = signal<readonly ContactWorkItemRow[]>([]);
  analyses = signal<readonly SelfCheckAnalysis[]>([]);
  processing = signal<readonly ClassificationProcessingRow[]>([]);
  professionals = signal<readonly InternalClinicalProfessional[]>([]);
  reviewStatuses = [
    'PENDING',
    'ACKNOWLEDGED',
    'ASSIGNED',
    'IN_REVIEW',
    'ESCALATED',
    'COMPLETED',
    'CANCELLED',
  ];
  reviewStatus = '';
  contactStatusFilter = '';
  contactPriority = '';
  contactStatuses = ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  page = signal(1);
  total = signal(0);
  limit = 20;
  questionnaireVersion: number | null = null;
  batchLimit = 25;
  batchMessage = signal('');
  email = '';
  displayName = '';
  professionalType: 'DOCTOR' | 'NURSE' | 'OTHER_CLINICAL_PROFESSIONAL' = 'DOCTOR';
  capabilities: InternalClinicalCapability[] = [
    'SELF_CHECK_CLINICAL_REVIEW',
    'URGENT_SELF_CHECK_REVIEW',
  ];
  selectedCapabilities = signal<InternalClinicalCapability[]>(['URGENT_SELF_CHECK_REVIEW']);
  tabLabel = computed(() => this.tabs.find((t) => t.key === this.tab())!.label);
  isAdmin = computed(() => this.auth.currentUser()?.roles.includes('ADMIN') ?? false);
  constructor() {
    this.load();
  }
  select(key: (typeof this.tabs)[number]['key']) {
    this.tab.set(key);
    this.page.set(1);
    this.load();
  }
  applyFilters() {
    this.page.set(1);
    this.load();
  }
  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }
  go(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    if (this.tab() === 'reviews')
      this.api
        .reviews({
          status: (this.reviewStatus as never) || undefined,
          page: this.page(),
          limit: this.limit,
        })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (r) => this.setPaged(this.reviews, r),
          error: () => this.error.set('Urgent reviews could not be loaded.'),
        });
    else if (this.tab() === 'routine')
      this.api
        .reviews({
          reviewModel: 'INTERNAL_ROUTINE',
          classification: 'AMBER',
          status: (this.reviewStatus as never) || undefined,
          page: this.page(),
          limit: this.limit,
        })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (r) => this.setPaged(this.reviews, r),
          error: () => this.error.set('Routine AMBER reviews could not be loaded.'),
        });
    else if (this.tab() === 'analyses')
      this.api
        .analyses()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (r) => this.analyses.set(r.items),
          error: () => this.error.set('AI analyses could not be loaded.'),
        });
    // else if (this.tab() === 'contacts')
    //   this.api
    //     .contactWorkItems({
    //       status: (this.contactStatusFilter as never) || undefined,
    //       priority: (this.contactPriority as never) || undefined,
    //       page: this.page(),
    //       limit: this.limit,
    //     })
    //     .pipe(finalize(() => this.loading.set(false)))
    //     .subscribe({
    //       next: (r) => this.setPaged(this.contacts, r),
    //       error: () => this.error.set('Professional contact work could not be loaded.'),
    //     });
    else if (this.tab() === 'processing')
      this.api
        .processing()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (r) => this.processing.set(r.items),
          error: () => this.error.set('Classification processing could not be loaded.'),
        });
    else
      this.api
        .professionals({ status: undefined })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (r) => this.professionals.set(r.items),
          error: () => this.error.set('Clinical professionals could not be loaded.'),
        });
  }
  private setPaged<T>(
    target: { set(value: readonly T[]): void },
    result: import('../../core/models/guided-self-check-operations.model').Paged<T>,
  ) {
    target.set(result.items);
    this.total.set(result.total);
    this.page.set(result.page);
    this.limit = result.limit;
  }
  authorize() {
    this.mutate(
      this.api.authorize({
        userEmail: this.email,
        displayName: this.displayName,
        professionalType: this.professionalType,
        capabilities: this.selectedCapabilities(),
      }),
      () => {
        this.email = '';
        this.displayName = '';
        this.load();
      },
    );
  }
  toggleCapability(c: InternalClinicalCapability) {
    this.selectedCapabilities.update((x) => (x.includes(c) ? x.filter((v) => v !== c) : [...x, c]));
  }
  changeCapability(p: InternalClinicalProfessional, c: InternalClinicalCapability, grant: boolean) {
    if (!confirm(`${grant ? 'Grant' : 'Revoke'} ${this.label(c)} for ${p.displayName}?`)) return;
    this.mutate(this.api.capability(p.reference, c, grant), () => this.load());
  }
  disable(p: InternalClinicalProfessional) {
    if (
      !confirm(
        `Disable ${p.displayName}? Disabled professionals can no longer start or complete Guided Self-Check clinical reviews.`,
      )
    )
      return;
    this.mutate(this.api.disableProfessional(p.reference), () => this.load());
  }
  retry(row: ClassificationProcessingRow) {
    this.mutate(this.api.reprocess(row.reference), (r) => {
      this.batchMessage.set(`Outcome: ${this.label(r.outcome)}.`);
      this.load();
    });
  }
  batch() {
    if (!this.questionnaireVersion) return;
    this.mutate(this.api.batch(this.questionnaireVersion, this.batchLimit), (r) => {
      this.batchMessage.set(
        `Processed ${r.processed}; classified ${r.classified}; failed ${r.failed}.`,
      );
      this.load();
    });
  }
  private mutate<T>(request: Observable<T>, next: (v: T) => void) {
    this.busy.set(true);
    this.actionError.set('');
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next,
      error: () =>
        this.actionError.set('The operation could not be completed. Refresh and try again.'),
    });
  }
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
  date(v: string | null) {
    return v
      ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(v),
        )
      : 'Not recorded';
  }
  contactStatus(v: string) {
    return v === 'IN_PROGRESS' ? 'In progress' : this.label(v);
  }
}
