import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClinicalRecordAccessGrant } from '../../core/models/clinical-record.model';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';

@Component({
  selector: 'app-health-record-sharing-page', imports: [RouterLink], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <a routerLink="/me/health-records" class="font-bold text-brand-700 underline">← Health Records</a>
    <div class="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-3xl font-bold">Manage sharing</h1><p class="mt-2 text-slate-600">You control which providers can view your health records. Access can be revoked at any time.</p></div><div class="flex flex-wrap gap-3"><a routerLink="/me/health-records/access-history" class="rounded-xl border px-4 py-3 font-bold">Access history</a><a routerLink="/me/health-records/sharing/new" class="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white">Share health records</a></div></div>
    @if (loading()) { <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading sharing settings…</p> }
    @else if (error()) { <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">We couldn't load your sharing settings. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div> }
    @else if (!grants().length) { <section class="mt-8 rounded-2xl border bg-white p-8 text-center"><h2 class="text-xl font-bold">No health record access has been shared</h2><p class="mt-2 text-slate-600">Providers will only see records you explicitly authorize.</p><a routerLink="/me/health-records/sharing/new" class="mt-5 inline-flex rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">Share health records</a></section> }
    @else { <div class="mt-8 overflow-x-auto rounded-2xl border bg-white"><table class="min-w-full divide-y"><thead class="bg-slate-50"><tr>@for (heading of ['Provider','Scope','Shared access','Granted','Expires','Status','Action']; track heading) { <th class="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">{{ heading }}</th> }</tr></thead><tbody class="divide-y">@for (grant of grants(); track grant.reference) { <tr><td class="px-5 py-4 font-bold">{{ grant.provider.displayName }}</td><td class="px-5 py-4">{{ scopeLabel(grant) }}</td><td class="px-5 py-4">{{ accessLabel(grant) }}</td><td class="px-5 py-4">{{ date(grant.grantedAt) }}</td><td class="px-5 py-4">{{ grant.expiresAt ? date(grant.expiresAt) : 'No expiry' }}</td><td class="px-5 py-4"><span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{{ statusLabel(grant.status) }}</span></td><td class="px-5 py-4"><div class="flex gap-3"><a [routerLink]="['/me/health-records/sharing', grant.reference]" class="font-bold text-brand-700 underline">View</a>@if (grant.status === 'ACTIVE') { <button type="button" (click)="revoke(grant)" [disabled]="revoking() === grant.reference" class="font-bold text-red-700 underline">{{ revoking() === grant.reference ? 'Revoking…' : 'Revoke' }}</button> }</div></td></tr> }</tbody></table></div> }
    @if (mutationError()) { <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ mutationError() }}</p> }
  </main>`,
})
export class HealthRecordSharingPageComponent {
  private readonly api = inject(ClinicalRecordsApiService); readonly grants = signal<readonly ClinicalRecordAccessGrant[]>([]); readonly loading = signal(true); readonly error = signal(false); readonly revoking = signal<string | null>(null); readonly mutationError = signal('');
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.error.set(false); this.api.listAccessGrants().pipe(finalize(() => this.loading.set(false))).subscribe({ next: p => this.grants.set(p.items), error: () => this.error.set(true) }); }
  revoke(grant: ClinicalRecordAccessGrant): void { if (grant.status !== 'ACTIVE' || this.revoking() || !window.confirm(`Revoke health record access?\n\n${grant.provider.displayName} will no longer be able to open records covered by this grant. Previously issued temporary attachment links may remain valid until they expire.`)) return; this.revoking.set(grant.reference); this.mutationError.set(''); this.api.revokeAccessGrant(grant.reference).pipe(finalize(() => this.revoking.set(null))).subscribe({ next: () => this.load(), error: () => this.mutationError.set('Unable to revoke access. Please refresh and try again.') }); }
  scopeLabel(g: ClinicalRecordAccessGrant): string { return g.scope === 'ALL_RECORDS' ? 'All records' : g.scope === 'RECORD_TYPE' ? 'Record type' : 'Single record'; }
  accessLabel(g: ClinicalRecordAccessGrant): string { return g.scope === 'ALL_RECORDS' ? 'All finalized health records' : g.scope === 'RECORD_TYPE' ? `${this.typeLabel(g.recordType)} records` : g.clinicalRecord?.title ?? 'Selected health record'; }
  statusLabel(v: string): string { return v[0] + v.slice(1).toLowerCase(); }
  typeLabel(v: string | null): string { return v ? v.split('_').map(x => x[0] + x.slice(1).toLowerCase()).join(' ') : '—'; }
  date(v: string): string { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(v)); }
}
