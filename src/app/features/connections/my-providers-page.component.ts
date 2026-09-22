import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PatientProviderConnection } from '../../core/models/patient-provider-connection.model';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';

@Component({
  selector: 'app-my-providers-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <header class="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-950 via-brand-800 to-violet-600 p-7 text-white shadow-xl shadow-brand-950/10 sm:p-10">
      <p class="text-sm font-bold uppercase tracking-[.18em] text-violet-200">Your hospital companion</p>
      <h1 class="mt-3 text-3xl font-black sm:text-4xl">{{ billsMode ? 'Pay a Hospital Bill' : 'Your Hospitals' }}</h1>
      <p class="mt-3 max-w-2xl text-lg text-violet-50">{{ billsMode ? 'Choose your hospital to review issued requests, prices and available payment options.' : 'Book care, pay, view records and handle hospital tasks from your phone — without the usual runaround.' }}</p>
      <a routerLink="/me/providers/connect" class="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 font-extrabold text-brand-900 shadow-sm">+ Connect another hospital</a>
    </header>

    @if (loading()) {
      <p role="status" class="mt-7 rounded-3xl border bg-white p-6">Loading your hospitals…</p>
    } @else if (error()) {
      <div role="alert" class="mt-7 rounded-3xl bg-red-50 p-6">We couldn't load your hospitals. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div>
    } @else if (!items().length) {
      <section class="mt-7 rounded-[2rem] border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-7 text-center shadow-sm">
        <div class="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-100 text-2xl">🏥</div>
        <h2 class="mt-4 text-2xl font-black text-brand-950">Connect your first hospital</h2>
        <p class="mx-auto mt-2 max-w-lg text-slate-600">Use SmartClinic as your digital front door to a hospital you already use, or register with a new one.</p>
        <a routerLink="/me/providers/connect" class="mt-5 inline-flex rounded-2xl bg-brand-700 px-5 py-3 font-bold text-white">Choose a hospital →</a>
      </section>
    } @else {
      <section class="mt-8">
        <div class="flex items-end justify-between gap-4">
          <div><p class="text-sm font-bold uppercase tracking-wider text-brand-600">Connected care</p><h2 class="mt-1 text-2xl font-black text-brand-950">Hospitals you use</h2></div>
          <a routerLink="/me/providers/connect" class="font-bold text-brand-700">Add hospital →</a>
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          @for (item of items(); track item.reference) {
            <article class="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
              <div class="flex items-start gap-4">
                <div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-emerald-50 text-2xl">🏥</div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-start justify-between gap-2"><h3 class="text-xl font-black text-brand-950">{{ item.provider.displayName }}</h3><span class="rounded-full px-3 py-1 text-xs font-bold" [class]="item.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'">{{ status(item.status) }}</span></div>
                  <p class="mt-1 text-sm text-slate-500">{{ item.provider.location.city || item.provider.location.stateOrRegion || 'SmartClinic network' }}</p>
                </div>
              </div>
              @if (item.externalPatientReference) { <p class="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Hospital ID <strong class="text-slate-900">{{ item.externalPatientReference }}</strong></p> }
              @if (item.status === 'CONNECTED') {
                <p class="mt-4 text-sm font-semibold text-slate-600">Your digital front door to this hospital.</p>
              }
              <a [routerLink]="['/me/providers', item.reference]" class="mt-5 flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 font-extrabold text-brand-800 group-hover:bg-brand-100">{{ billsMode ? 'Review bills' : 'Open hospital' }} <span>→</span></a>
            </article>
          }
        </div>
      </section>
    }

    <section class="mt-8 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/60 p-6">
      <p class="text-sm font-bold uppercase tracking-wider text-emerald-800">Why connect?</p>
      <h2 class="mt-1 text-xl font-black text-slate-900">Less queueing. More control.</h2>
      <p class="mt-2 text-slate-600">When a hospital supports a service, SmartClinic brings it to you here — appointments, payments, tests, medicine and records.</p>
    </section>
  </main>`,
})
export class MyProvidersPageComponent {
  readonly billsMode = inject(ActivatedRoute).snapshot.data['billsMode'] === true;
  private readonly api = inject(PatientProviderConnectionsApiService);
  readonly items = signal<readonly PatientProviderConnection[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() { this.load(); }
  load() { this.loading.set(true); this.error.set(false); this.api.listMine().pipe(finalize(() => this.loading.set(false))).subscribe({ next: p => this.items.set(p.items), error: () => this.error.set(true) }); }
  status(v: string) { return v === 'CONNECTED' ? 'Connected ✓' : v.split('_').map(x => x[0] + x.slice(1).toLowerCase()).join(' '); }
}