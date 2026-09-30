import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PatientProviderConnection } from '../../core/models/patient-provider-connection.model';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';

@Component({
  selector: 'app-my-providers-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <header class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-950 via-brand-900 to-violet-800 p-6 text-white shadow-lg sm:p-8">
        <div class="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl"></div>
        <div class="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-100">My care network</p>
            <h1 class="mt-2 text-3xl font-black sm:text-4xl">My Hospitals</h1>
            <p class="mt-2 max-w-2xl text-brand-50">Open a connected hospital to see supported care, requests, bills and records in one place.</p>
          </div>
          <a routerLink="/me/providers/connect" class="min-h-12 rounded-xl bg-white px-5 py-3 font-bold text-brand-900 shadow-sm">Connect a hospital</a>
        </div>
      </header>

      @if (loading()) {
        <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading your hospitals…</p>
      } @else if (error()) {
        <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">We couldn't load your hospitals. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div>
      } @else if (!items().length) {
        <section class="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span class="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-100 text-2xl" aria-hidden="true">🏥</span>
          <h2 class="mt-4 text-xl font-bold">No hospitals connected yet</h2>
          <p class="mt-2 text-slate-600">Connect a hospital as a new patient or link an existing hospital patient number.</p>
          <a routerLink="/me/providers/connect" class="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-700 px-5 font-bold text-white">Choose a hospital</a>
        </section>
      } @else {
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          @for (item of items(); track item.reference) {
            <article class="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div class="h-2 bg-gradient-to-r from-brand-700 via-violet-500 to-emerald-500" aria-hidden="true"></div>
              <div class="p-5 sm:p-6">
                <div class="flex items-start gap-4">
                  <span class="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-lg font-black text-brand-800" aria-hidden="true">{{ initials(item.provider.displayName) }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="text-xs font-bold uppercase tracking-wider text-brand-700">{{ providerType(item.provider.providerType) }}</p>
                      <span class="rounded-full px-3 py-1 text-xs font-bold" [class]="statusTone(item.status)">{{ status(item.status) }}</span>
                    </div>
                    <h2 class="mt-2 text-xl font-black leading-tight text-brand-950">{{ item.provider.displayName }}</h2>
                  </div>
                </div>

                @if (item.externalPatientReference) {
                  <div class="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Your hospital number</p>
                    <p class="mt-1 break-all font-mono font-bold text-slate-900">{{ item.externalPatientReference }}</p>
                  </div>
                } @else {
                  <p class="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">{{ connectionHelp(item.status) }}</p>
                }

                <div class="mt-5 flex flex-wrap gap-3">
                  <a [routerLink]="['/me/providers', item.reference]" class="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-700 px-4 font-bold text-white">Open hospital</a>
                  @if (item.status === 'CONNECTED') {
                    <a routerLink="/me/pay-bills" class="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 px-4 font-bold text-brand-800">View bills</a>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    </main>
  `,
})
export class MyProvidersPageComponent {
  private readonly api = inject(PatientProviderConnectionsApiService);
  readonly items = signal<readonly PatientProviderConnection[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.listMine().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: response => this.items.set(response.items),
      error: () => this.error.set(true),
    });
  }

  status(value: string): string {
    return value.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' ');
  }

  statusTone(value: string): string {
    if (value === 'CONNECTED') return 'bg-emerald-50 text-emerald-800';
    if (value === 'REJECTED' || value === 'CANCELLED') return 'bg-red-50 text-red-800';
    return 'bg-amber-50 text-amber-800';
  }

  connectionHelp(value: string): string {
    if (value === 'AWAITING_FUNDING') return 'A connection fee or confirmation is still required.';
    if (value === 'UNABLE_TO_VERIFY') return 'The hospital needs more information to verify this connection.';
    if (value === 'REJECTED' || value === 'CANCELLED') return 'This connection is not active. Open it to review the next step.';
    return 'The hospital is reviewing your connection.';
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'H';
  }

  providerType(value: string): string {
    return value === 'HOSPITAL' ? 'Hospital' : value.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' ');
  }
}
