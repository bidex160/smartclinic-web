import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ClinicalOrder, FulfillmentDirectoryItem, PatientOrderFulfillment } from '../../core/models/pharmacy-fulfillment.model';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
@Component({selector:'app-patient-order-detail-page',imports:[RouterLink,ReactiveFormsModule],changeDetection:ChangeDetectionStrategy.OnPush,template:`
<main class="mx-auto max-w-4xl px-5 py-8 sm:px-8">
<a routerLink="/me/orders" class="font-bold text-brand-700 underline">← Tests & referrals</a>
@if (loading()) { <p class="mt-6">Loading…</p> }
@else if (order(); as o) {
<header class="mt-6 rounded-2xl border bg-white p-6"><p class="font-bold text-brand-700">{{ label(o.type) }}</p><h1 class="mt-2 text-2xl font-bold">{{ o.clinicalNote || 'Clinical request' }}</h1><p class="mt-2 text-slate-600">Requested by {{ o.orderingProvider.displayName }}</p></header>
@if (o.diagnosticItems?.length) { <section class="mt-5 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Requested {{ o.type === 'LABORATORY' ? 'tests' : 'studies' }}</h2><div class="mt-4 grid gap-3">@for (item of o.diagnosticItems!; track item.sortOrder) { <article class="rounded-xl bg-slate-50 p-4"><div class="flex justify-between gap-3"><strong>{{ item.name }}</strong>@if(item.resultedAt){<span class="text-xs font-bold text-green-700">RESULT READY</span>}</div>@if(item.instructions){<p class="mt-1 text-sm text-slate-600">{{item.instructions}}</p>}@if(item.resultedAt){<div class="mt-3 border-t pt-3"><p class="font-semibold">{{ item.resultValue || item.resultText || 'Result recorded' }} @if(item.resultUnit){<span>{{item.resultUnit}}</span>}</p>@if(item.referenceRange){<p class="text-sm text-slate-600">Reference: {{item.referenceRange}}</p>}@if(item.resultFlag){<p class="text-sm font-bold">{{item.resultFlag}}</p>}</div>}</article> }</div></section> }
@if (o.type === 'LABORATORY' || o.type === 'IMAGING' || o.type === 'REFERRAL' || o.type === 'PROCEDURE') {
  @if (fulfillment(); as f) {
    <section class="mt-5 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Your selected provider</h2><p class="mt-2"><strong>{{ unit(f)?.displayName }}</strong> · {{ unit(f)?.serviceUnitName }}</p><p class="mt-2">{{ status(f.status) }}</p>@if (f.status !== 'ACCEPTED') { <button type="button" (click)="change(f.reference)" class="mt-4 font-bold text-brand-700 underline">Choose another provider</button> }</section>
  } @else {
    <section class="mt-5 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Choose where to go</h2><p class="mt-1 text-slate-600">Select a connected {{ destinationLabel(o.type) }}. The receiving provider can then accept the handoff.</p><form [formGroup]="form" (ngSubmit)="search()" class="mt-4 flex gap-2"><input formControlName="q" class="min-h-12 flex-1 rounded-xl border px-3" placeholder="Search connected providers"><button class="rounded-xl border px-4 font-bold">Search</button></form>
    @if (searching()) { <p class="mt-4">Searching…</p> } @else { <div class="mt-4 grid gap-3 sm:grid-cols-2">@for (p of providers(); track p.providerServiceUnitReference) { <article class="rounded-xl border p-4"><h3 class="font-bold">{{ p.displayName }}</h3><p>{{ p.unitName }}</p><p class="text-sm text-slate-600">{{ p.location.city }}, {{ p.location.stateOrRegion }}</p><button type="button" (click)="select(p)" [disabled]="pending()" class="mt-3 rounded-lg bg-brand-700 px-4 py-2 font-bold text-white">Choose this provider</button></article> }</div> }
    </section>
  }
} @else {
  <section class="mt-5 rounded-2xl border bg-white p-6"><h2 class="text-xl font-bold">Referral instructions</h2><p class="mt-2 text-slate-700">{{ o.clinicalNote }}</p><p class="mt-4 text-sm text-slate-600">Your care team can guide you to the appropriate connected destination.</p></section>
}
}
@if (error()) { <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4">{{ error() }}</p> }
</main>`})
export class PatientOrderDetailPageComponent {
 private api=inject(PharmacyFulfillmentApiService); private route=inject(ActivatedRoute); private fb=inject(FormBuilder);
 readonly ref=this.route.snapshot.paramMap.get('reference')!; readonly order=signal<ClinicalOrder|null>(null); readonly fulfillment=signal<PatientOrderFulfillment|null>(null); readonly providers=signal<readonly FulfillmentDirectoryItem[]>([]); readonly loading=signal(true); readonly searching=signal(false); readonly pending=signal(false); readonly error=signal<string|null>(null); readonly form=this.fb.nonNullable.group({q:''});
 constructor(){this.load()}
 load(){this.api.getPatientOrder(this.ref).pipe(finalize(()=>this.loading.set(false))).subscribe({next:o=>{this.order.set(o);if(o.fulfillment?.reference)this.api.getPatientFulfillment(o.fulfillment.reference).subscribe({next:f=>this.fulfillment.set(f)});else if(['LABORATORY','IMAGING','REFERRAL','PROCEDURE'].includes(o.type))this.search()},error:()=>this.error.set('This clinical request is unavailable.')})}
 search(){const o=this.order();if(!o||!['LABORATORY','IMAGING','REFERRAL','PROCEDURE'].includes(o.type))return;this.searching.set(true);this.api.searchFulfillmentProviders(o.type as 'LABORATORY'|'IMAGING'|'REFERRAL'|'PROCEDURE',{q:this.form.controls.q.value,page:1,limit:20}).pipe(finalize(()=>this.searching.set(false))).subscribe({next:p=>this.providers.set(p.items),error:()=>this.error.set('Connected providers could not be loaded.')})}
 select(p:FulfillmentDirectoryItem){this.pending.set(true);this.api.selectFulfillment(this.ref,p.providerServiceUnitReference).pipe(finalize(()=>this.pending.set(false))).subscribe({next:(x:any)=>this.api.getPatientFulfillment(x.reference).subscribe(f=>this.fulfillment.set(f)),error:()=>this.error.set('This provider could not be selected.')})}
 change(r:string){this.api.cancelPatientFulfillment(r).subscribe({next:()=>{this.fulfillment.set(null);this.search()},error:()=>this.error.set('The provider selection could not be changed.')})}
 destinationLabel(t:string){return t==='LABORATORY'?'laboratory':t==='IMAGING'?'imaging centre':t==='REFERRAL'?'specialist service':'procedure / follow-up service'}
 unit(f:PatientOrderFulfillment){return f.serviceUnit||f.pharmacy} label(t:string){return t==='LABORATORY'?'Laboratory request':t==='IMAGING'?'Imaging request':t==='REFERRAL'?'Referral':'Procedure / follow-up'} status(s:string){return ({PROPOSED:'Recommended by your clinician',SELECTED:'Selected — waiting for provider acceptance',ACCEPTED:'Accepted by provider',CANCELLED:'Selection cancelled'} as Record<string,string>)[s]||s}
}