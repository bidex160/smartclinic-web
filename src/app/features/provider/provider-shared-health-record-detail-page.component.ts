import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClinicalRecordAttachment, SharedClinicalRecord } from '../../core/models/clinical-record.model';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { ClinicalDocumentationViewComponent } from '../../shared/clinical-documentation-view.component';

@Component({
  selector: 'app-provider-shared-health-record-detail-page',
  imports: [RouterLink, ClinicalDocumentationViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <a routerLink="/provider/shared-health-records" class="font-bold text-brand-700 underline">← Shared Health Records</a>
      @if (loading()) { <p role="status" class="mt-6 rounded-2xl border p-6">Loading shared clinical record…</p> }
      @else if (error() && !record()) { <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">This shared clinical record is unavailable. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div> }
      @else if (record(); as r) {
        <header class="mt-6"><p class="break-all text-sm font-bold text-brand-700">{{ r.reference }}</p><h1 class="mt-2 text-3xl font-bold">{{ r.title }}</h1><p class="mt-3 text-slate-600">Shared by {{ r.patient.displayName }}</p></header>
        <section class="mt-6 rounded-2xl border bg-white p-6"><dl class="grid gap-5 sm:grid-cols-2"><div><dt class="text-sm text-slate-500">Record created by</dt><dd class="font-bold">{{ r.provider.displayName }}</dd></div><div><dt class="text-sm text-slate-500">Type</dt><dd>{{ label(r.recordType) }}</dd></div><div><dt class="text-sm text-slate-500">Service</dt><dd>{{ r.service?.name || 'General Care' }}</dd></div><div><dt class="text-sm text-slate-500">Care date</dt><dd>{{ date(r.occurredAt) }}</dd></div></dl>@if (r.summary) { <div class="mt-6"><h2 class="font-bold">Summary</h2><p class="mt-2 whitespace-pre-wrap">{{ r.summary }}</p></div> }</section>
        @if (r.recordType === 'CONSULTATION' && r.consultation; as c) { <section class="mt-6 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Consultation details</h2><dl class="mt-5 grid gap-5">@for (f of fields(c); track f.label) { <div><dt class="font-bold">{{ f.label }}</dt><dd class="mt-1 whitespace-pre-wrap text-slate-700">{{ f.value || 'Not recorded' }}</dd></div> }</dl></section> }
        @if (r.recordType !== 'CONSULTATION' && r.documentation; as documentation) { <section class="mt-6 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Clinical documentation</h2><div class="mt-5"><app-clinical-documentation-view [documentation]="documentation" [data]="r.structuredData" /></div></section> }
        <section class="mt-6 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Supporting files</h2>@if (!r.attachments.length) { <p class="mt-2 text-slate-600">No supporting files were included with this clinical record.</p> } @else { <div class="mt-4 grid gap-3 sm:grid-cols-2">@for (a of r.attachments; track a.reference) { <article class="min-w-0 rounded-xl border p-4"><p class="break-words font-bold">{{ a.originalName }}</p><p class="mt-1 text-sm text-slate-500">{{ size(a.sizeBytes) }}</p><button type="button" (click)="open(a)" [disabled]="pending() === a.reference" class="mt-3 font-bold text-brand-700 underline">{{ pending() === a.reference ? 'Opening…' : a.resourceType === 'IMAGE' ? 'Preview' : 'Open' }}</button></article> }</div> } @if (accessError()) { <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4">Unable to open this file. Please try again.</p> }</section>
      }
      @if (previewUrl(); as url) { <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><section role="dialog" aria-modal="true" aria-labelledby="shared-preview-title" class="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5"><div class="flex justify-between gap-3"><h2 id="shared-preview-title" class="break-words text-xl font-bold">{{ previewName() }}</h2><button type="button" (click)="closePreview()" class="rounded-lg border px-4 py-2 font-bold">Close</button></div><img [src]="url" [alt]="previewName()" class="mt-4 max-h-[75vh] w-full object-contain"></section></div> }
    </main>`,
})
export class ProviderSharedHealthRecordDetailPageComponent {
  private readonly api = inject(ClinicalRecordsApiService); readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly record = signal<SharedClinicalRecord | null>(null); readonly loading = signal(true); readonly error = signal(false); readonly pending = signal<string | null>(null); readonly accessError = signal(false); readonly previewUrl = signal<string | null>(null); readonly previewName = signal('');
  constructor() { this.load(); }
  load() { this.loading.set(true); this.error.set(false); this.api.getShared(this.reference).pipe(finalize(() => this.loading.set(false))).subscribe({ next: r => this.record.set(r), error: () => this.error.set(true) }); }
  open(a: ClinicalRecordAttachment) { if (this.pending()) return; this.pending.set(a.reference); this.accessError.set(false); this.api.getSharedAttachmentAccess(this.reference, a.reference).pipe(finalize(() => this.pending.set(null))).subscribe({ next: x => this.openUrl(a, x.url), error: () => this.accessError.set(true) }); }
  private openUrl(a: ClinicalRecordAttachment, value: string) { let url: URL; try { url = new URL(value); } catch { this.accessError.set(true); return; } if (url.protocol !== 'https:') { this.accessError.set(true); return; } if (a.resourceType === 'IMAGE') { this.previewUrl.set(url.toString()); this.previewName.set(a.originalName); } else window.open(url.toString(), '_blank', 'noopener,noreferrer'); }
  closePreview() { this.previewUrl.set(null); this.previewName.set(''); }
  fields(c: NonNullable<SharedClinicalRecord['consultation']>) { return [{ label: 'Presenting complaint', value: c.presentingComplaint }, { label: 'History of presenting complaint', value: c.historyOfPresentingComplaint }, { label: 'Clinical observations', value: c.observations }, { label: 'Assessment', value: c.assessment }, { label: 'Diagnosis', value: c.diagnosis }, { label: 'Plan', value: c.plan }, { label: 'Follow-up instructions', value: c.followUpInstructions }]; }
  label(v: string) { return v.split('_').map(x => x[0] + x.slice(1).toLowerCase()).join(' '); }
  date(v: string) { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)); }
  size(b: number) { return b < 1024 ? `${b} bytes` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`; }
}
