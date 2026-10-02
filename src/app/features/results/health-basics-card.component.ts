import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import {
  BLOOD_GROUPS,
  BloodGroup,
  GENOTYPES,
  Genotype,
  PatientHealthBasics,
} from '../../core/models/health-basics.model';
import { HealthBasicsApiService } from '../../core/services/health-basics-api.service';
import { ServiceCatalogueApiService } from '../../core/services/service-catalogue-api.service';
import { HelpOptionsComponent } from '../../shared/components/help-options/help-options.component';
import { formatMinor } from '../provider/care-money';

const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{6,29}$/;

/** "My health basics" on the Me page: view, then edit in place. */
@Component({
  selector: 'app-health-basics-card',
  imports: [ReactiveFormsModule, RouterLink, HelpOptionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sc-card p-5 sm:p-6" aria-labelledby="health-basics-heading">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="health-basics-heading" class="font-display text-xl font-semibold text-ink">My health basics</h2>
          <p class="mt-1 text-sm text-ink-muted">Shown on your SmartClinic card, so staff can help you faster. You add these yourself — they are not clinically verified.</p>
        </div>
        @if (!editing() && !loading() && !loadError()) {
          <button type="button" (click)="startEditing()" class="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-sand-50">
            {{ isEmpty() ? 'Add details' : 'Edit' }}
          </button>
        }
      </div>

      @if (loading()) {
        <p role="status" class="mt-4 text-sm text-ink-muted">Loading your health basics…</p>
      } @else if (loadError()) {
        <p role="alert" class="mt-4 text-sm text-clay-700">Your health basics are unavailable right now.</p>
      } @else if (editing()) {
        <form [formGroup]="form" (ngSubmit)="save()" class="mt-5 grid gap-4 sm:grid-cols-2" novalidate>
          <label class="text-sm font-medium text-ink-soft">Blood group
            <select formControlName="bloodGroup" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink">
              <option value="">I don’t know</option>
              @for (group of bloodGroups; track group) { <option [value]="group">{{ group }}</option> }
            </select>
          </label>
          <label class="text-sm font-medium text-ink-soft">Genotype
            <select formControlName="genotype" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink">
              <option value="">I don’t know</option>
              @for (genotype of genotypes; track genotype) { <option [value]="genotype">{{ genotype }}</option> }
            </select>
          </label>
          <label class="text-sm font-medium text-ink-soft sm:col-span-2">Allergies
            <input formControlName="allergies" maxlength="500" placeholder="e.g. Penicillin, peanuts — or type None" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
          </label>
          <label class="text-sm font-medium text-ink-soft sm:col-span-2">Ongoing conditions
            <input formControlName="conditions" maxlength="500" placeholder="e.g. Asthma, hypertension — or leave blank" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
          </label>
          <fieldset class="grid gap-4 sm:col-span-2 sm:grid-cols-3">
            <legend class="mb-1 text-sm font-semibold text-ink">Emergency contact</legend>
            <label class="text-sm font-medium text-ink-soft">Name
              <input formControlName="emergencyContactName" maxlength="120" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
            </label>
            <label class="text-sm font-medium text-ink-soft">Phone
              <input formControlName="emergencyContactPhone" type="tel" placeholder="+234…" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
              @if (form.controls.emergencyContactPhone.invalid && form.controls.emergencyContactPhone.touched) {
                <span class="mt-1 block text-xs font-semibold text-clay-700">Enter a valid phone number.</span>
              }
            </label>
            <label class="text-sm font-medium text-ink-soft">Relationship
              <input formControlName="emergencyContactRelationship" maxlength="60" placeholder="e.g. Sister" class="mt-1 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-ink" />
            </label>
          </fieldset>
          @if (saveError()) { <p role="alert" class="text-sm font-semibold text-clay-700 sm:col-span-2">{{ saveError() }}</p> }
          <div class="flex gap-2 sm:col-span-2">
            <button type="submit" [disabled]="form.invalid || saving()" class="min-h-11 rounded-full bg-ink px-6 font-semibold text-white hover:bg-brand-900 disabled:opacity-50">{{ saving() ? 'Saving…' : 'Save' }}</button>
            <button type="button" (click)="editing.set(false)" class="min-h-11 rounded-full px-4 font-semibold text-ink-soft hover:bg-sand-50">Cancel</button>
          </div>
        </form>
      } @else if (basics(); as b) {
        <dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4" data-health-basics>
          <div><dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Blood group</dt><dd class="mt-1 font-display text-2xl font-semibold text-ink">{{ b.bloodGroup ?? '—' }}</dd></div>
          <div><dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Genotype</dt><dd class="mt-1 font-display text-2xl font-semibold text-ink">{{ b.genotype ?? '—' }}</dd></div>
          <div class="col-span-2"><dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Allergies</dt><dd class="mt-1 font-semibold text-ink">{{ b.allergies ?? 'None added' }}</dd></div>
          <div class="col-span-2"><dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Ongoing conditions</dt><dd class="mt-1 font-semibold text-ink">{{ b.conditions ?? 'None added' }}</dd></div>
          <div class="col-span-2"><dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">Emergency contact</dt>
            <dd class="mt-1 font-semibold text-ink">
              @if (b.emergencyContactName || b.emergencyContactPhone) {
                {{ b.emergencyContactName ?? 'Contact' }}@if (b.emergencyContactRelationship) { <span class="font-normal text-ink-muted"> ({{ b.emergencyContactRelationship }})</span> }
                @if (b.emergencyContactPhone) { · <a [href]="'tel:' + b.emergencyContactPhone" class="text-brand-700 underline underline-offset-2">{{ b.emergencyContactPhone }}</a> }
              } @else { None added }
            </dd>
          </div>
        </dl>
        @if (missingNumbers(); as missing) {
          <div class="mt-5 rounded-2xl bg-ochre-50 p-4 sm:p-5" data-know-your-numbers>
            <p class="font-semibold text-ink">Don’t know your {{ missing }}? Find out once, keep it for life.</p>
            <p class="mt-1 text-sm text-ink-soft">
              It matters in an emergency, before surgery or a transfusion, and when planning a family. It’s a quick blood test.
              @if (testPrice(); as price) { <span class="font-semibold text-ink">Standard price: {{ price }}.</span> }
            </p>
            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <a routerLink="/me/request-care" [queryParams]="testLink('HOME_VISIT')" class="flex min-h-12 items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-ink/[0.08] hover:ring-brand-300" data-test-at-home>
                <span aria-hidden="true" class="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>
                </span>
                <span><span class="block font-semibold text-ink">Get tested at home</span><span class="block text-xs text-ink-muted">A trained person comes to you</span></span>
              </a>
              <a routerLink="/me/request-care" [queryParams]="testLink('IN_PERSON')" class="flex min-h-12 items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-ink/[0.08] hover:ring-brand-300" data-test-at-lab>
                <span aria-hidden="true" class="grid size-9 shrink-0 place-items-center rounded-full bg-leaf-50 text-leaf-700">
                  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6"/><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/></svg>
                </span>
                <span><span class="block font-semibold text-ink">Go to a lab near you</span><span class="block text-xs text-ink-muted">Pick a place and time</span></span>
              </a>
            </div>
            <p class="mt-3 text-xs text-ink-muted">When your result is ready, add it here — or your lab can add it for you. Already know? <button type="button" (click)="startEditing()" class="font-semibold text-brand-700 underline underline-offset-2">Add it now</button>.</p>
            <div class="mt-4">
              <app-help-options topic="TEST_OR_RESULTS" title="Rather arrange it by phone?" hint="Call or WhatsApp us, or leave your number and we’ll book the test with you." />
            </div>
          </div>
        }
      }
    </section>
  `,
})
export class HealthBasicsCardComponent {
  private readonly api = inject(HealthBasicsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly catalogue = inject(ServiceCatalogueApiService);

  readonly bloodGroups = BLOOD_GROUPS;
  readonly genotypes = GENOTYPES;
  readonly basics = signal<PatientHealthBasics | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly form = this.fb.nonNullable.group({
    bloodGroup: this.fb.nonNullable.control<BloodGroup | ''>(''),
    genotype: this.fb.nonNullable.control<Genotype | ''>(''),
    allergies: ['', Validators.maxLength(500)],
    conditions: ['', Validators.maxLength(500)],
    emergencyContactName: ['', Validators.maxLength(120)],
    emergencyContactPhone: ['', Validators.pattern(PHONE_PATTERN)],
    emergencyContactRelationship: ['', Validators.maxLength(60)],
  });

  /** Standard catalogue prices, so people know roughly what it costs before asking. */
  private readonly labPrices = signal<readonly { code: string; minor: number; currency: string }[]>([]);
  readonly testPrice = computed(() => {
    const b = this.basics();
    const wanted = [!b?.bloodGroup && 'LAB_BLOOD_GROUP', !b?.genotype && 'LAB_GENOTYPE'].filter(Boolean);
    const prices = this.labPrices().filter((p) => wanted.includes(p.code));
    if (!prices.length || prices.length !== wanted.length || new Set(prices.map((p) => p.currency)).size !== 1) return null;
    return formatMinor(prices.reduce((sum, p) => sum + p.minor, 0), prices[0].currency) + (prices.length > 1 ? ' for both' : '');
  });

  /** "blood group and genotype", "genotype", … or null when both are known. */
  readonly missingNumbers = computed(() => {
    const b = this.basics();
    const missing = [!b?.bloodGroup && 'blood group', !b?.genotype && 'genotype'].filter(Boolean);
    return missing.length ? missing.join(' and ') : null;
  });

  constructor() {
    this.api
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (value) => {
          this.basics.set(value);
          if (this.missingNumbers()) this.loadLabPrices();
        },
        error: () => this.loadError.set(true),
      });
  }

  /** No health details in the link: only which test and where. */
  testLink(mode: 'HOME_VISIT' | 'IN_PERSON') {
    return { serviceCode: 'LAB_REQUEST', topic: 'blood-group-genotype', mode };
  }

  private loadLabPrices(): void {
    this.catalogue
      .list('LAB_TEST')
      .pipe(catchError(() => of([])))
      .subscribe((items) => {
        this.labPrices.set(
          items
            .filter((i) => i.code === 'LAB_BLOOD_GROUP' || i.code === 'LAB_GENOTYPE')
            .map((i) => ({ code: i.code, minor: i.standardPriceMinor, currency: i.currency })),
        );
      });
  }

  isEmpty(): boolean {
    const b = this.basics();
    return !b || (!b.bloodGroup && !b.genotype && !b.allergies && !b.conditions && !b.emergencyContactName && !b.emergencyContactPhone);
  }

  startEditing(): void {
    const b = this.basics();
    this.form.reset({
      bloodGroup: b?.bloodGroup ?? '',
      genotype: b?.genotype ?? '',
      allergies: b?.allergies ?? '',
      conditions: b?.conditions ?? '',
      emergencyContactName: b?.emergencyContactName ?? '',
      emergencyContactPhone: b?.emergencyContactPhone ?? '',
      emergencyContactRelationship: b?.emergencyContactRelationship ?? '',
    });
    this.saveError.set('');
    this.editing.set(true);
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    const value = this.form.getRawValue();
    const blankToNull = (text: string) => text.trim() || null;
    this.saving.set(true);
    this.saveError.set('');
    this.api
      .update({
        bloodGroup: value.bloodGroup || null,
        genotype: value.genotype || null,
        allergies: blankToNull(value.allergies),
        conditions: blankToNull(value.conditions),
        emergencyContactName: blankToNull(value.emergencyContactName),
        emergencyContactPhone: blankToNull(value.emergencyContactPhone),
        emergencyContactRelationship: blankToNull(value.emergencyContactRelationship),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (saved) => {
          this.basics.set(saved);
          this.editing.set(false);
        },
        error: () => this.saveError.set('We could not save your health basics. Check the details and try again.'),
      });
  }
}
