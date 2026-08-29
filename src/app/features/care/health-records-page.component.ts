import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClinicalRecord } from '../../core/models/clinical-record.model';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';

@Component({
  selector: 'app-health-records-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Patient Portal</p>
    <h1 class="mt-2 text-3xl font-bold text-brand-950">Health Records</h1>
    <p class="mt-2 text-slate-600">Review finalized clinical records shared through your General Care appointments.</p>
    @if (loading()) { <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading health records…</p> }
    @else if (error()) { <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">We couldn't load your health records. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div> }
    @else if (!records().length) { <section class="mt-8 rounded-2xl border bg-white p-8 text-center"><h2 class="text-xl font-bold">No finalized health records yet</h2><p class="mt-2 text-slate-600">Records will appear here after your provider finalizes them.</p></section> }
    @else { <div class="mt-8 grid gap-5 md:grid-cols-2">@for (record of records(); track record.reference) {
      <article class="rounded-2xl border bg-white p-6"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-sm font-bold text-brand-700">{{ typeLabel(record.recordType) }}</p><h2 class="mt-1 text-xl font-bold">{{ record.title }}</h2></div><span class="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-900">Finalized</span></div>
      <dl class="mt-5 grid gap-3 text-sm"><div><dt class="text-slate-500">Service</dt><dd>{{ record.service?.name || 'General Care' }}</dd></div><div><dt class="text-slate-500">Provider</dt><dd>{{ record.provider.displayName }}</dd></div><div><dt class="text-slate-500">Care date</dt><dd>{{ formatDate(record.occurredAt) }}</dd></div><div><dt class="text-slate-500">Finalized</dt><dd>{{ formatDate(record.finalizedAt) }}</dd></div></dl>
      <a [routerLink]="['/me/health-records', record.reference]" class="mt-5 inline-flex font-bold text-brand-700 underline">View clinical record</a></article>
    }</div> }
  </main>`,
})
export class HealthRecordsPageComponent {
  private readonly api = inject(ClinicalRecordsApiService);
  readonly records = signal<readonly ClinicalRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.error.set(false); this.api.listMine().pipe(finalize(() => this.loading.set(false))).subscribe({ next: page => this.records.set(page.items), error: () => this.error.set(true) }); }
  formatDate(value: string | null): string { return value ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value)) : '—'; }
  typeLabel(value: string): string { return value.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' '); }
}

