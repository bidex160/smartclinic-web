import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { HmoApiService } from '../../core/services/hmo-api.service';
import { HmoCase, HmoEnrollmentLead, HmoFunnel } from '../../core/models/hmo.model';

@Component({
  selector: 'app-hmo-desk-page',
  template: `<main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <div class="flex flex-wrap items-end justify-between gap-4"><div><p class="text-sm font-bold uppercase tracking-widest text-brand-700">SmartClinic Exchange</p><h1 class="mt-2 text-3xl font-black text-slate-950">HMO Desk</h1><p class="mt-2 max-w-3xl text-slate-600">Eligibility, authorization, care, claims and new plan enquiries.</p></div><button (click)="load()" class="rounded-xl border border-brand-600 px-4 py-2 font-bold text-brand-700">Refresh</button></div>
    @if(funnel();as f){<section class="mt-7 grid gap-3 sm:grid-cols-4 lg:grid-cols-7">@for(x of cards(f);track x.label){<article class="rounded-2xl border border-slate-200 bg-white p-4"><div class="text-xs font-bold uppercase text-slate-500">{{x.label}}</div><div class="mt-2 text-2xl font-black">{{x.value}}</div></article>}</section>}
    @if(error()){<div role="alert" class="mt-6 rounded-2xl bg-red-50 p-5 text-red-900">HMO Desk could not be loaded. Retry before acting on a case.</div>}
    <section class="mt-8"><h2 class="text-2xl font-black">Plan enrolment follow-up</h2><p class="mt-2 text-slate-600">Contact these patients and the selected HMO to confirm availability, plan terms and payment. The quoted plan price is a snapshot; no payment or coverage is created by the request.</p>
      @if(loading()){<p class="mt-4">Loading enrolment requests…</p>}
      @else if(!leads().length){<p class="mt-4 rounded-2xl border bg-white p-5">No plan enrolment requests are waiting.</p>}
      @else{<div class="mt-4 grid gap-3">@for(lead of leads();track lead.id){<article class="rounded-2xl border bg-white p-5"><div class="flex flex-wrap justify-between gap-2"><h3 class="font-black">{{lead.preferredHmo?.name || 'No HMO preference'}} · {{lead.plan?.name || 'Plan details requested'}}</h3><span class="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold">{{lead.status}}</span></div><p class="mt-2 font-semibold">{{lead.patient?.givenName}} {{lead.patient?.familyName}} · {{lead.patient?.patientReference}}</p><p class="text-sm">{{lead.patient?.phone || lead.patient?.email || 'No contact details on file'}}</p>@if(lead.quotedAmountMinor && lead.quotedCurrency){<p class="mt-2 font-bold">Quoted price: {{money(lead.quotedAmountMinor, lead.quotedCurrency)}} / {{period(lead.plan?.billingPeriod || 'MONTHLY')}}</p>}<p class="mt-2 text-xs text-slate-500">Submitted {{date(lead.createdAt)}} · Contact consent is limited to this enrolment follow-up.</p>@if(lead.status === 'NEW'){<div class="mt-4 flex gap-2"><button type="button" (click)="updateLead(lead.id, 'CONTACTED')" class="rounded-lg border px-3 py-2 text-sm font-bold">Mark contacted</button><button type="button" (click)="updateLead(lead.id, 'CLOSED')" class="rounded-lg border px-3 py-2 text-sm font-bold">Close request</button></div>}</article>}</div>}
    </section>
    <section class="mt-10"><h2 class="text-2xl font-black">Active HMO cases</h2><div class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table class="min-w-full text-left"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="p-4">Patient</th><th class="p-4">HMO</th><th class="p-4">Member ID</th><th class="p-4">Eligibility</th><th class="p-4">Authorization</th><th class="p-4">Care</th><th class="p-4">Claim</th></tr></thead><tbody>@for(c of cases();track c.reference){<tr class="border-t border-slate-100"><td class="p-4 font-bold">{{c.coverage.patientId}}</td><td class="p-4">{{c.coverage.hmo?.name}}</td><td class="p-4 font-mono">{{c.coverage.memberId}}</td><td class="p-4"><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{{c.eligibilityStatus}}</span></td><td class="p-4">Open case</td><td class="p-4">{{c.careRequest?.reference}}</td><td class="p-4">—</td></tr>} @if(!loading()&&!cases().length){<tr><td colspan="7" class="p-8 text-center text-slate-500">No HMO cases yet.</td></tr>}</tbody></table></div></section>
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmoDeskPageComponent {
  private api = inject(HmoApiService);
  cases = signal<HmoCase[]>([]);
  leads = signal<readonly HmoEnrollmentLead[]>([]);
  funnel = signal<HmoFunnel | null>(null);
  loading = signal(false);
  error = signal(false);
  constructor() { this.load(); }
  load() {
    this.loading.set(true); this.error.set(false);
    this.api.desk().pipe(finalize(() => this.loading.set(false))).subscribe({ next: v => this.cases.set(v), error: () => this.error.set(true) });
    this.api.enrollmentLeads().subscribe({ next: v => this.leads.set(v), error: () => this.error.set(true) });
    this.api.funnel().subscribe({ next: v => this.funnel.set(v) });
  }
  updateLead(id: string, status: 'CONTACTED' | 'CLOSED') {
    this.api.updateEnrollmentLead(id, status).subscribe({ next: () => this.api.enrollmentLeads().subscribe({ next: rows => this.leads.set(rows) }), error: () => this.error.set(true) });
  }
  cards(f: HmoFunnel) { return [{ label: 'Eligible', value: f.eligibility }, { label: 'Authorized', value: f.authorization }, { label: 'Care complete', value: f.careCompleted }, { label: 'Claims submitted', value: f.claimsSubmitted }, { label: 'Paid', value: f.paid }, { label: 'Reconciled', value: f.reconciled }, { label: 'Primed revenue', value: '₦' + (Number(f.primedRevenueMinor) / 100).toLocaleString() }]; }
  money(minor: string, currency: string) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minor) / 100); }
  period(value: string) { return value.toLowerCase(); }
  date(value: string) { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value)); }
}
