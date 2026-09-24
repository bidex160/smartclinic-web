import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SmartClinicCatalogueCategory, SmartClinicServiceCatalogueItem } from '../../core/models/service-catalogue.model';
import { ServiceCatalogueApiService } from '../../core/services/service-catalogue-api.service';
import { formatMinor } from '../provider/care-money';

@Component({selector:'app-patient-service-catalogue-page',imports:[RouterLink,ReactiveFormsModule],changeDetection:ChangeDetectionStrategy.OnPush,template:`
<main class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
<a routerLink="/me/dashboard" class="font-bold text-brand-700">← Home</a>
<header class="mt-5 rounded-[2rem] border bg-white p-6 shadow-sm"><p class="text-xs font-bold uppercase tracking-[.2em] text-brand-700">SmartClinic catalogue</p><h1 class="mt-2 text-3xl font-black">{{category==='LAB_TEST'?'Lab tests':'Common medicines'}}</h1><p class="mt-2 text-slate-600">{{category==='LAB_TEST'?'Browse common laboratory tests and see a standard SmartClinic price before choosing a laboratory.':'Browse common medicines and indicative SmartClinic prices. Prescription medicines remain linked to a clinician prescription.'}}</p></header>
<form [formGroup]="form" (ngSubmit)="load()" class="mt-5 flex gap-2"><input formControlName="q" class="min-h-12 flex-1 rounded-xl border px-4" [placeholder]="category==='LAB_TEST'?'Search tests':'Search medicines'"><button class="rounded-xl bg-brand-700 px-5 font-bold text-white">Search</button></form>
@if(loading()){<p class="mt-6 rounded-xl border bg-white p-5">Loading catalogue…</p>} @else if(error()){<p class="mt-6 rounded-xl bg-red-50 p-5">Catalogue unavailable right now. <button (click)="load()" class="font-bold underline">Try again</button></p>} @else {
<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">@for(item of items();track item.code){<article class="rounded-2xl border bg-white p-5 shadow-sm"><div class="flex items-start justify-between gap-3"><h2 class="text-lg font-black text-brand-950">{{item.name}}</h2>@if(item.requiresPrescription){<span class="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">PRESCRIPTION</span>}</div>@if(item.description){<p class="mt-2 text-sm text-slate-600">{{item.description}}</p>}<p class="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">SmartClinic standard price</p><p class="mt-1 text-2xl font-black">{{money(item.standardPriceMinor,item.currency)}}</p><p class="mt-1 text-xs text-slate-500">Final provider price is confirmed before payment.</p>@if(category==='LAB_TEST'){<a routerLink="/me/orders" class="mt-4 inline-flex font-bold text-brand-700">My tests →</a>} @else {<a routerLink="/me/prescriptions" class="mt-4 inline-flex font-bold text-brand-700">My prescriptions →</a>}</article>}</div>
@if(!items().length){<p class="mt-6 rounded-2xl border bg-white p-7 text-center">No matching items.</p>}
}</main>`})
export class PatientServiceCataloguePageComponent{
 private api=inject(ServiceCatalogueApiService);private fb=inject(FormBuilder);readonly form=this.fb.nonNullable.group({q:''});readonly loading=signal(true);readonly error=signal(false);readonly items=signal<readonly SmartClinicServiceCatalogueItem[]>([]);
 readonly category:SmartClinicCatalogueCategory=location.pathname.includes('medicines')?'MEDICATION':'LAB_TEST';
 constructor(){this.load()} load(){this.loading.set(true);this.error.set(false);this.api.list(this.category,this.form.controls.q.value).pipe(finalize(()=>this.loading.set(false))).subscribe({next:x=>this.items.set(x),error:()=>this.error.set(true)})} money(v:number,c:string){return formatMinor(v,c)}
}
