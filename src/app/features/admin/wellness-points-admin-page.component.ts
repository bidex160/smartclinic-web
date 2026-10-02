import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  AdminWellnessApiService,
  WellnessPatient,
  WellnessRedemptionRow,
  WellnessRedemptionStatus,
  WellnessSummary,
} from '../../core/services/admin-wellness-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

const STATUS_LABEL: Record<WellnessRedemptionStatus, string> = {
  RESERVED: 'Held for checkout',
  SETTLED: 'Used',
  RELEASED: 'Removed before paying',
  CANCELLED: 'Booking cancelled',
  REFUNDED: 'Given back',
};
const CURRENCIES = ['NGN', 'GHS', 'RWF'] as const;

/** Staff page: is redemption on, what it's worth, how points are being used, and one patient's balance. */
@Component({
  selector: 'app-wellness-points-admin-page',
  imports: [DatePipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <h1 class="font-display text-3xl font-semibold text-ink">Wellness points</h1>
      <p class="mt-1 max-w-3xl text-ink-soft">
        Patients earn points for healthy habits and can use them for part of a Smart Health Check. Points are not cash.
        Cancelling a paid Health Check gives the points back automatically.
      </p>

      @if (error()) {
        <p role="alert" class="mt-5 rounded-xl bg-clay-50 p-4 text-clay-700">{{ error() }}</p>
      }

      @if (summary(); as s) {
        <section class="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr]" aria-label="Settings and usage">
          <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.07]" data-wellness-settings>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-semibold text-ink">Settings</h2>
              <span class="rounded-full px-3 py-1 text-sm font-semibold {{ s.settings.paused ? 'bg-clay-50 text-clay-700' : 'bg-leaf-50 text-leaf-700' }}" data-wellness-state>
                {{ s.settings.paused ? 'Paused — patients can’t use points' : 'On — patients can use points' }}
              </span>
            </div>
            @if (canEdit()) {
              <button type="button" (click)="togglePause(s.settings.paused)" [disabled]="saving()"
                class="mt-4 min-h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-60 {{ s.settings.paused ? 'bg-leaf-700 text-white' : 'border border-clay-300 text-clay-700' }}" data-wellness-pause>
                {{ s.settings.paused ? 'Turn points back on' : 'Pause points' }}
              </button>
            }
            <fieldset class="mt-5 grid min-w-0 grid-cols-3 gap-3" [disabled]="!canEdit()">
              <legend class="mb-1 text-sm font-semibold text-ink">Value of one point</legend>
              @for (c of currencies; track c) {
                <label class="grid min-w-0 gap-1 text-sm text-ink-soft">{{ c }}
                  <input [formControlName]="c" inputmode="decimal" class="min-h-11 w-full min-w-0 rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                </label>
              }
            </fieldset>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 text-sm text-ink-soft">Most of a Health Check points can pay (%)
                <input formControlName="maxPercent" type="number" min="0" max="50" [readonly]="!canEdit()" class="min-h-11 rounded-xl border border-ink/15 bg-white px-3 text-ink" />
              </label>
              <label class="grid gap-1 text-sm text-ink-soft">Fewest points a patient can use
                <input formControlName="minPoints" type="number" min="1" max="10000" [readonly]="!canEdit()" class="min-h-11 rounded-xl border border-ink/15 bg-white px-3 text-ink" />
              </label>
            </div>
            <p class="mt-3 text-sm text-ink-muted">Example: {{ example() }}</p>
            @if (canEdit()) {
              <button type="submit" [disabled]="settingsForm.invalid || saving()" class="mt-4 min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60">
                {{ saving() ? 'Saving…' : 'Save settings' }}
              </button>
            } @else {
              <p class="mt-4 text-sm text-ink-muted">Only admins can change these settings.</p>
            }
            @if (settingsSaved()) { <p role="status" class="mt-3 text-sm font-semibold text-leaf-700">Saved. Changes reach patients within a minute.</p> }
          </form>

          <div class="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.07]">
            <h2 class="text-lg font-semibold text-ink">How points are being used</h2>
            @if (!s.redemptions.length) {
              <p class="mt-3 text-ink-soft">No one has used wellness points yet.</p>
            } @else {
              <div class="mt-3 overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="text-ink-muted"><tr><th class="py-2 pr-3 font-semibold">Status</th><th class="py-2 pr-3 font-semibold">Health Checks</th><th class="py-2 pr-3 font-semibold">Points</th><th class="py-2 font-semibold">Value</th></tr></thead>
                  <tbody class="tabular-nums">
                    @for (r of s.redemptions; track r.status + r.currency) {
                      <tr class="border-t border-ink/[0.06]"><td class="py-2 pr-3">{{ statusLabel(r.status) }}</td><td class="py-2 pr-3">{{ r.count }}</td><td class="py-2 pr-3">{{ r.points }}</td><td class="py-2">{{ r.currency }} {{ r.amount }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            <p class="mt-4 text-sm text-ink-soft">Staff adjustments: {{ s.adjustments.count }} · {{ s.adjustments.pointsAdded }} added · {{ s.adjustments.pointsRemoved }} removed</p>
          </div>
        </section>
      } @else if (!error()) {
        <p role="status" class="mt-6 text-ink-soft">Loading…</p>
      }

      <section class="mt-8 rounded-2xl bg-white p-5 ring-1 ring-ink/[0.07]" aria-labelledby="find-patient">
        <h2 id="find-patient" class="text-lg font-semibold text-ink">Find a patient</h2>
        <form (ngSubmit)="findPatient()" [formGroup]="findForm" class="mt-3 flex flex-wrap gap-2">
          <label class="sr-only" for="patient-ref">SmartClinic ID</label>
          <input id="patient-ref" formControlName="reference" placeholder="SCP-AB12-CD34" autocomplete="off" class="min-h-11 w-56 rounded-xl border border-ink/15 bg-white px-3 font-mono uppercase text-ink" />
          <button type="submit" [disabled]="findForm.invalid || finding()" class="min-h-11 rounded-full bg-brand-700 px-5 text-sm font-semibold text-white disabled:opacity-60">{{ finding() ? 'Looking…' : 'Look up' }}</button>
        </form>
        @if (patientError()) { <p role="alert" class="mt-3 text-sm font-semibold text-clay-700">{{ patientError() }}</p> }

        @if (patient(); as p) {
          <div class="mt-5" data-wellness-patient>
            <p class="font-semibold text-ink">{{ p.name }} <span class="font-mono text-sm text-ink-muted">{{ p.patientReference }}</span></p>
            <dl class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 tabular-nums">
              <div class="rounded-xl bg-sand-50 p-3"><dt class="text-xs text-ink-muted">Earned</dt><dd class="text-xl font-semibold">{{ p.wallet.earnedPoints }}</dd></div>
              <div class="rounded-xl bg-sand-50 p-3"><dt class="text-xs text-ink-muted">Staff adjustments</dt><dd class="text-xl font-semibold">{{ p.wallet.adjustedPoints > 0 ? '+' : '' }}{{ p.wallet.adjustedPoints }}</dd></div>
              <div class="rounded-xl bg-sand-50 p-3"><dt class="text-xs text-ink-muted">Used or held</dt><dd class="text-xl font-semibold">{{ p.wallet.usedPoints }}</dd></div>
              <div class="rounded-xl bg-leaf-50 p-3"><dt class="text-xs text-leaf-700">Can spend</dt><dd class="text-xl font-semibold text-leaf-700" data-available>{{ p.wallet.availablePoints }}</dd></div>
            </dl>

            @if (canEdit()) {
              <form [formGroup]="adjustForm" (ngSubmit)="adjust()" class="mt-5 grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end" data-wellness-adjust>
                <label class="grid gap-1 text-sm text-ink-soft">Points (+ add, − remove)
                  <input formControlName="points" type="number" step="1" class="min-h-11 rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                </label>
                <label class="grid gap-1 text-sm text-ink-soft">Reason (the patient’s record keeps this)
                  <input formControlName="reason" maxlength="300" placeholder="e.g. Goodwill after a missed home visit" class="min-h-11 rounded-xl border border-ink/15 bg-white px-3 text-ink" />
                </label>
                <button type="submit" [disabled]="adjustForm.invalid || adjusting()" class="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60">{{ adjusting() ? 'Saving…' : 'Save change' }}</button>
              </form>
            }

            <div class="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <h3 class="font-semibold text-ink">Adjustments</h3>
                @if (!p.adjustments.length) { <p class="mt-2 text-sm text-ink-muted">None.</p> }
                <ul class="mt-2 grid gap-2">
                  @for (a of p.adjustments; track a.createdAt) {
                    <li class="rounded-xl bg-sand-50 p-3 text-sm"><strong class="tabular-nums {{ a.points > 0 ? 'text-leaf-700' : 'text-clay-700' }}">{{ a.points > 0 ? '+' : '' }}{{ a.points }}</strong> · {{ a.reason }}<br /><span class="text-xs text-ink-muted">{{ a.by ?? 'Staff' }} · {{ a.createdAt | date: 'd MMM y, HH:mm' }}</span></li>
                  }
                </ul>
              </div>
              <div>
                <h3 class="font-semibold text-ink">Used on Health Checks</h3>
                @if (!p.redemptions.length) { <p class="mt-2 text-sm text-ink-muted">None.</p> }
                <ul class="mt-2 grid gap-2">
                  @for (r of p.redemptions; track r.bookingReference + r.createdAt) {
                    <li class="rounded-xl bg-sand-50 p-3 text-sm tabular-nums">{{ r.points }} points · {{ r.currency }} {{ r.amount }} · {{ statusLabel(r.status) }}<br /><span class="font-mono text-xs text-ink-muted">{{ r.bookingReference }} · {{ r.createdAt | date: 'd MMM y' }}</span></li>
                  }
                </ul>
              </div>
            </div>
          </div>
        }
      </section>

      <section class="mt-8" aria-labelledby="recent">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent" class="text-lg font-semibold text-ink">Recent Health Checks paid with points</h2>
          <label class="text-sm text-ink-soft">Show
            <select (change)="filter($any($event.target).value)" class="ml-2 min-h-10 rounded-xl border border-ink/15 bg-white px-3 text-ink">
              <option value="">All</option>
              @for (s of statuses; track s) { <option [value]="s">{{ statusLabel(s) }}</option> }
            </select>
          </label>
        </div>
        @if (!rows().length) {
          <p class="mt-3 rounded-2xl bg-white p-5 text-ink-soft ring-1 ring-ink/[0.06]">Nothing here yet.</p>
        } @else {
          <div class="mt-3 overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/[0.06]">
            <table class="w-full min-w-[40rem] text-left text-sm">
              <thead class="text-ink-muted"><tr><th class="px-4 py-3 font-semibold">Booking</th><th class="px-4 py-3 font-semibold">Patient</th><th class="px-4 py-3 font-semibold">Points</th><th class="px-4 py-3 font-semibold">Value</th><th class="px-4 py-3 font-semibold">Status</th><th class="px-4 py-3 font-semibold">Date</th></tr></thead>
              <tbody class="tabular-nums">
                @for (r of rows(); track r.bookingReference + r.createdAt) {
                  <tr class="border-t border-ink/[0.06]"><td class="px-4 py-3 font-mono text-xs">{{ r.bookingReference }}</td><td class="px-4 py-3">{{ r.patientName ?? '—' }}</td><td class="px-4 py-3">{{ r.points }}</td><td class="px-4 py-3">{{ r.currency }} {{ r.amount }}</td><td class="px-4 py-3">{{ statusLabel(r.status) }}</td><td class="px-4 py-3">{{ r.createdAt | date: 'd MMM y' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </main>
  `,
})
export class WellnessPointsAdminPageComponent {
  private readonly api = inject(AdminWellnessApiService);
  private readonly auth = inject(AuthStateService);
  private readonly fb = inject(FormBuilder);

  readonly currencies = CURRENCIES;
  readonly statuses = Object.keys(STATUS_LABEL) as WellnessRedemptionStatus[];
  readonly summary = signal<WellnessSummary | null>(null);
  readonly rows = signal<readonly WellnessRedemptionRow[]>([]);
  readonly patient = signal<WellnessPatient | null>(null);
  readonly error = signal('');
  readonly patientError = signal('');
  readonly saving = signal(false);
  readonly settingsSaved = signal(false);
  readonly finding = signal(false);
  readonly adjusting = signal(false);
  /** Operations staff can look; only admins change things. */
  readonly canEdit = computed(() => this.auth.currentUser()?.roles?.includes('ADMIN') ?? false);

  readonly settingsForm = this.fb.nonNullable.group({
    NGN: ['', Validators.pattern(/^\d{1,4}(\.\d{1,2})?$/)],
    GHS: ['', Validators.pattern(/^\d{1,4}(\.\d{1,2})?$/)],
    RWF: ['', Validators.pattern(/^\d{1,4}(\.\d{1,2})?$/)],
    maxPercent: [20, [Validators.required, Validators.min(0), Validators.max(50)]],
    minPoints: [100, [Validators.required, Validators.min(1), Validators.max(10000)]],
  });
  readonly findForm = this.fb.nonNullable.group({ reference: ['', [Validators.required, Validators.pattern(/^\s*SCP-[A-Z0-9]{4}-[A-Z0-9]{4}\s*$/i)]] });
  readonly adjustForm = this.fb.nonNullable.group({
    points: [0, [Validators.required, Validators.min(-10000), Validators.max(10000), Validators.pattern(/^-?[1-9]\d*$/)]],
    reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
  });

  constructor() {
    this.loadSummary();
    this.filter('');
  }

  example(): string {
    const v = this.settingsForm.getRawValue();
    const ngn = Number(v.NGN || 0);
    return ngn ? `100 points = ₦${(ngn * 100).toLocaleString('en-NG')}; on a ₦10,000 Health Check points can pay up to ₦${((10000 * v.maxPercent) / 100).toLocaleString('en-NG')}.` : '—';
  }

  statusLabel(s: WellnessRedemptionStatus): string {
    return STATUS_LABEL[s] ?? s;
  }

  loadSummary(): void {
    this.api.summary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.settingsForm.reset({
          NGN: s.settings.valuePerPoint['NGN'] ?? '',
          GHS: s.settings.valuePerPoint['GHS'] ?? '',
          RWF: s.settings.valuePerPoint['RWF'] ?? '',
          maxPercent: s.settings.maxPercent,
          minPoints: s.settings.minPoints,
        });
      },
      error: () => this.error.set('Wellness points couldn’t load. Refresh to try again.'),
    });
  }

  filter(status: WellnessRedemptionStatus | ''): void {
    this.api.redemptions(status).subscribe({ next: (page) => this.rows.set(page.items), error: () => this.rows.set([]) });
  }

  togglePause(paused: boolean): void {
    this.patchSettings({ paused: !paused });
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) return;
    const v = this.settingsForm.getRawValue();
    const valuePerPoint: Record<string, string> = {};
    for (const c of CURRENCIES) if (v[c]) valuePerPoint[c] = v[c];
    this.patchSettings({ maxPercent: Number(v.maxPercent), minPoints: Number(v.minPoints), valuePerPoint });
  }

  findPatient(): void {
    if (this.findForm.invalid) return;
    this.patientError.set('');
    this.finding.set(true);
    this.api
      .patient(this.findForm.getRawValue().reference.trim().toUpperCase())
      .pipe(finalize(() => this.finding.set(false)))
      .subscribe({
        next: (p) => this.patient.set(p),
        error: (e: HttpErrorResponse) => {
          this.patient.set(null);
          this.patientError.set(this.messageFrom(e, 'No patient with that SmartClinic ID.'));
        },
      });
  }

  adjust(): void {
    const p = this.patient();
    if (!p || this.adjustForm.invalid) return;
    const v = this.adjustForm.getRawValue();
    this.adjusting.set(true);
    this.patientError.set('');
    this.api
      .adjust(p.patientReference, Number(v.points), v.reason.trim())
      .pipe(finalize(() => this.adjusting.set(false)))
      .subscribe({
        next: (updated) => {
          this.patient.set(updated);
          this.adjustForm.reset({ points: 0, reason: '' });
          this.loadSummary();
        },
        error: (e: HttpErrorResponse) => this.patientError.set(this.messageFrom(e, 'That change didn’t save. Try again.')),
      });
  }

  private patchSettings(patch: Parameters<AdminWellnessApiService['updateSettings']>[0]): void {
    this.saving.set(true);
    this.settingsSaved.set(false);
    this.error.set('');
    this.api
      .updateSettings(patch)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.settingsSaved.set(true);
          this.loadSummary();
        },
        error: (e: HttpErrorResponse) => this.error.set(this.messageFrom(e, 'Settings didn’t save. Try again.')),
      });
  }

  private messageFrom(e: HttpErrorResponse, fallback: string): string {
    const m = e.error?.message;
    return typeof m === 'string' ? m : Array.isArray(m) ? m.join(' ') : fallback;
  }
}
