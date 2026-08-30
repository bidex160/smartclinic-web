import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import {
  ClinicalRecordDocumentationSnapshot,
  ClinicalStructuredData,
  ClinicalStructuredValue,
} from '../core/models/clinical-record.model';

@Component({
  selector: 'app-clinical-documentation-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-5">
      @for (field of orderedFields(); track field.key) {
        <div>
          <label [for]="id(field.key)" class="font-bold">{{ field.label }} @if (field.required) { <span aria-label="required" class="text-red-700">*</span> }</label>
          @switch (field.type) {
            @case ('TEXT') { <input [id]="id(field.key)" type="text" [formControlName]="field.key" [placeholder]="field.placeholder || ''" class="mt-2 min-h-12 w-full rounded-xl border px-3" /> }
            @case ('TEXTAREA') { <textarea [id]="id(field.key)" [formControlName]="field.key" [placeholder]="field.placeholder || ''" rows="4" class="mt-2 w-full rounded-xl border p-3"></textarea> }
            @case ('NUMBER') { <input [id]="id(field.key)" type="number" [formControlName]="field.key" [placeholder]="field.placeholder || ''" class="mt-2 min-h-12 w-full rounded-xl border px-3" /> }
            @case ('DATE') { <input [id]="id(field.key)" type="date" [formControlName]="field.key" class="mt-2 min-h-12 w-full rounded-xl border px-3" /> }
            @case ('SELECT') { <select [id]="id(field.key)" [formControlName]="field.key" class="mt-2 min-h-12 w-full rounded-xl border px-3"><option value="">Select an option</option>@for (option of field.options || []; track option) { <option [value]="option">{{ option }}</option> }</select> }
            @case ('MULTI_SELECT') { <fieldset class="mt-2 rounded-xl border p-3"><legend class="sr-only">{{ field.label }}</legend>@for (option of field.options || []; track option) { <label class="flex min-h-11 items-center gap-3"><input type="checkbox" [checked]="selected(field.key, option)" (change)="toggle(field.key, option, $any($event.target).checked)" />{{ option }}</label> }</fieldset> }
            @case ('BOOLEAN') { <label class="mt-2 flex min-h-12 items-center gap-3 rounded-xl border px-3"><input type="checkbox" [formControlName]="field.key" /> Yes</label> }
          }
        </div>
      }
      <button type="submit" [disabled]="pending()" class="justify-self-start rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50">{{ pending() ? 'Saving…' : 'Save draft' }}</button>
    </form>
  `,
})
export class ClinicalDocumentationFormComponent {
  readonly documentation = input.required<ClinicalRecordDocumentationSnapshot>();
  readonly data = input<ClinicalStructuredData | null>(null);
  readonly pending = input(false);
  readonly save = output<ClinicalStructuredData>();
  readonly form = new FormRecord<FormControl<ClinicalStructuredValue>>({});
  constructor() {
    effect(() => {
      const fields = this.documentation().fields;
      const data = this.data();
      for (const key of Object.keys(this.form.controls)) this.form.removeControl(key);
      for (const field of fields) {
        const fallback: ClinicalStructuredValue = field.type === 'BOOLEAN' ? false : field.type === 'MULTI_SELECT' ? [] : null;
        this.form.addControl(field.key, new FormControl<ClinicalStructuredValue>(data?.[field.key] ?? fallback));
      }
    });
  }
  orderedFields() { return [...this.documentation().fields].sort((a, b) => a.sortOrder - b.sortOrder); }
  id(key: string) { return `clinical-field-${key}`; }
  selected(key: string, option: string): boolean { const value = this.form.controls[key]?.value; return Array.isArray(value) && value.includes(option); }
  toggle(key: string, option: string, checked: boolean): void {
    const control = this.form.controls[key];
    const values = Array.isArray(control.value) ? [...control.value] : [];
    control.setValue(checked ? [...new Set([...values, option])] : values.filter(value => value !== option));
  }
  submit(): void {
    const output: Record<string, ClinicalStructuredValue> = {};
    for (const field of this.documentation().fields) {
      let value = this.form.controls[field.key]?.value ?? null;
      if (field.type === 'NUMBER' && value !== null && value !== '') value = Number(value);
      output[field.key] = value;
    }
    this.save.emit(output);
  }
}
