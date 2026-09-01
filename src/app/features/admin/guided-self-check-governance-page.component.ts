import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  GovernanceAuthorization,
  GovernanceStatus,
  RulesetSummary,
} from '../../core/models/guided-self-check-governance.model';
import { AuthStateService } from '../../core/services/auth-state.service';
import { GuidedSelfCheckGovernanceApiService } from '../../core/services/guided-self-check-governance-api.service';
@Component({
  selector: 'app-guided-self-check-governance-page',
  imports: [FormsModule, RouterLink],
  template: `<main class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <a routerLink="/admin/guided-self-check" class="font-bold text-brand-700"
      >← Clinical Operations</a
    >
    <header class="mt-5">
      <p class="font-bold uppercase text-brand-700">Guided Self-Check</p>
      <h1 class="text-3xl font-bold">Clinical Governance</h1>
      <p class="mt-2 text-slate-600">
        Govern approved classification rules without changing patient records.
      </p>
    </header>
    <p class="mt-5 rounded-xl bg-amber-50 p-4">
      Until a compatible ruleset is approved, marked Ready, and activated, completed Self-Checks
      remain pending clinical configuration rather than being classified.
    </p>
    <nav class="mt-5 flex flex-wrap gap-3">
      <button
        type="button"
        (click)="view = 'rulesets'"
        [class.bg-brand-800]="view === 'rulesets'"
        [class.text-white]="view === 'rulesets'"
        class="min-h-11 rounded-lg border px-4 font-bold"
      >
        Rulesets
      </button>
      @if (isAdmin()) {
        <button
          type="button"
                  [class.bg-brand-800]="view === 'authorizations'"
        [class.text-white]="view === 'authorizations'"
          (click)="openAuthorizations()"
          class="min-h-11 rounded-lg border px-4 font-bold"
        >
          Governance Authorizations
        </button>
      }
      <a
        routerLink="new"
        class="inline-flex min-h-11 items-center rounded-lg bg-green-700 px-4 font-bold text-white"
        >Create Draft Ruleset</a
      >
    </nav>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-xl border p-5">Loading clinical governance…</p>
    } @else if (error()) {
      <div role="alert" class="mt-6 rounded-xl bg-red-50 p-5">
        <p>{{ error() }}</p>
        <button type="button" (click)="load()" class="mt-2 font-bold underline">Retry</button>
      </div>
    } @else if (view === 'rulesets') {
      <section class="mt-6">
        <div class="flex flex-wrap gap-3">
          <label class="font-semibold"
            >Status<select [(ngModel)]="status" class="ml-2 rounded-lg border p-2">
              <option value="">All statuses</option>
              @for (s of statuses; track s) {
                <option [value]="s">{{ label(s) }}</option>
              }
            </select></label
          ><label class="font-semibold"
            >Active state<select [(ngModel)]="active" class="ml-2 rounded-lg border p-2">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Not active</option>
            </select></label
          ><button
            type="button"
            (click)="page = 1; load()"
            class="rounded-lg bg-brand-700 px-4 font-bold text-white"
          >
            Apply
          </button>
        </div>
        @if (!rulesets().length) {
          <p class="mt-5 rounded-xl border p-5">No governed rulesets match these filters.</p>
        } @else {
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            @for (r of rulesets(); track r.reference) {
              <article class="rounded-2xl border bg-white p-5">
                <div class="flex justify-between gap-3">
                  <div>
                    <h2 class="font-bold">{{ r.name }}</h2>
                    <p class="text-sm">{{ r.reference }} · v{{ r.version }}</p>
                  </div>
                  <strong>{{ label(r.governanceStatus) }}</strong>
                </div>
                <p class="mt-3">
                  Questionnaire v{{ r.questionnaireVersion }} · {{ r.ruleCount }} rules
                </p>
                <p class="mt-2 font-semibold">
                  {{
                    r.isActive
                      ? 'Active for new compatible Self-Check classifications'
                      : r.governanceStatus === 'READY'
                        ? 'Ready, not active'
                        : 'Not active'
                  }}
                </p>
                <a
                  [routerLink]="[r.reference]"
                  class="mt-4 inline-flex font-bold text-brand-700 underline"
                  >Open ruleset</a
                >
              </article>
            }
          </div>
        }
        @if (isAdmin()) {
          <label class="mt-5 block font-semibold"
            >Disable reason<input
              [(ngModel)]="disableReason"
              maxlength="500"
              placeholder="Explain why governance access should be disabled"
              class="mt-1 w-full rounded-lg border p-3"
            /><span class="mt-1 block text-xs font-normal"
              >Required when disabling an authorization; historical approvals remain
              unchanged.</span
            ></label
          >
        }
        <nav aria-label="Ruleset pages" class="mt-5 flex justify-between">
          <button type="button" (click)="go(page - 1)" [disabled]="page === 1">Previous</button
          ><span>Page {{ page }} of {{ pages() }}</span
          ><button type="button" (click)="go(page + 1)" [disabled]="page >= pages()">Next</button>
        </nav>
      </section>
    } @else {
      <section class="mt-6">
        <h2 class="text-2xl font-bold">Governance Authorizations</h2>
        @if (isAdmin()) {
          <form (ngSubmit)="authorize()" class="mt-4 rounded-xl border bg-white p-5">
            <label class="block font-semibold"
              >SmartClinic user email<input
                [(ngModel)]="email"
                name="email"
                type="email"
                required
                placeholder="clinician@smartclinic.example"
                class="mt-1 w-full rounded-lg border p-3"
              /><span class="mt-1 block text-xs font-normal"
                >Authorize an existing SmartClinic user for Guided Self-Check clinical
                governance.</span
              ></label
            ><label class="mt-3 block font-semibold"
              >Authorization reason (optional)<textarea
                [(ngModel)]="reason"
                name="reason"
                maxlength="500"
                placeholder="Explain the governance responsibility being authorized"
                class="mt-1 w-full rounded-lg border p-3"
              ></textarea></label
            ><button
              type="submit"
              [disabled]="busy() || !email"
              class="mt-3 rounded-lg bg-brand-700 px-4 py-3 font-bold text-white"
            >
              {{ busy() ? 'Authorizing…' : 'Authorize user' }}
            </button>
          </form>
        }
        <div class="mt-5 grid gap-4">
          @for (a of authorizations(); track a.reference) {
            <article class="rounded-xl border bg-white p-5">
              <div class="flex justify-between">
                <div>
                  <strong>{{ a.user.displayName }}</strong>
                  <p>{{ a.user.email }}</p>
                  <p class="text-sm">{{ a.reference }}</p>
                </div>
                <strong>{{ label(a.status) }}</strong>
              </div>
              @if (isAdmin() && a.status === 'AUTHORIZED') {
                <button
                  type="button"
                  (click)="disable(a)"
                  [disabled]="busy() || !disableReason.trim()"
                  class="mt-3 font-bold text-red-800 underline"
                >
                  Disable authorization
                </button>
              }
            </article>
          }
        </div>
      </section>
    }
  </main>`,
})
export class GuidedSelfCheckGovernancePageComponent {
  private api = inject(GuidedSelfCheckGovernanceApiService);
  private auth = inject(AuthStateService);
  rulesets = signal<RulesetSummary[]>([]);
  authorizations = signal<GovernanceAuthorization[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  view: 'rulesets' | 'authorizations' = 'rulesets';
  statuses: GovernanceStatus[] = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'READY', 'RETIRED'];
  status: GovernanceStatus | '' = '';
  active = '';
  page = 1;
  limit = 20;
  total = 0;
  email = '';
  reason = '';
  disableReason = '';
  constructor() {
    this.load();
  }
  isAdmin() {
    return this.auth.currentUser()?.roles.includes('ADMIN') ?? false;
  }
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
  pages() {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }
  go(p: number) {
    if (p < 1 || p > this.pages()) return;
    this.page = p;
    this.load();
  }
  openAuthorizations() {
    this.view = 'authorizations';
    this.loadAuthorizations();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api
      .rulesets({
        status: this.status || undefined,
        isActive: this.active === '' ? undefined : this.active === 'true',
        page: this.page,
        limit: this.limit,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.rulesets.set(r.items);
          this.total = r.total;
          this.page = r.page;
          this.limit = r.limit;
        },
        error: (e) =>
          this.error.set(
            e.status === 403
              ? 'Your account does not have active Self-Check clinical-governance authorization.'
              : 'Clinical rulesets could not be loaded.',
          ),
      });
  }
  loadAuthorizations() {
    this.loading.set(true);
    this.api
      .authorizations({ page: 1, limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => this.authorizations.set(r.items),
        error: () => this.error.set('Governance authorizations could not be loaded.'),
      });
  }
  authorize() {
    this.busy.set(true);
    this.api
      .authorize(this.email, this.reason || undefined)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.email = '';
          this.reason = '';
          this.loadAuthorizations();
        },
        error: () => this.error.set('The governance authorization could not be created.'),
      });
  }
  disable(a: GovernanceAuthorization) {
    if (!this.disableReason.trim()) return;
    if (
      !confirm('Disable this governance authorization? Historical approvals will remain unchanged.')
    )
      return;
    this.busy.set(true);
    this.api
      .disableAuthorization(a.reference, this.disableReason)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.disableReason = '';
          this.loadAuthorizations();
        },
        error: () => this.error.set('The governance authorization could not be disabled.'),
      });
  }
}
