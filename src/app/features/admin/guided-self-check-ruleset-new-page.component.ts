import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  GovernanceMetadata,
  MessageKeys,
} from '../../core/models/guided-self-check-governance.model';
import { GuidedSelfCheckGovernanceApiService } from '../../core/services/guided-self-check-governance-api.service';
@Component({
  selector: 'app-guided-self-check-ruleset-new-page',
  imports: [FormsModule, RouterLink],
  template: `<main class="mx-auto max-w-3xl px-5 py-8">
    <a routerLink=".." class="font-bold text-brand-700">← Clinical Governance</a>
    <h1 class="mt-5 text-3xl font-bold">Create Draft Ruleset</h1>
    <p class="mt-2 text-slate-600">
      Create an empty governed draft. No clinical rules or thresholds are seeded.
    </p>
    @if (loading()) {
      <p role="status" class="mt-5">Loading governance metadata…</p>
    } @else if (error()) {
      <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4">{{ error() }}</p>
    } @else if (metadata(); as m) {
      <form (ngSubmit)="create()" class="mt-6 space-y-5 rounded-2xl border bg-white p-6">
        <label class="block font-semibold"
          >Questionnaire version<select
            [(ngModel)]="version"
            name="version"
            required
            class="mt-1 w-full rounded-lg border p-3"
          >
            @for (v of m.questionnaireVersions; track v.version) {
              <option [ngValue]="v.version">
                Version {{ v.version }}{{ v.isActive ? ' · Active questionnaire' : '' }}
              </option>
            }
          </select></label
        ><label class="block font-semibold"
          >Ruleset name<input
            [(ngModel)]="name"
            name="name"
            required
            [maxlength]="m.validationLimits.rulesetNameMaxLength"
            placeholder="Guided Self-Check V1 clinical rules"
            class="mt-1 w-full rounded-lg border p-3" /></label
        ><label class="block font-semibold"
          >Description (optional)<textarea
            [(ngModel)]="description"
            name="description"
            [maxlength]="m.validationLimits.rulesetDescriptionMaxLength"
            placeholder="Describe the clinical governance purpose of this ruleset"
            class="mt-1 w-full rounded-lg border p-3"
          ></textarea>
        </label>
        <fieldset>
          <legend class="font-bold">Approved patient message mapping</legend>
          <p class="text-sm text-slate-600">
            Select only messages supplied by the authoritative governance catalogue.
          </p>
          @for (category of categories; track category) {
            <label class="mt-3 block font-semibold"
              >{{ category }} message<select
                [(ngModel)]="keys[lower(category)]"
                [name]="lower(category)"
                required
                class="mt-1 w-full rounded-lg border p-3"
              >
                @for (msg of m.patientMessages; track msg.key) {
                  <option [value]="msg.key">{{ msg.title }} · {{ msg.key }}</option>
                }
              </select></label
            >
          }
        </fieldset>
        <button
          type="submit"
          [disabled]="saving() || !name || !version"
          class="rounded-lg bg-brand-700 px-5 py-3 font-bold text-white"
        >
          {{ saving() ? 'Creating…' : 'Create Draft Ruleset' }}
        </button>
      </form>
    }
  </main>`,
})
export class GuidedSelfCheckRulesetNewPageComponent {
  private api = inject(GuidedSelfCheckGovernanceApiService);
  private router = inject(Router);
  metadata = signal<GovernanceMetadata | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  version = 0;
  name = '';
  description = '';
  categories = ['GREEN', 'AMBER', 'RED'] as const;
  keys: MessageKeys = { green: '', amber: '', red: '' };
  constructor() {
    this.api
      .metadata()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (m) => {
          this.metadata.set(m);
          this.version = m.questionnaireVersions[0]?.version ?? 0;
          const find = (category: string) =>
            m.patientMessages.find((x) => x.key.includes(category))?.key ?? '';
          this.keys = { green: find('GREEN'), amber: find('AMBER'), red: find('RED') };
        },
        error: (e) =>
          this.error.set(
            e.status === 403
              ? 'Active clinical-governance authorization is required.'
              : 'Governance metadata could not be loaded.',
          ),
      });
  }
  lower(v: string) {
    return v.toLowerCase() as keyof MessageKeys;
  }
  create() {
    this.saving.set(true);
    this.api
      .create({
        questionnaireVersion: this.version,
        name: this.name,
        ...(this.description.trim() && { description: this.description.trim() }),
        rules: [],
        patientMessageKeys: this.keys,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (r) =>
          this.router.navigate(['/admin/guided-self-check/governance/rulesets', r.reference]),
        error: () => this.error.set('The Draft ruleset could not be created.'),
      });
  }
}
