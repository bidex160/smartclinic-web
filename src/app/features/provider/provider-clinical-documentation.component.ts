import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  ClinicalDocumentationField,
  ClinicalDocumentationFieldType,
  ProviderCareServiceClinicalDocumentation,
} from '../../core/models/clinical-record.model';
import { ProviderCareServicesApiService } from '../../core/services/provider-care-services-api.service';

type EditableField = ClinicalDocumentationField & { optionsText: string };

@Component({
  selector: 'app-provider-clinical-documentation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl border p-4" aria-labelledby="documentation-heading">
      <h3 id="documentation-heading" class="font-bold">Clinical Documentation</h3>
      <p class="mt-1 text-sm text-slate-600">Managed by SmartClinic. The service's Clinical Record type cannot be changed here.</p>
      @if (loading()) { <p role="status" class="mt-3">Loading documentation configuration…</p> }
      @else if (loadError()) { <p role="alert" class="mt-3 rounded-lg bg-red-50 p-3">{{ loadError() }} <button type="button" (click)="load()" class="font-bold underline">Try again</button></p> }
      @else if (!documentation()) { <p class="mt-3 rounded-lg bg-slate-50 p-3">No clinical documentation is required for this service.</p> }
      @else if (documentation(); as config) {
        <dl class="mt-3 grid gap-3 sm:grid-cols-2"><div><dt class="text-sm text-slate-500">Record Type</dt><dd class="font-semibold">{{ label(config.clinicalRecordType) }}</dd></div><div><dt class="text-sm text-slate-500">Documentation Template</dt><dd class="font-semibold">{{ modeLabel(config.templateMode) }} @if (config.templateVersion) { · Version {{ config.templateVersion }} }</dd></div></dl>
        @if (config.templateMode === 'STANDARD') {
          <p class="mt-4 rounded-lg bg-slate-50 p-3">SmartClinic's standard consultation documentation form is used.</p>
        } @else if (!editing()) {
          <div class="mt-4"><h4 class="font-bold">{{ config.templateMode === 'DEFAULT' ? 'SmartClinic Default' : 'Custom Documentation Template' }}</h4>
            <ul class="mt-2 divide-y rounded-xl border">@for (field of ordered(config.fields); track field.key) { <li class="flex flex-wrap justify-between gap-2 p-3"><span>{{ field.label }} @if (field.core) { <span class="text-xs font-bold text-brand-700">Core field</span> }</span><span class="text-sm text-slate-600">{{ label(field.type) }} · {{ field.required ? 'Required' : 'Optional' }}</span></li> }</ul>
            <div class="mt-4 flex flex-wrap gap-3"><button type="button" (click)="edit(config)" class="rounded-xl border px-4 py-2 font-bold">{{ config.templateMode === 'DEFAULT' ? 'Customize from Default' : 'Edit Template' }}</button>@if (config.templateMode === 'CUSTOM') { <button type="button" (click)="resetOpen.set(true)" class="rounded-xl border border-red-300 px-4 py-2 font-bold text-red-700">Reset to SmartClinic Default</button> }</div>
          </div>
        } @else {
          <div class="mt-5 grid gap-4">@for (field of fields(); track field.key; let index = $index) {
            <fieldset class="rounded-xl border p-4"><legend class="font-bold">Field {{ index + 1 }} @if (field.core) { <span class="text-sm text-brand-700">· Core field</span> }</legend>
              <div class="mt-3 grid gap-3 sm:grid-cols-2"><label class="font-semibold">Label<input [value]="field.label" (input)="change(index, 'label', $any($event.target).value)" maxlength="160" class="mt-1 min-h-11 w-full rounded-lg border px-3" /></label><label class="font-semibold">Key<input [value]="field.key" (input)="change(index, 'key', $any($event.target).value)" maxlength="80" [readOnly]="field.core" class="mt-1 min-h-11 w-full rounded-lg border px-3 disabled:bg-slate-100" /></label>
                <label class="font-semibold">Type<select [value]="field.type" (change)="change(index, 'type', $any($event.target).value)" [disabled]="field.core" class="mt-1 min-h-11 w-full rounded-lg border px-3">@for (type of types; track type) { <option [value]="type">{{ label(type) }}</option> }</select></label><label class="mt-7 flex items-center gap-2"><input type="checkbox" [checked]="field.required" (change)="change(index, 'required', $any($event.target).checked)" [disabled]="field.core" /> Required</label>
                <label class="font-semibold sm:col-span-2">Placeholder<input [value]="field.placeholder || ''" (input)="change(index, 'placeholder', $any($event.target).value)" maxlength="500" class="mt-1 min-h-11 w-full rounded-lg border px-3" /></label>
                @if (field.type === 'SELECT' || field.type === 'MULTI_SELECT') { <label class="font-semibold sm:col-span-2">Options <span class="font-normal text-slate-500">(one per line)</span><textarea [value]="field.optionsText" (input)="change(index, 'optionsText', $any($event.target).value)" rows="3" class="mt-1 w-full rounded-lg border p-3"></textarea></label> }
              </div><div class="mt-3 flex flex-wrap gap-2"><button type="button" (click)="move(index, -1)" [disabled]="index === 0" class="rounded-lg border px-3 py-2">Move up</button><button type="button" (click)="move(index, 1)" [disabled]="index === fields().length - 1" class="rounded-lg border px-3 py-2">Move down</button>@if (!field.core) { <button type="button" (click)="remove(index)" class="rounded-lg border border-red-300 px-3 py-2 text-red-700">Remove</button> }</div>
            </fieldset>
          }</div>
          <button type="button" (click)="addField()" class="mt-4 rounded-xl border px-4 py-2 font-bold">Add field</button>
          @if (saveError()) { <p role="alert" class="mt-3 rounded-lg bg-red-50 p-3 text-red-800">{{ saveError() }}</p> }
          <p class="mt-3 text-sm text-slate-600">Template changes affect future Clinical Records only.</p>
          <div class="mt-4 flex justify-end gap-3"><button type="button" (click)="editing.set(false)" [disabled]="saving()" class="rounded-xl border px-4 py-2 font-bold">Cancel</button><button type="button" (click)="save()" [disabled]="saving()" class="rounded-xl bg-brand-700 px-4 py-2 font-bold text-white">{{ saving() ? 'Saving…' : 'Save template' }}</button></div>
        }
      }
    </section>
    @if (resetOpen()) { <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="reset-template-title" class="w-full max-w-lg rounded-2xl bg-white p-6"><h3 id="reset-template-title" class="text-xl font-bold">Reset documentation template?</h3><p class="mt-2">This will affect future Clinical Records only. Existing Clinical Records keep the documentation template they already use.</p><div class="mt-5 flex justify-end gap-3"><button type="button" (click)="resetOpen.set(false)" [disabled]="saving()" class="rounded-xl border px-4 py-2 font-bold">Cancel</button><button type="button" (click)="reset()" [disabled]="saving()" class="rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Reset to default</button></div></section></div> }
  `,
})
export class ProviderClinicalDocumentationComponent {
  private readonly api = inject(ProviderCareServicesApiService);
  readonly offeringId = input.required<string>();
  readonly types: readonly ClinicalDocumentationFieldType[] = ['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'BOOLEAN'];
  readonly documentation = signal<ProviderCareServiceClinicalDocumentation | null>(null);
  readonly fields = signal<EditableField[]>([]);
  readonly loading = signal(true); readonly saving = signal(false); readonly editing = signal(false); readonly resetOpen = signal(false);
  readonly loadError = signal<string | null>(null); readonly saveError = signal<string | null>(null);
  constructor() { queueMicrotask(() => this.load()); }
  load(): void { this.loading.set(true); this.loadError.set(null); this.api.getClinicalDocumentation(this.offeringId()).pipe(finalize(() => this.loading.set(false))).subscribe({ next: config => this.documentation.set(config), error: () => this.loadError.set('Clinical documentation could not be loaded.') }); }
  ordered(fields: readonly ClinicalDocumentationField[]) { return [...fields].sort((a, b) => a.sortOrder - b.sortOrder); }
  label(value: string) { return value.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' '); }
  modeLabel(mode: string) { return mode === 'STANDARD' ? 'Standard Consultation Documentation' : mode === 'DEFAULT' ? 'SmartClinic Default' : 'Custom'; }
  edit(config: ProviderCareServiceClinicalDocumentation): void { this.fields.set(this.ordered(config.fields).map(field => ({ ...field, optionsText: (field.options || []).join('\n') }))); this.saveError.set(null); this.editing.set(true); }
  change(index: number, key: keyof EditableField, value: unknown): void {
    this.fields.update(items => items.map((item, i) => {
      if (i !== index) return item;
      if (key === 'label' && /^customField\d+$/.test(item.key)) return { ...item, label: String(value), key: this.keyFromLabel(String(value)) };
      return { ...item, [key]: value };
    }));
  }
  addField(): void { const number = this.fields().length + 1; this.fields.update(items => [...items, { key: `customField${number}`, label: `Custom field ${number}`, type: 'TEXT', required: false, core: false, sortOrder: items.length + 1, optionsText: '' }]); }
  remove(index: number): void { this.fields.update(items => items.filter((_, i) => i !== index)); }
  move(index: number, delta: number): void { const target = index + delta; if (target < 0 || target >= this.fields().length) return; this.fields.update(items => { const copy = [...items]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; }); }
  save(): void {
    const fields: ClinicalDocumentationField[] = this.fields().map((field, index) => ({ key: field.key.trim(), label: field.label.trim(), type: field.type, required: field.core ? true : field.required, core: field.core, ...(field.placeholder?.trim() ? { placeholder: field.placeholder.trim() } : {}), ...((field.type === 'SELECT' || field.type === 'MULTI_SELECT') ? { options: field.optionsText.split('\n').map(x => x.trim()).filter(Boolean) } : {}), sortOrder: index }));
    this.saving.set(true); this.saveError.set(null);
    this.api.saveClinicalDocumentation(this.offeringId(), fields).pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { this.editing.set(false); this.load(); }, error: error => this.saveError.set(this.errorMessage(error)) });
  }
  reset(): void { this.saving.set(true); this.api.resetClinicalDocumentation(this.offeringId()).pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { this.resetOpen.set(false); this.load(); }, error: error => { this.resetOpen.set(false); this.saveError.set(this.errorMessage(error)); } }); }
  private errorMessage(error: { error?: { message?: unknown } }): string { return typeof error.error?.message === 'string' ? error.error.message : 'Clinical documentation could not be saved.'; }
  private keyFromLabel(label: string): string {
    const words = label.trim().replace(/[^A-Za-z0-9_ ]+/g, ' ').split(/[ _]+/).filter(Boolean);
    const key = words.map((word, index) => index ? word[0]?.toUpperCase() + word.slice(1) : word[0]?.toLowerCase() + word.slice(1)).join('');
    return /^[A-Za-z]/.test(key) ? key.slice(0, 80) : 'customField';
  }
}
