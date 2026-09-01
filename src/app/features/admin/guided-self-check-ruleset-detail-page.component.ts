import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, Observable } from 'rxjs';
import {
  ClinicalRule,
  GovernanceMetadata,
  QuestionnaireMetadata,
  QuestionnaireQuestion,
  RulesetDetail,
  SimulationAnswer,
  SimulationResult,
  ValidationResult,
} from '../../core/models/guided-self-check-governance.model';
import { GuidedSelfCheckGovernanceApiService } from '../../core/services/guided-self-check-governance-api.service';
import { GovernanceConditionBuilderComponent } from './governance-condition-builder.component';
import { GovernanceConditionViewComponent } from './governance-condition-view.component';
@Component({
  selector: 'app-guided-self-check-ruleset-detail-page',
  imports: [
    FormsModule,
    RouterLink,
    NgTemplateOutlet,
    GovernanceConditionBuilderComponent,
    GovernanceConditionViewComponent,
  ],
  template: `<main class="mx-auto max-w-6xl px-5 py-8">
    <a routerLink="/admin/guided-self-check/governance" class="font-bold text-brand-700"
      >← Clinical Governance</a
    >
    @if (loading()) {
      <p role="status" class="mt-5">Loading governed ruleset…</p>
    } @else if (error()) {
      <div role="alert" class="mt-5 rounded-xl bg-red-50 p-5">
        <p>{{ error() }}</p>
        <button type="button" (click)="load()" class="mt-2 font-bold underline">
          Reload authoritative ruleset
        </button>
      </div>
    } @else if (detail(); as r) {
      <header class="mt-5 rounded-2xl bg-brand-950 p-6 text-white">
        <div class="flex flex-wrap justify-between gap-3">
          <div>
            <p>{{ r.reference }} · Version {{ r.version }}</p>
            <h1 class="text-3xl font-bold">{{ r.name }}</h1>
          </div>
          <div class="text-right">
            <strong>{{ label(r.governanceStatus) }}</strong>
            <p>{{ r.isActive ? 'Active' : 'Not active' }}</p>
          </div>
        </div>
        <p class="mt-3">
          Questionnaire v{{ r.questionnaireVersion }} · {{ r.ruleCount }} /
          {{ metadata()!.validationLimits.maxRules }} rules
        </p>
      </header>
      <section class="mt-5 grid gap-4 md:grid-cols-2">
        <article class="rounded-xl border bg-white p-5">
          <h2 class="font-bold">Lifecycle readiness</h2>
          <p>Status Ready: {{ yes(r.readiness.statusReady) }}</p>
          <p>Approval matches content: {{ yes(r.readiness.approvalHashMatches) }}</p>
          <p>Content hash valid: {{ yes(r.readiness.contentHashValid) }}</p>
          <p class="mt-2 font-bold">
            {{
              r.readiness.classificationReady
                ? 'Active for new compatible Self-Check classifications'
                : 'Not ready for classification'
            }}
          </p>
        </article>
        <article class="rounded-xl border bg-white p-5">
          <h2 class="font-bold">Content integrity</h2>
          <p>
            {{
              r.readiness.approvalHashMatches
                ? 'Approved content matches current content'
                : 'Current content is not covered by an approval hash'
            }}
          </p>
          <details class="mt-2">
            <summary>Technical hashes</summary>
            <p class="break-all text-xs">Content: {{ r.contentHash }}</p>
            <p class="break-all text-xs">Approved: {{ r.approvedContentHash || 'Not approved' }}</p>
          </details>
        </article>
      </section>
      @if (r.allowedActions.edit) {
        <section class="mt-5 rounded-2xl border bg-white p-6">
          <h2 class="text-2xl font-bold">Draft content</h2>
          <label class="mt-4 block font-semibold"
            >Ruleset name<input
              [(ngModel)]="r.name"
              [maxlength]="metadata()!.validationLimits.rulesetNameMaxLength"
              placeholder="Guided Self-Check V1 clinical rules"
              class="mt-1 w-full rounded-lg border p-3" /></label
          ><label class="mt-4 block font-semibold"
            >Description (optional)<textarea
              [(ngModel)]="r.description"
              [maxlength]="metadata()!.validationLimits.rulesetDescriptionMaxLength"
              placeholder="Describe the clinical governance purpose of this ruleset"
              class="mt-1 w-full rounded-lg border p-3"
            ></textarea>
          </label>
          <fieldset class="mt-5">
            <legend class="text-xl font-bold">Approved patient messages</legend>
            @for (category of categories; track category) {
              <label class="mt-3 block font-semibold"
                >{{ category }} message<select
                  [(ngModel)]="r.patientMessageKeys[lower(category)]"
                  class="mt-1 w-full rounded-lg border p-3"
                >
                  @for (m of metadata()!.patientMessages; track m.key) {
                    <option [value]="m.key">{{ m.title }} · {{ m.key }}</option>
                  }
                </select></label
              >
              @if (message(r.patientMessageKeys[lower(category)]); as p) {
                <p class="mt-1 text-sm">
                  <strong>{{ p.title }}</strong> — {{ p.message }}
                </p>
              }
            }
          </fieldset>
          <div class="mt-6 flex justify-between">
            <h2 class="text-xl font-bold">Clinical rules</h2>
            <button
              type="button"
              (click)="addRule()"
              [disabled]="r.rules.length >= metadata()!.validationLimits.maxRules"
              class="font-bold text-brand-700 underline"
            >
              Add rule
            </button>
          </div>
          <div class="mt-4 space-y-5">
            @for (rule of r.rules; track $index) {
              <article class="rounded-xl bg-slate-50 p-4">
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="font-semibold"
                    >Reason code<input
                      [(ngModel)]="rule.code"
                      placeholder="CLINICAL_RULE_CODE"
                      [minlength]="metadata()!.validationLimits.ruleCodeMinLength"
                      [maxlength]="metadata()!.validationLimits.ruleCodeMaxLength"
                      class="mt-1 w-full rounded-lg border p-3"
                    /><span class="block text-xs font-normal"
                      >Stable uppercase internal code; no clinical meaning is suggested.</span
                    ></label
                  ><label class="font-semibold"
                    >Severity<select
                      [(ngModel)]="rule.severity"
                      class="mt-1 w-full rounded-lg border p-3"
                    >
                      @for (s of metadata()!.severities; track s) {
                        <option [value]="s">{{ s }}</option>
                      }
                    </select></label
                  >
                </div>
                <div class="mt-4">
                  <app-governance-condition-builder
                    [condition]="rule.condition"
                    [metadata]="metadata()!"
                    [questionnaire]="questionnaire()!"
                    [removable]="false"
                  />
                </div>
                <button
                  type="button"
                  (click)="removeRule($index)"
                  class="mt-3 font-bold text-red-800 underline"
                  [attr.aria-label]="'Remove rule ' + ($index + 1)"
                >
                  Remove rule
                </button>
              </article>
            }
          </div>
          <button
            type="button"
            (click)="save()"
            [disabled]="busy()"
            class="mt-5 rounded-lg bg-brand-700 px-5 py-3 font-bold text-white"
          >
            {{ busy() ? 'Saving…' : 'Save Draft' }}
          </button>
        </section>
      } @else {
        <section class="mt-5 rounded-2xl border bg-white p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-2xl font-bold">Ruleset content</h2>
              <p class="mt-1 text-slate-600">
                Immutable governed content preserved for review and audit.
              </p>
            </div>
            @if (r.isActive) {
              <strong class="rounded-full bg-green-100 px-3 py-1 text-green-900"
                >Active for new compatible Self-Checks</strong
              >
            }
          </div>
          <dl class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-slate-600">Ruleset name</dt>
              <dd class="font-bold">{{ r.name }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-600">Questionnaire version</dt>
              <dd>Version {{ r.questionnaireVersion }}</dd>
            </div>
            @if (r.description) {
              <div class="sm:col-span-2">
                <dt class="text-sm text-slate-600">Description</dt>
                <dd class="whitespace-pre-line">{{ r.description }}</dd>
              </div>
            }
            <div>
              <dt class="text-sm text-slate-600">Total clinical rules</dt>
              <dd>{{ r.rules.length }}</dd>
            </div>
          </dl>
          <section class="mt-6">
            <h3 class="text-xl font-bold">Approved patient messages</h3>
            <div class="mt-3 grid gap-4 lg:grid-cols-3">
              @for (category of categories; track category) {
                <article class="rounded-xl bg-slate-50 p-4">
                  <strong>{{ category }}</strong>
                  <p class="mt-1 break-all text-sm">{{ r.patientMessageKeys[lower(category)] }}</p>
                  @if (message(r.patientMessageKeys[lower(category)]); as configured) {
                    <p class="mt-2 font-semibold">{{ configured.title }}</p>
                    <p class="text-sm">{{ configured.message }}</p>
                  } @else {
                    <p class="mt-2 text-sm text-slate-600">
                      Message preview is unavailable; the persisted key remains shown.
                    </p>
                  }
                </article>
              }
            </div>
          </section>
          <section class="mt-6">
            <h3 class="text-xl font-bold">Clinical rules</h3>
            @if (!r.rules.length) {
              <p class="mt-3 rounded-xl bg-slate-50 p-4">
                No clinical rules are configured in this ruleset.
              </p>
            }
            <div class="mt-4 space-y-5">
              @for (rule of r.rules; track $index) {
                <article class="rounded-2xl border bg-slate-50 p-5">
                  <div class="flex flex-wrap justify-between gap-3">
                    <div>
                      <p class="text-sm text-slate-600">Reason / rule code</p>
                      <h4 class="break-all font-bold">{{ rule.code }}</h4>
                    </div>
                    <strong>{{ rule.severity }} severity</strong>
                  </div>
                  <div class="mt-4">
                    <app-governance-condition-view
                      [condition]="rule.condition"
                      [questionnaire]="questionnaire()!"
                    />
                  </div>
                </article>
              }
            </div>
          </section>
        </section>
      }
      <section class="mt-5 rounded-2xl border bg-white p-6">
        <h2 class="text-2xl font-bold">Governance actions</h2>
        <label class="mt-4 block font-semibold"
          >Governance note (optional)<textarea
            [(ngModel)]="governanceNote"
            [maxlength]="metadata()!.validationLimits.governanceNoteMaxLength"
            placeholder="Add governance context for this action"
            class="mt-1 w-full rounded-lg border p-3"
          ></textarea
          ><span class="mt-1 block text-xs font-normal"
            >Do not include patient information.</span
          ></label
        >
        <div class="mt-4 flex flex-wrap gap-3">
          @if (r.allowedActions.validate) {
            <button
              type="button"
              (click)="validate()"
              [disabled]="busy()"
              class="rounded-lg border px-4 py-3 font-bold"
            >
              {{ busy() ? 'Working…' : 'Validate Ruleset' }}
            </button>
          }
          @if (r.allowedActions.simulate) {
            <button
              type="button"
              (click)="simulationOpen.set(!simulationOpen())"
              class="rounded-lg border px-4 py-3 font-bold"
            >
              Run Simulation
            </button>
          }
          @if (r.allowedActions.submitForReview) {
            <button
              type="button"
              (click)="transition('submit-review')"
              class="rounded-lg border px-4 py-3 font-bold"
            >
              Submit for Review
            </button>
          }
          @if (r.allowedActions.approve) {
            <button
              type="button"
              (click)="transition('approve')"
              class="rounded-lg border px-4 py-3 font-bold"
            >
              Approve
            </button>
          }
          @if (r.allowedActions.markReady) {
            <button
              type="button"
              (click)="transition('mark-ready')"
              class="rounded-lg border px-4 py-3 font-bold"
            >
              Mark Ready
            </button>
          }
          @if (r.allowedActions.activate) {
            <button
              type="button"
              (click)="transition('activate')"
              class="rounded-lg bg-brand-700 px-4 py-3 font-bold text-white"
            >
              Activate Ruleset
            </button>
          }
          @if (r.allowedActions.retire) {
            <button
              type="button"
              (click)="transition('retire')"
              class="rounded-lg border border-red-300 px-4 py-3 font-bold text-red-800"
            >
              Retire Ruleset
            </button>
          }
        </div>
        @if (validation(); as v) {
          <div
            class="mt-4 rounded-xl p-4"
            [class.bg-green-50]="v.valid"
            [class.bg-red-50]="!v.valid"
          >
            <strong>{{ v.valid ? 'Valid' : 'Needs attention' }}</strong>
            <p>{{ v.ruleCount }} rules</p>
            @for (e of v.errors; track e.path + e.code) {
              <p class="mt-2">
                <strong>{{ e.path }}</strong> · {{ e.code }} — {{ e.message }}
              </p>
            }
          </div>
        }
      </section>
      @if (simulationOpen()) {
        <section class="mt-5 rounded-2xl border bg-white p-6">
          <h2 class="text-2xl font-bold">Synthetic Simulation</h2>
          <p class="mt-2 rounded-lg bg-amber-50 p-3">
            Simulation evaluates synthetic answers. It does not create a patient Self-Check,
            classification, review, contact task, or care record.
          </p>
          <div class="mt-4 space-y-4">
            @for (a of answers; track a.questionKey) {
              @if (question(a.questionKey); as q) {
                <article class="rounded-xl border p-4">
                  <div class="flex justify-between">
                    <strong>{{ q.text }}</strong
                    ><button
                      type="button"
                      (click)="removeAnswer($index)"
                      class="text-red-800 underline"
                    >
                      Remove synthetic answer
                    </button>
                  </div>
                  <label class="mt-2 block font-semibold"
                    >Answer state<select
                      [(ngModel)]="a.state"
                      class="mt-1 w-full rounded-lg border p-3"
                    >
                      @for (s of q.supportedAnswerStates; track s) {
                        <option [value]="s">{{ label(s) }}</option>
                      }
                    </select></label
                  >
                  @if (a.state === 'KNOWN') {
                    <ng-container
                      [ngTemplateOutlet]="valueEditor"
                      [ngTemplateOutletContext]="{ $implicit: a, q: q }"
                    ></ng-container>
                  }
                </article>
              }
            }
          </div>
          <label class="mt-4 block font-semibold"
            >Add questionnaire answer<select
              #answerQuestion
              class="mt-1 w-full rounded-lg border p-3"
            >
              <option value="">Select question</option>
              @for (g of questionnaire()!.groups; track g.key) {
                <optgroup [label]="g.title">
                  @for (q of g.questions; track q.key) {
                    <option [value]="q.key">{{ q.text }}</option>
                  }
                </optgroup>
              }
            </select></label
          ><button
            type="button"
            (click)="addAnswer(answerQuestion.value); answerQuestion.value = ''"
            class="mt-2 font-bold text-brand-700 underline"
          >
            Add synthetic answer</button
          ><button
            type="button"
            (click)="simulate()"
            [disabled]="busy()"
            class="mt-4 block rounded-lg bg-brand-700 px-5 py-3 font-bold text-white"
          >
            {{ busy() ? 'Running simulation…' : 'Run Simulation' }}
          </button>
          @if (simulation(); as s) {
            <div class="mt-4 rounded-xl bg-brand-50 p-4">
              <strong>Classification: {{ s.classification }}</strong>
              <p>Matched reason codes: {{ s.matchedReasonCodes.join(', ') || 'None' }}</p>
              <p>Patient message key: {{ s.patientMessageKey }}</p>
              <p>
                Professional review: {{ yes(s.requiresProfessionalReview) }} · Urgent action:
                {{ yes(s.urgentAction) }}
              </p>
              <p class="mt-2 font-bold">
                {{
                  s.sideEffects === false
                    ? 'No patient or operational records were created.'
                    : 'Unexpected side-effect state'
                }}
              </p>
            </div>
          }
        </section>
      }
      <section class="mt-5 rounded-2xl border bg-white p-6">
        <h2 class="text-2xl font-bold">Governance history</h2>
        @if (!r.audit.length) {
          <p class="mt-3">No governance history returned.</p>
        } @else {
          <ol class="mt-3 space-y-3">
            @for (a of r.audit; track a.createdAt + a.event) {
              <li>
                <strong>{{ label(a.event) }}</strong> · {{ date(a.createdAt) }}
                <p>
                  {{ a.actor.displayName || 'Governance actor' }} ·
                  {{ a.fromStatus || 'Created' }} → {{ a.toStatus || r.governanceStatus }}
                </p>
              </li>
            }
          </ol>
        }
      </section>
      <a
        routerLink="/admin/guided-self-check"
        [queryParams]="{ tab: 'processing' }"
        class="mt-5 inline-flex font-bold text-brand-700 underline"
        >Open Classification Processing</a
      >
    }
    <ng-template #valueEditor let-a let-q="q">
      @if (q.type === 'BOOLEAN') {
        <label class="mt-2 block font-semibold"
          >Synthetic value<select [(ngModel)]="a.value" class="mt-1 w-full rounded-lg border p-3">
            <option [ngValue]="true">Yes</option>
            <option [ngValue]="false">No</option>
          </select></label
        >
      } @else if (q.type === 'SINGLE_CHOICE') {
        <label class="mt-2 block font-semibold"
          >Synthetic value<select [(ngModel)]="a.value" class="mt-1 w-full rounded-lg border p-3">
            @for (o of q.options; track o) {
              <option [value]="o">{{ label(o) }}</option>
            }
          </select></label
        >
      } @else if (q.type === 'MULTI_CHOICE') {
        <fieldset class="mt-2">
          <legend class="font-semibold">Synthetic values</legend>
          @for (o of q.options; track o) {
            <label class="mr-4 inline-flex gap-2"
              ><input type="checkbox" [checked]="selected(a, o)" (change)="toggle(a, o)" />{{
                label(o)
              }}</label
            >
          }
        </fieldset>
      } @else if (q.type === 'BLOOD_PRESSURE') {
        <div class="mt-2 grid gap-3 sm:grid-cols-2">
          <label
            >Systolic<input
              type="number"
              [ngModel]="objectValue(a, 'systolic')"
              (ngModelChange)="setObjectValue(a, 'systolic', $event)"
              class="w-full rounded-lg border p-3" /></label
          ><label
            >Diastolic<input
              type="number"
              [ngModel]="objectValue(a, 'diastolic')"
              (ngModelChange)="setObjectValue(a, 'diastolic', $event)"
              class="w-full rounded-lg border p-3"
          /></label>
        </div>
      } @else if (q.type === 'BLOOD_GLUCOSE') {
        <label class="mt-2 block"
          >Value<input
            type="number"
            [ngModel]="objectValue(a, 'value')"
            (ngModelChange)="setObjectValue(a, 'value', $event)"
            class="w-full rounded-lg border p-3"
        /></label>
      } @else if (q.type === 'NUMBER') {
        <label class="mt-2 block"
          >Synthetic value<input
            type="number"
            [(ngModel)]="a.value"
            class="w-full rounded-lg border p-3"
        /></label>
      } @else {
        <label class="mt-2 block"
          >Synthetic value<textarea
            [(ngModel)]="a.value"
            placeholder="Synthetic answer for governance testing only"
            class="w-full rounded-lg border p-3"
          ></textarea>
        </label>
      }
    </ng-template>
  </main>`,
})
export class GuidedSelfCheckRulesetDetailPageComponent {
  private api = inject(GuidedSelfCheckGovernanceApiService);
  private ref = inject(ActivatedRoute).snapshot.paramMap.get('reference')!;
  detail = signal<RulesetDetail | null>(null);
  metadata = signal<GovernanceMetadata | null>(null);
  questionnaire = signal<QuestionnaireMetadata | null>(null);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  validation = signal<ValidationResult | null>(null);
  simulation = signal<SimulationResult | null>(null);
  simulationOpen = signal(false);
  answers: SimulationAnswer[] = [];
  governanceNote = '';
  categories = ['GREEN', 'AMBER', 'RED'] as const;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ detail: this.api.ruleset(this.ref), metadata: this.api.metadata() }).subscribe({
      next: (x) => {
        this.detail.set(x.detail);
        this.metadata.set(x.metadata);
        this.api
          .questionnaire(x.detail.questionnaireVersion)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: (q) => this.questionnaire.set(q),
            error: () => this.error.set('Questionnaire metadata could not be loaded.'),
          });
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(
          e.status === 403
            ? 'Active clinical-governance authorization is required.'
            : 'The governed ruleset could not be loaded.',
        );
      },
    });
  }
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
  lower(v: string) {
    return v.toLowerCase() as 'green' | 'amber' | 'red';
  }
  yes(v: boolean) {
    return v ? 'Yes' : 'No';
  }
  date(v: string) {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(v),
    );
  }
  message(key: string) {
    return this.metadata()?.patientMessages.find((x) => x.key === key);
  }
  question(key: string) {
    return this.questionnaire()
      ?.groups.flatMap((g) => g.questions)
      .find((q) => q.key === key);
  }
  addRule() {
    this.detail()?.rules.push({
      code: '',
      severity: this.metadata()!.severities[0],
      condition: { operator: 'STATE_EQUALS', questionKey: '', state: 'KNOWN' },
    });
  }
  removeRule(i: number) {
    this.detail()?.rules.splice(i, 1);
  }
  save() {
    const r = this.detail()!;
    this.run(
      this.api.update(r.reference, {
        expectedContentHash: r.contentHash,
        name: r.name,
        description: r.description ?? '',
        rules: r.rules,
        patientMessageKeys: r.patientMessageKeys,
      }),
      true,
    );
  }
  validate() {
    this.busy.set(true);
    this.api
      .validate(this.ref)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (v) => this.validation.set(v),
        error: () => this.error.set('Ruleset validation could not be completed.'),
      });
  }
  transition(action: 'submit-review' | 'approve' | 'mark-ready' | 'activate' | 'retire') {
    const copy = {
      'submit-review':
        'Submit this Draft for review? Editing will stop and submission does not approve it.',
      approve: 'Approve this reviewed ruleset?',
      'mark-ready': 'Mark this approved ruleset Ready? This does not activate it.',
      activate:
        'Activate this ruleset for new compatible classifications? The previous compatible ruleset will be deactivated; historical Self-Checks are not automatically reprocessed.',
      retire:
        'Retire this ruleset? It will not classify new Self-Checks and historical classifications remain linked.',
    }[action];
    if (!confirm(copy)) return;
    this.run(this.api.transition(this.ref, action, this.governanceNote || undefined), true);
  }
  private run(x: Observable<unknown>, reload = false) {
    this.busy.set(true);
    this.error.set('');
    x.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => reload && this.load(),
      error: (e) => {
        this.error.set(
          e.status === 409
            ? 'This ruleset changed or its lifecycle no longer permits that action. Reload the latest version before continuing.'
            : 'The governance action could not be completed.',
        );
        if (e.status === 409) this.detail.set(null);
      },
    });
  }
  addAnswer(key: string) {
    if (
      !key ||
      this.answers.some((x) => x.questionKey === key) ||
      this.answers.length >= this.metadata()!.validationLimits.maxSimulationAnswers
    )
      return;
    this.answers.push({ questionKey: key, state: 'KNOWN' });
  }
  removeAnswer(i: number) {
    this.answers.splice(i, 1);
  }
  simulate() {
    this.busy.set(true);
    this.api
      .simulate(this.ref, this.answers)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (s) => this.simulation.set(s),
        error: () => this.error.set('The side-effect-free simulation could not be completed.'),
      });
  }
  selected(a: SimulationAnswer, o: string) {
    return Array.isArray(a.value) && a.value.includes(o);
  }
  toggle(a: SimulationAnswer, o: string) {
    const values = Array.isArray(a.value) ? [...a.value] : [];
    a.value = values.includes(o) ? values.filter((x) => x !== o) : [...values, o];
  }
  objectValue(a: SimulationAnswer, k: string) {
    return a.value && typeof a.value === 'object' && !Array.isArray(a.value)
      ? (a.value as Record<string, unknown>)[k]
      : null;
  }
  setObjectValue(a: SimulationAnswer, k: string, v: number) {
    a.value = {
      ...(a.value && typeof a.value === 'object' && !Array.isArray(a.value) ? a.value : {}),
      [k]: v,
    };
  }
}
