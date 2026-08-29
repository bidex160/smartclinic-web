import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClinicalRecord, ClinicalRecordAttachment } from '../../core/models/clinical-record.model';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';

@Component({
  selector: 'app-health-record-detail-page', imports: [RouterLink], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8"><a routerLink="/me/health-records" class="font-bold text-brand-700 underline">← Health Records</a>
  @if (loading()) { <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading clinical record…</p> }
  @else if (error() && !record()) { <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">This clinical record is unavailable. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div> }
  @else if (record(); as r) { <header class="mt-6"><p class="break-all text-sm font-bold text-brand-700">{{ r.reference }}</p><div class="mt-2 flex flex-wrap items-start justify-between gap-4"><h1 class="text-3xl font-bold">{{ r.title }}</h1><a [routerLink]="['/me/health-records/sharing/new']" [queryParams]="{ recordReference: r.reference }" class="rounded-xl border px-4 py-3 font-bold text-brand-700">Share this record</a></div><span class="mt-3 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-900">Finalized</span></header>
  <section class="mt-6 rounded-2xl border bg-white p-6"><dl class="grid gap-5 sm:grid-cols-2"><div><dt class="text-sm text-slate-500">Record type</dt><dd>{{ typeLabel(r.recordType) }}</dd></div><div><dt class="text-sm text-slate-500">Provider</dt><dd>{{ r.provider.displayName }}</dd></div><div><dt class="text-sm text-slate-500">Service</dt><dd>{{ r.service?.name || 'General Care' }}</dd></div><div><dt class="text-sm text-slate-500">Care date</dt><dd>{{ formatDate(r.occurredAt) }}</dd></div>@if (r.careRequestReference) { <div><dt class="text-sm text-slate-500">Care Request</dt><dd><a [routerLink]="['/me/care', r.careRequestReference]" class="break-all font-bold text-brand-700 underline">{{ r.careRequestReference }}</a></dd></div> }@if (r.careAppointmentReference) { <div><dt class="text-sm text-slate-500">Appointment</dt><dd><a [routerLink]="['/me/care/appointments', r.careAppointmentReference]" class="break-all font-bold text-brand-700 underline">{{ r.careAppointmentReference }}</a></dd></div> }</dl>@if (r.summary) { <div class="mt-6"><h2 class="font-bold">Summary</h2><p class="mt-2 whitespace-pre-wrap">{{ r.summary }}</p></div> }</section>
  @if (r.recordType === 'CONSULTATION' && r.consultation; as c) { <section class="mt-6 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Consultation details</h2><dl class="mt-5 grid gap-5">@for (field of consultationFields(c); track field.label) { <div><dt class="font-bold">{{ field.label }}</dt><dd class="mt-1 whitespace-pre-wrap text-slate-700">{{ field.value || 'Not recorded' }}</dd></div> }</dl></section> }
  <section class="mt-6 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Supporting files</h2>@if (!r.attachments.length) { <p class="mt-2 text-slate-600">No supporting files were included with this clinical record.</p> } @else { <div class="mt-4 grid gap-3 sm:grid-cols-2">@for (attachment of r.attachments; track attachment.reference) { <article class="min-w-0 rounded-xl border p-4"><div class="flex items-start gap-3"><span aria-hidden="true" class="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 font-bold">{{ attachment.resourceType === 'IMAGE' ? 'IMG' : 'PDF' }}</span><div class="min-w-0"><p class="break-words font-bold">{{ attachment.originalName }}</p><p class="mt-1 text-sm text-slate-500">{{ formatFileSize(attachment.sizeBytes) }} · {{ formatAttachmentDate(attachment.createdAt) }}</p></div></div><button type="button" (click)="viewAttachment(attachment)" [disabled]="accessPending() === attachment.reference" class="mt-4 font-bold text-brand-700 underline">{{ accessPending() === attachment.reference ? 'Opening…' : attachment.resourceType === 'IMAGE' ? 'Preview' : 'Open' }}</button></article> }</div> }@if (attachmentError()) { <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ attachmentError() }}</p> }</section>
  }
  @if (previewUrl(); as url) { <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><section role="dialog" aria-modal="true" aria-labelledby="patient-attachment-preview-title" class="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div class="flex items-start justify-between gap-3"><h2 id="patient-attachment-preview-title" class="break-words text-xl font-bold">{{ previewName() }}</h2><button type="button" (click)="closePreview()" class="rounded-lg border px-4 py-2 font-bold">Close</button></div><img [src]="url" [alt]="previewName()" class="mt-4 max-h-[75vh] w-full object-contain" /></section></div> }
  </main>`,
})
export class HealthRecordDetailPageComponent {
  private readonly api = inject(ClinicalRecordsApiService); readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly record = signal<ClinicalRecord | null>(null); readonly loading = signal(true); readonly error = signal(false);
  readonly accessPending = signal<string | null>(null); readonly attachmentError = signal<string | null>(null); readonly previewUrl = signal<string | null>(null); readonly previewName = signal('');
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.error.set(false); this.api.getMine(this.reference).pipe(finalize(() => this.loading.set(false))).subscribe({ next: value => this.record.set(value), error: () => this.error.set(true) }); }
  formatDate(value: string): string { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  typeLabel(value: string): string { return value.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' '); }
  consultationFields(c: NonNullable<ClinicalRecord['consultation']>) { return [
    { label: 'Presenting complaint', value: c.presentingComplaint }, { label: 'History of presenting complaint', value: c.historyOfPresentingComplaint },
    { label: 'Clinical observations', value: c.observations }, { label: 'Assessment', value: c.assessment }, { label: 'Diagnosis', value: c.diagnosis },
    { label: 'Plan', value: c.plan }, { label: 'Follow-up instructions', value: c.followUpInstructions },
  ]; }
  viewAttachment(attachment: ClinicalRecordAttachment): void {
    const record = this.record(); if (!record || this.accessPending()) return;
    this.accessPending.set(attachment.reference); this.attachmentError.set(null);
    this.api.getPatientAttachmentAccess(record.reference, attachment.reference).pipe(finalize(() => this.accessPending.set(null))).subscribe({ next: access => this.openAuthorizedAttachment(attachment, access.url), error: () => this.attachmentError.set('Unable to open this file. Please try again.') });
  }
  private openAuthorizedAttachment(attachment: ClinicalRecordAttachment, value: string): void {
    let url: URL; try { url = new URL(value); } catch { this.attachmentError.set('Unable to open this file. Please try again.'); return; }
    if (url.protocol !== 'https:') { this.attachmentError.set('Unable to open this file. Please try again.'); return; }
    if (attachment.resourceType === 'IMAGE') { this.previewUrl.set(url.toString()); this.previewName.set(attachment.originalName); return; }
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }
  closePreview(): void { this.previewUrl.set(null); this.previewName.set(''); }
  formatFileSize(bytes: number): string { if (bytes < 1024) return `${bytes} bytes`; if (bytes < 1024 * 1024) return `${this.compact(bytes / 1024)} KB`; return `${this.compact(bytes / (1024 * 1024))} MB`; }
  formatAttachmentDate(value: string): string { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value)); }
  private compact(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
}
