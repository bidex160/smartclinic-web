import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ClinicalRecordAccessRequest } from '../../core/models/clinical-record.model';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';

@Component({
  selector: 'app-health-record-access-requests-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-5xl px-5 py-10 sm:px-8">
    <a routerLink="/me/health-records" class="font-bold text-brand-700 underline">← Health Records</a>
    <header class="mt-5"><h1 class="text-3xl font-bold">Access Requests</h1><p class="mt-2 text-slate-600">Review provider requests. A request does not grant access until you explicitly approve it.</p></header>
    @if (loading()) { <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading access requests…</p> }
    @else if (loadError()) { <p role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">We couldn't load access requests. <button type="button" (click)="load()" class="font-bold underline">Try again</button></p> }
    @else if (!items().length) { <section class="mt-8 rounded-2xl border bg-white p-8 text-center"><h2 class="text-xl font-bold">No access requests</h2><p class="mt-2 text-slate-600">Provider requests will appear here for your review.</p></section> }
    @else { <div class="mt-8 grid gap-5">@for (request of items(); track request.reference) {
      <article class="rounded-2xl border bg-white p-6"><div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="text-xl font-bold">{{request.provider.displayName}}</h2><p class="text-sm text-slate-600">{{request.provider.providerType}}</p></div><strong>{{statusLabel(request.status)}}</strong></div>
      <dl class="mt-5 grid gap-4 sm:grid-cols-2"><div><dt class="text-sm text-slate-500">Requested access</dt><dd class="font-bold">{{scopeLabel(request)}}</dd></div><div><dt class="text-sm text-slate-500">Reason</dt><dd>{{request.reason}}</dd></div><div><dt class="text-sm text-slate-500">Requested until</dt><dd>{{request.requestedExpiresAt ? date(request.requestedExpiresAt) : 'No requested expiry'}}</dd></div><div><dt class="text-sm text-slate-500">Request date</dt><dd>{{date(request.createdAt)}}</dd></div></dl>
      @if (request.status === 'PENDING') { <section class="mt-5 rounded-xl bg-slate-50 p-4"><h3 class="font-bold">{{connectionHeading(request)}}</h3><p class="mt-1 text-sm">{{connectionCopy(request)}}</p>
        <div class="mt-4 flex flex-wrap gap-3"><button type="button" (click)="askDecline(request)" [disabled]="busyReference()===request.reference" class="rounded-xl border border-red-200 px-4 py-2 font-bold text-red-700">Decline</button>
        @if (request.connection?.eligible) { <button type="button" (click)="approve(request)" [disabled]="busyReference()===request.reference" class="rounded-xl bg-brand-700 px-4 py-2 font-bold text-white">{{busyReference()===request.reference?'Approving…':'Approve access'}}</button> }
        @else if (request.connection?.reference) { <a [routerLink]="['/me/providers',request.connection?.reference]" class="rounded-xl bg-brand-700 px-4 py-2 font-bold text-white">{{request.connection?.status==='AWAITING_FUNDING'?'Continue connection':'View connection'}}</a> }
        @else { <a routerLink="/me/providers/connect" [queryParams]="{ returnUrl: '/me/health-records/access-requests', providerReference: request.provider.providerReference }" class="rounded-xl bg-brand-700 px-4 py-2 font-bold text-white">Connect with provider</a> }</div></section> }
      @if (request.status === 'APPROVED') { <p class="mt-5 rounded-xl bg-green-50 p-4 font-bold">Access approved. {{request.provider.displayName}} can access finalized health records covered by this permission.</p>@if(request.approvedGrantReference){<a [routerLink]="['/me/health-records/sharing',request.approvedGrantReference]" class="mt-3 inline-block font-bold text-brand-700 underline">Manage sharing</a>} }
      @if (request.status === 'DECLINED') { <p class="mt-5 rounded-xl bg-slate-50 p-4 font-bold">Request declined</p> }
      @if (request.status === 'EXPIRED') { <p class="mt-5 rounded-xl bg-amber-50 p-4"><strong>Request expired.</strong> This request can no longer be approved.</p> }
      @if (actionError() && errorReference()===request.reference) { <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4">{{actionError()}}</p> }
      </article> }</div> }
    @if (declining(); as request) { <div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="decline-title"><section class="w-full max-w-md rounded-2xl bg-white p-6"><h2 id="decline-title" class="text-xl font-bold">Decline access request?</h2><p class="mt-3">{{request.provider.displayName}} will not receive access to your health records from this request.</p><div class="mt-6 flex justify-end gap-3"><button type="button" (click)="declining.set(null)" class="rounded-xl border px-4 py-2 font-bold">Cancel</button><button type="button" (click)="confirmDecline()" [disabled]="busyReference()===request.reference" class="rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Decline request</button></div></section></div> }
  </main>`,
})
export class HealthRecordAccessRequestsPageComponent {
  private readonly api = inject(ClinicalRecordsApiService);
  readonly items = signal<readonly ClinicalRecordAccessRequest[]>([]); readonly loading = signal(true); readonly loadError = signal(false); readonly busyReference = signal(''); readonly errorReference = signal(''); readonly actionError = signal(''); readonly declining = signal<ClinicalRecordAccessRequest | null>(null);
  constructor() { this.load(); }
  load() { this.loading.set(true); this.loadError.set(false); this.api.listPatientAccessRequests(1, 100).pipe(finalize(() => this.loading.set(false))).subscribe({ next: page => this.items.set(page.items), error: () => this.loadError.set(true) }); }
  approve(request: ClinicalRecordAccessRequest) { if (!request.connection?.eligible || this.busyReference()) return; this.start(request); this.api.approveAccessRequest(request.reference).pipe(finalize(() => this.busyReference.set(''))).subscribe({ next: updated => this.replace(updated), error: () => this.fail(request, 'Access could not be approved. Review the connection status and try again.') }); }
  askDecline(request: ClinicalRecordAccessRequest) { this.declining.set(request); }
  confirmDecline() { const request = this.declining(); if (!request || this.busyReference()) return; this.start(request); this.api.declineAccessRequest(request.reference).pipe(finalize(() => this.busyReference.set(''))).subscribe({ next: updated => { this.replace(updated); this.declining.set(null); }, error: () => { this.declining.set(null); this.fail(request, 'The request could not be declined. Please try again.'); } }); }
  private start(request: ClinicalRecordAccessRequest) { this.actionError.set(''); this.errorReference.set(request.reference); this.busyReference.set(request.reference); }
  private fail(request: ClinicalRecordAccessRequest, message: string) { this.errorReference.set(request.reference); this.actionError.set(message); }
  private replace(updated: ClinicalRecordAccessRequest) { this.items.update(items => items.map(item => item.reference === updated.reference ? updated : item)); }
  connectionHeading(request: ClinicalRecordAccessRequest) { if (request.connection?.eligible) return 'Connection: Connected'; return request.connection?.status === 'AWAITING_FUNDING' ? 'Connection payment required' : request.connection?.status === 'SUBMITTED' ? 'Connection awaiting provider confirmation' : request.connection?.status === 'UNABLE_TO_VERIFY' ? 'Connection could not be verified' : request.connection?.status === 'REJECTED' ? 'Connection not approved' : request.connection?.status === 'CANCELLED' ? 'Connection cancelled' : 'Connection required'; }
  connectionCopy(request: ClinicalRecordAccessRequest) { if (request.connection?.eligible) return 'Approving allows access only to the finalized records covered by this request until the sharing permission expires.'; if (request.connection?.status === 'SUBMITTED') return 'Your connection request is submitted. You can approve record access after the provider confirms it.'; return `Connect with ${request.provider.displayName} before approving this request.`; }
  scopeLabel(request: ClinicalRecordAccessRequest) { return request.scope === 'ALL_RECORDS' ? 'All finalized records' : request.scope === 'RECORD_TYPE' ? `${this.label(request.recordType ?? '')} records` : `Single finalized record (${request.clinicalRecordReference})`; }
  statusLabel(value: string) { return value === 'APPROVED' ? 'Access approved' : value === 'DECLINED' ? 'Request declined' : value === 'EXPIRED' ? 'Request expired' : 'Pending'; }
  label(value: string) { return value.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' '); }
  date(value: string) { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
}
