import { Component, Input } from '@angular/core';
import {
  QuestionnaireMetadata,
  RuleCondition,
} from '../../core/models/guided-self-check-governance.model';

@Component({
  selector: 'app-governance-condition-view',
  template: `<div class="rounded-xl border border-slate-200 bg-white p-4">
    @if (isGroup()) {
      <p class="font-bold">
        {{ condition.operator === 'AND' ? 'ALL conditions (AND)' : 'ANY condition (OR)' }}
      </p>
      <p class="text-sm text-slate-600">Operator: {{ condition.operator }}</p>
      <div class="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
        @for (child of condition.conditions ?? []; track $index) {
          <app-governance-condition-view [condition]="child" [questionnaire]="questionnaire" />
        }
      </div>
    } @else {
      <dl class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <dt class="text-sm text-slate-600">Question</dt>
          <dd class="font-semibold">{{ questionText() }}</dd>
          @if (condition.questionKey) {
            <dd class="break-all text-sm text-slate-600">Key: {{ condition.questionKey }}</dd>
          }
        </div>
        <div>
          <dt class="text-sm text-slate-600">Operator</dt>
          <dd>{{ label(condition.operator) }}</dd>
        </div>
        @if (condition.field) {
          <div>
            <dt class="text-sm text-slate-600">Measurement field</dt>
            <dd>{{ label(condition.field) }}</dd>
          </div>
        }
        @if (condition.state !== undefined) {
          <div>
            <dt class="text-sm text-slate-600">Answer state</dt>
            <dd>{{ label(condition.state) }}</dd>
          </div>
        }
        @if (condition.min !== undefined || condition.max !== undefined) {
          <div>
            <dt class="text-sm text-slate-600">Range</dt>
            <dd>Minimum {{ display(condition.min) }} · Maximum {{ display(condition.max) }}</dd>
          </div>
        } @else if (condition.value !== undefined) {
          <div>
            <dt class="text-sm text-slate-600">Configured value</dt>
            <dd>{{ display(condition.value) }}</dd>
          </div>
        }
      </dl>
    }
  </div>`,
})
export class GovernanceConditionViewComponent {
  @Input({ required: true }) condition!: RuleCondition;
  @Input({ required: true }) questionnaire!: QuestionnaireMetadata;
  isGroup() {
    return this.condition.operator === 'AND' || this.condition.operator === 'OR';
  }
  questionText() {
    const question = this.questionnaire.groups
      .flatMap((g) => g.questions)
      .find((q) => q.key === this.condition.questionKey);
    return question?.text ?? this.condition.questionKey ?? 'Question key not recorded';
  }
  label(value: string) {
    return value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
  display(value: unknown): string {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (Array.isArray(value)) return value.map((item) => this.display(item)).join(', ');
    if (value === null) return 'Null';
    if (value === undefined) return 'Not configured';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
