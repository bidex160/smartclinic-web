import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CareRequest } from '../../core/models/find-care.model';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { UtilsService } from '../../core/services/utils.service';

@Component({
  selector: 'app-care-detail-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <a routerLink="/me/care" class="font-bold text-brand-700 underline">← My Care</a>
      @if (loading()) { <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading Care Request…</p> }
      @else if (error()) { <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">We couldn't load this Care Request. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div> }
      @else if (request(); as r) {
        <header class="mt-6"><p class="text-sm font-bold uppercase text-brand-600">Care Request {{ r.reference }}</p><h1 class="mt-2 text-3xl font-bold">{{ r.service.name }}</h1><p class="mt-2 text-lg">{{ label(r.status) }}</p></header>
        <section class="mt-7 rounded-2xl border bg-white p-6"><dl class="grid gap-5 sm:grid-cols-2">
          <div><dt class="text-sm text-slate-500">Provider</dt><dd class="font-semibold">{{ r.assignedProvider?.displayName || r.preferredProvider?.displayName || 'SmartClinic is helping choose' }}</dd></div>
          <div><dt class="text-sm text-slate-500">Location</dt><dd>{{ r.geography.city }}, {{ r.geography.stateOrRegion }}, {{ r.geography.countryCode }}</dd></div>
          <div><dt class="text-sm text-slate-500">Requested appointment</dt><dd>{{ r.preferredDate ? utils.formatAppointment(r.preferredDate, r.preferredTime) : 'No date requested' }}</dd></div>
          <div><dt class="text-sm text-slate-500">Contact method</dt><dd>{{ r.contactMethod }}</dd></div>
          @if (r.notes) { <div class="sm:col-span-2"><dt class="text-sm text-slate-500">Request notes</dt><dd class="whitespace-pre-wrap">{{ r.notes }}</dd></div> }
        </dl><p class="mt-6 rounded-xl bg-slate-50 p-4">{{ nextStep(r.status) }}</p></section>
        @if (fastTrackEligible()) { <section class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6"><h2 class="text-xl font-bold">FastTrack available</h2><p class="mt-2">Request priority appointment handling with this provider. Clinical urgency and medical triage always take priority.</p>@if (actionError()) { <p role="alert" class="mt-3 text-red-700">{{ actionError() }}</p> }<button type="button" (click)="createFastTrack()" [disabled]="creating()" class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60">{{ creating() ? 'Creating FastTrack request…' : 'Request FastTrack' }}</button></section> }
      }
    </main>
  `,
})
export class CareDetailPageComponent {
  private readonly api=inject(CareRequestsApiService); private readonly find=inject(FindCareApiService); private readonly fast=inject(FastTrackApiService); private readonly router=inject(Router);
  readonly utils=inject(UtilsService); readonly reference=inject(ActivatedRoute).snapshot.paramMap.get('reference')??''; readonly request=signal<CareRequest|null>(null); readonly loading=signal(true); readonly error=signal(false); readonly fastTrackEligible=signal(false); readonly creating=signal(false); readonly actionError=signal<string|null>(null);
  constructor(){this.load();}
  load(){this.loading.set(true);this.error.set(false);this.api.get(this.reference).subscribe({next:r=>{this.request.set(r);this.loading.set(false);this.checkFastTrack(r);},error:()=>{this.error.set(true);this.loading.set(false);}});}
  private checkFastTrack(r:CareRequest){if(r.status!=='PROVIDER_ACCEPTED'||!r.assignedProvider)return;this.find.getProvider(r.assignedProvider.providerReference).subscribe({next:p=>this.fastTrackEligible.set(!!p.services.find(s=>s.code===r.service.code&&s.supportsFastTrack)),error:()=>this.fastTrackEligible.set(false)});}
  createFastTrack(){if(this.creating())return;this.creating.set(true);this.actionError.set(null);this.fast.createForCareRequest(this.reference).pipe(finalize(()=>this.creating.set(false))).subscribe({next:r=>void this.router.navigate(['/me/fasttrack',r.reference]),error:()=>this.actionError.set('FastTrack is not currently available for this Care Request. Refresh the request or try again later.')});}
  label(s:string){return ({MATCHING:'Finding a provider',AWAITING_PROVIDER_RESPONSE:'Waiting for provider',PROVIDER_ACCEPTED:'Provider accepted'} as Record<string,string>)[s]??s.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase());}
  nextStep(s:string){return ({MATCHING:'SmartClinic is looking for an eligible provider.',AWAITING_PROVIDER_RESPONSE:'The selected provider is reviewing your request.',PROVIDER_ACCEPTED:'Your provider has accepted this Care Request.',UNFULFILLABLE:'SmartClinic operations needs to review provider availability.'} as Record<string,string>)[s]??'Check this page for the latest backend-confirmed status.';}
}
