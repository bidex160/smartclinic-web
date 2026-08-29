import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClinicalRecord } from '../../core/models/clinical-record.model';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';

@Component({
  selector: 'app-health-record-detail-page', imports: [RouterLink], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8"><a routerLink="/me/health-records" class="font-bold text-brand-700 underline">← Health Records</a>
  @if (loading()) { <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading clinical record…</p> }
  @else if (error() && !record()) { <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">This clinical record is unavailable. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div> }
  @else if (record(); as r) { <header class="mt-6"><p class="break-all text-sm font-bold text-brand-700">{{ r.reference }}</p><h1 class="mt-2 text-3xl font-bold">{{ r.title }}</h1><span class="mt-3 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-900">Finalized</span></header>
  <section class="mt-6 rounded-2xl border bg-white p-6"><dl class="grid gap-5 sm:grid-cols-2"><div><dt class="text-sm text-slate-500">Record type</dt><dd>{{ typeLabel(r.recordType) }}</dd></div><div><dt class="text-sm text-slate-500">Provider</dt><dd>{{ r.provider.displayName }}</dd></div><div><dt class="text-sm text-slate-500">Service</dt><dd>{{ r.service?.name || 'General Care' }}</dd></div><div><dt class="text-sm text-slate-500">Care date</dt><dd>{{ formatDate(r.occurredAt) }}</dd></div>@if (r.careRequestReference) { <div><dt class="text-sm text-slate-500">Care Request</dt><dd><a [routerLink]="['/me/care', r.careRequestReference]" class="break-all font-bold text-brand-700 underline">{{ r.careRequestReference }}</a></dd></div> }@if (r.careAppointmentReference) { <div><dt class="text-sm text-slate-500">Appointment</dt><dd><a [routerLink]="['/me/care/appointments', r.careAppointmentReference]" class="break-all font-bold text-brand-700 underline">{{ r.careAppointmentReference }}</a></dd></div> }</dl>@if (r.summary) { <div class="mt-6"><h2 class="font-bold">Summary</h2><p class="mt-2 whitespace-pre-wrap">{{ r.summary }}</p></div> }</section>
  @if (r.recordType === 'CONSULTATION' && r.consultation; as c) { <section class="mt-6 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Consultation details</h2><dl class="mt-5 grid gap-5">@for (field of consultationFields(c); track field.label) { <div><dt class="font-bold">{{ field.label }}</dt><dd class="mt-1 whitespace-pre-wrap text-slate-700">{{ field.value || 'Not recorded' }}</dd></div> }</dl></section> }
  }</main>`,
})
export class HealthRecordDetailPageComponent {
  private readonly api = inject(ClinicalRecordsApiService); readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly record = signal<ClinicalRecord | null>(null); readonly loading = signal(true); readonly error = signal(false);
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.error.set(false); this.api.getMine(this.reference).pipe(finalize(() => this.loading.set(false))).subscribe({ next: value => this.record.set(value), error: () => this.error.set(true) }); }
  formatDate(value: string): string { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  typeLabel(value: string): string { return value.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' '); }
  consultationFields(c: NonNullable<ClinicalRecord['consultation']>) { return [
    { label: 'Presenting complaint', value: c.presentingComplaint }, { label: 'History of presenting complaint', value: c.historyOfPresentingComplaint },
    { label: 'Clinical observations', value: c.observations }, { label: 'Assessment', value: c.assessment }, { label: 'Diagnosis', value: c.diagnosis },
    { label: 'Plan', value: c.plan }, { label: 'Follow-up instructions', value: c.followUpInstructions },
  ]; }
}
