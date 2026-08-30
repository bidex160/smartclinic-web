import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  ClinicalRecordDocumentationSnapshot,
  ClinicalStructuredData,
  ClinicalStructuredValue,
} from '../core/models/clinical-record.model';

@Component({
  selector: 'app-clinical-documentation-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="grid gap-5">
      @for (field of orderedFields(); track field.key) {
        @if (hasValue(value(field.key))) {
          <div>
            <dt class="font-bold">{{ field.label }}</dt>
            <dd class="mt-1 whitespace-pre-wrap text-slate-700">{{ display(value(field.key), field.type) }}</dd>
          </div>
        } @else if (showMissing()) {
          <div><dt class="font-bold">{{ field.label }}</dt><dd class="mt-1 text-slate-500">Not provided</dd></div>
        }
      }
    </dl>
  `,
})
export class ClinicalDocumentationViewComponent {
  readonly documentation = input.required<ClinicalRecordDocumentationSnapshot>();
  readonly data = input<ClinicalStructuredData | null>(null);
  readonly showMissing = input(true);
  orderedFields() { return [...this.documentation().fields].sort((a, b) => a.sortOrder - b.sortOrder); }
  value(key: string): ClinicalStructuredValue | undefined { return this.data()?.[key]; }
  hasValue(value: ClinicalStructuredValue | undefined): boolean {
    return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
  }
  display(value: ClinicalStructuredValue | undefined, type: string): string {
    if (!this.hasValue(value)) return 'Not provided';
    if (type === 'BOOLEAN') return value === true ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (type === 'DATE' && typeof value === 'string') {
      const parsed = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(parsed);
    }
    return String(value);
  }
}
