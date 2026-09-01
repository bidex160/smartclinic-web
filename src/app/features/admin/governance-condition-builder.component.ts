import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GovernanceMetadata,
  QuestionnaireMetadata,
  QuestionnaireQuestion,
  RuleCondition,
  RuleOperator,
} from '../../core/models/guided-self-check-governance.model';
@Component({
  selector: 'app-governance-condition-builder',
  imports: [FormsModule],
  template: ` <fieldset class="rounded-xl border p-4">
    <legend class="px-1 font-bold">Condition level {{ depth + 1 }}</legend>
    <label class="block font-semibold"
      >Operator<select
        [(ngModel)]="condition.operator"
        (ngModelChange)="operatorChanged()"
        class="mt-1 w-full rounded-lg border p-3"
      >
        @for (o of operators(); track o) {
          <option [value]="o">{{ label(o) }}</option>
        }
      </select></label
    >
    @if (group()) {
      <p class="mt-2 text-sm text-slate-600">
        {{ condition.operator === 'AND' ? 'All' : 'Any' }} child conditions must match.
      </p>
      <div class="mt-3 space-y-3">
        @for (child of condition.conditions; track $index) {
          <app-governance-condition-builder
            [condition]="child"
            [metadata]="metadata"
            [questionnaire]="questionnaire"
            [depth]="depth + 1"
            (remove)="removeChild($index)"
          />
        }
      </div>
      <button
        type="button"
        (click)="addChild()"
        [disabled]="!canAddChild()"
        class="mt-3 font-bold text-brand-700 underline"
      >
        Add child condition
      </button>
    } @else {
      <label class="mt-3 block font-semibold"
        >Question<select
          [(ngModel)]="condition.questionKey"
          (ngModelChange)="questionChanged()"
          class="mt-1 w-full rounded-lg border p-3"
        >
          <option value="">Select questionnaire question</option>
          @for (g of questionnaire.groups; track g.key) {
            <optgroup [label]="g.title">
              @for (q of g.questions; track q.key) {
                <option [value]="q.key">{{ q.text }}</option>
              }
            </optgroup>
          }
        </select></label
      >
      @if (question(); as q) {
        <p class="mt-1 text-sm text-slate-600">{{ label(q.type) }} · stored as {{ q.key }}</p>
        @if (condition.operator === 'STATE_EQUALS') {
          <label class="mt-3 block font-semibold"
            >Answer state<select
              [(ngModel)]="condition.state"
              class="mt-1 w-full rounded-lg border p-3"
            >
              @for (s of q.supportedAnswerStates; track s) {
                <option [value]="s">{{ label(s) }}</option>
              }
            </select></label
          >
        } @else if (numeric()) {
          @if (q.measurementTargets.length) {
            <label class="mt-3 block font-semibold"
              >Measurement target<select
                [(ngModel)]="condition.field"
                class="mt-1 w-full rounded-lg border p-3"
              >
                @for (t of q.measurementTargets; track t) {
                  <option [value]="t">{{ label(t) }}</option>
                }
              </select></label
            >
          }
          @if (condition.operator === 'BETWEEN') {
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label class="font-semibold"
                >Minimum<input
                  type="number"
                  [(ngModel)]="condition.min"
                  class="mt-1 w-full rounded-lg border p-3" /></label
              ><label class="font-semibold"
                >Maximum<input
                  type="number"
                  [(ngModel)]="condition.max"
                  class="mt-1 w-full rounded-lg border p-3"
              /></label>
            </div>
          } @else {
            <label class="mt-3 block font-semibold"
              >Comparison value<input
                type="number"
                [(ngModel)]="condition.value"
                class="mt-1 w-full rounded-lg border p-3"
              /><span class="mt-1 block text-xs font-normal"
                >Enter only a clinically governed value; no threshold is suggested by
                SmartClinic.</span
              ></label
            >
          }
        } @else if (q.type === 'BOOLEAN' && condition.operator === 'EQUALS') {
          <label class="mt-3 block font-semibold"
            >Value<select [(ngModel)]="condition.value" class="mt-1 w-full rounded-lg border p-3">
              <option [ngValue]="true">Yes</option>
              <option [ngValue]="false">No</option>
            </select></label
          >
        } @else if (
          q.options.length && (condition.operator === 'EQUALS' || condition.operator === 'INCLUDES')
        ) {
          <label class="mt-3 block font-semibold"
            >Configured choice<select
              [(ngModel)]="condition.value"
              class="mt-1 w-full rounded-lg border p-3"
            >
              @for (o of q.options; track o) {
                <option [value]="o">{{ label(o) }}</option>
              }
            </select></label
          >
        } @else if (condition.operator !== 'UNANSWERED') {
          <label class="mt-3 block font-semibold"
            >Comparison value<input
              [(ngModel)]="condition.value"
              placeholder="Value defined by the selected questionnaire"
              class="mt-1 w-full rounded-lg border p-3"
          /></label>
        }
      }
    }
    @if (removable) {
      <button
        type="button"
        (click)="remove.emit()"
        class="mt-3 font-bold text-red-800 underline"
        [attr.aria-label]="'Remove condition at level ' + (depth + 1)"
      >
        Remove condition
      </button>
    }
  </fieldset>`,
})
export class GovernanceConditionBuilderComponent {
  @Input({ required: true }) condition!: RuleCondition;
  @Input({ required: true }) metadata!: GovernanceMetadata;
  @Input({ required: true }) questionnaire!: QuestionnaireMetadata;
  @Input() depth = 0;
  @Input() removable = true;
  @Output() remove = new EventEmitter<void>();
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
  group() {
    return this.condition.operator === 'AND' || this.condition.operator === 'OR';
  }
  numeric() {
    return ['LT', 'LTE', 'GT', 'GTE', 'BETWEEN'].includes(this.condition.operator);
  }
  question(): QuestionnaireQuestion | undefined {
    return this.questionnaire.groups
      .flatMap((g) => g.questions)
      .find((q) => q.key === this.condition.questionKey);
  }
  operators(): RuleOperator[] {
    const q = this.question();
    return this.metadata.operators.filter(
      (o) =>
        o === 'AND' || o === 'OR' || !q || this.metadata.operatorCompatibility[o]?.includes(q.type),
    );
  }
  operatorChanged() {
    if (this.group()) {
      this.condition.conditions ??= [this.empty()];
      delete this.condition.questionKey;
    } else {
      delete this.condition.conditions;
      this.clearOperand();
    }
  }
  questionChanged() {
    const q = this.question();
    const compatible = this.metadata.operatorCompatibility[this.condition.operator]?.includes(
      q?.type as never,
    );
    if (!compatible) this.condition.operator = 'STATE_EQUALS';
    this.clearOperand();
  }
  clearOperand() {
    delete this.condition.value;
    delete this.condition.min;
    delete this.condition.max;
    delete this.condition.state;
    delete this.condition.field;
  }
  empty(): RuleCondition {
    return { operator: 'STATE_EQUALS', questionKey: '', state: 'KNOWN' };
  }
  canAddChild() {
    return (
      this.depth < this.metadata.validationLimits.maxConditionDepth &&
      (this.condition.conditions?.length ?? 0) < this.metadata.validationLimits.maxGroupBranches
    );
  }
  addChild() {
    if (this.canAddChild()) this.condition.conditions!.push(this.empty());
  }
  removeChild(i: number) {
    this.condition.conditions!.splice(i, 1);
  }
}
