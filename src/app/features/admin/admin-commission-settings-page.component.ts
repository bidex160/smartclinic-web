import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminProviderListItem } from '../../core/models/admin-provider.model';
import { PlatformCommissionResponse, ProviderCommissionResponse } from '../../core/models/admin-commission.model';
import { AdminCommissionApiService } from '../../core/services/admin-commission-api.service';
import { AdminProvidersApiService } from '../../core/services/admin-providers-api.service';
import { basisPointsToPercentage, formatCommission, percentageToBasisPoints } from './commission-percentage';

@Component({
  selector: 'app-admin-commission-settings-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Operations · Commercial settings</p>
    <h1 class="mt-2 text-3xl font-bold text-brand-950">Commission Settings</h1>
    <p class="mt-3 max-w-3xl text-slate-600">Commission is deducted from provider revenue after a paid service. It is not added as a patient surcharge. Provider overrides take precedence over the platform default.</p>
    @if (feedback()) { <p aria-live="polite" class="mt-6 rounded-xl bg-green-50 p-4 font-semibold text-green-950">{{ feedback() }}</p> }

    <section class="mt-8 rounded-2xl border bg-white p-6" aria-labelledby="platform-commission-title">
      <h2 id="platform-commission-title" class="text-xl font-bold">Platform default provider commission</h2>
      @if (platformLoading()) { <p role="status" class="mt-4">Loading platform commission…</p> }
      @else if (platformError()) { <div role="alert" class="mt-4 rounded-xl bg-red-50 p-4">We could not load the platform commission. <button type="button" (click)="loadPlatform()" class="font-bold underline">Try again</button></div> }
      @else if (platform(); as current) {
        <dl class="mt-5 grid gap-4 sm:grid-cols-2"><div><dt class="text-sm text-slate-500">Configured state</dt><dd class="font-bold">{{ current.configured ? 'Configured' : 'Not configured' }}</dd></div><div><dt class="text-sm text-slate-500">Current default</dt><dd class="text-2xl font-bold">{{ format(current.commissionBasisPoints) }}</dd></div></dl>
        <form [formGroup]="platformForm" (ngSubmit)="savePlatform()" class="mt-6 max-w-sm">
          <label for="platform-rate" class="font-semibold">Commission percentage</label>
          <div class="mt-2 flex items-center"><input id="platform-rate" formControlName="percentage" inputmode="decimal" placeholder="10" class="min-h-12 w-full rounded-l-xl border p-3" aria-describedby="platform-rate-help" /><span class="flex min-h-12 items-center rounded-r-xl border border-l-0 bg-slate-50 px-4 font-bold">%</span></div>
          <p id="platform-rate-help" class="mt-2 text-sm text-slate-500">Enter 0 to 100, with up to two decimal places.</p>
          @if (platformInputError()) { <p role="alert" class="mt-2 text-sm text-red-700">Enter a percentage from 0 to 100 with no more than two decimal places.</p> }
          @if (platformMutationError()) { <p role="alert" class="mt-3 rounded-xl bg-red-50 p-3 text-red-900">{{ platformMutationError() }}</p> }
          <button type="submit" [disabled]="platformSaving()" class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60">{{ platformSaving() ? 'Saving…' : 'Save platform default' }}</button>
        </form>
      }
    </section>

    <section class="mt-8 rounded-2xl border bg-white p-6" aria-labelledby="provider-commission-title">
      <h2 id="provider-commission-title" class="text-xl font-bold">Provider commission override</h2>
      <p class="mt-2 text-slate-600">Search for a provider, then configure an explicit override or restore platform inheritance.</p>
      <form [formGroup]="searchForm" (ngSubmit)="searchProviders()" class="mt-5 flex max-w-2xl flex-col gap-3 sm:flex-row"><label class="flex-1 font-semibold">Provider name or email<input formControlName="query" class="mt-2 min-h-12 w-full rounded-xl border p-3" placeholder="Search providers" /></label><button type="submit" [disabled]="providerSearching()" class="self-end rounded-xl border border-brand-700 px-5 py-3 font-bold text-brand-700">{{ providerSearching() ? 'Searching…' : 'Search' }}</button></form>
      @if (searchError()) { <p role="alert" class="mt-3 text-red-700">We could not search providers. Try again.</p> }
      @if (providerResults().length) { <div class="mt-4 grid gap-2">@for (provider of providerResults(); track provider.id) { <button type="button" (click)="selectProvider(provider)" class="rounded-xl border p-4 text-left hover:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"><span class="block font-bold">{{ provider.displayName }}</span><span class="text-sm text-slate-600">{{ provider.email || 'No email' }} · {{ provider.providerType.replaceAll('_', ' ') }}</span></button> }</div> }

      @if (selectedProvider(); as provider) {
        <div class="mt-6 rounded-2xl bg-slate-50 p-5"><h3 class="text-lg font-bold">{{ provider.displayName }}</h3>
          @if (providerLoading()) { <p role="status" class="mt-3">Loading provider commission…</p> }
          @else if (providerError()) { <div role="alert" class="mt-3">We could not load this provider's commission. <button type="button" (click)="loadProviderCommission()" class="font-bold underline">Try again</button></div> }
          @else if (providerCommission(); as commission) {
            <dl class="mt-4 grid gap-4 sm:grid-cols-3"><div><dt class="text-sm text-slate-500">Platform default</dt><dd class="font-bold">{{ format(commission.platformDefaultBasisPoints) }}</dd></div><div><dt class="text-sm text-slate-500">Provider override</dt><dd class="font-bold">{{ format(commission.providerOverrideBasisPoints) }}</dd></div><div><dt class="text-sm text-slate-500">Effective commission</dt><dd class="font-bold">{{ effectiveLabel(commission) }}</dd></div></dl>
            <form [formGroup]="providerForm" (ngSubmit)="saveProviderOverride()" class="mt-5 max-w-sm"><label class="font-semibold">Override percentage<div class="mt-2 flex"><input formControlName="percentage" inputmode="decimal" class="min-h-12 w-full rounded-l-xl border p-3" placeholder="7.5" /><span class="flex items-center rounded-r-xl border border-l-0 bg-white px-4 font-bold">%</span></div></label>
              @if (providerInputError()) { <p role="alert" class="mt-2 text-sm text-red-700">Enter a percentage from 0 to 100 with no more than two decimal places.</p> }
              @if (providerMutationError()) { <p role="alert" class="mt-3 rounded-xl bg-red-50 p-3 text-red-900">{{ providerMutationError() }}</p> }
              <div class="mt-4 flex flex-wrap gap-3"><button type="submit" [disabled]="providerSaving()" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60">{{ providerSaving() ? 'Saving…' : 'Save override' }}</button>@if (commission.providerOverrideBasisPoints !== null) { <button type="button" (click)="removeProviderOverride()" [disabled]="providerSaving()" class="rounded-xl border px-5 py-3 font-bold">Remove override</button> }</div>
            </form>
          }
        </div>
      }
    </section>
  </main>`,
})
export class AdminCommissionSettingsPageComponent {
  private readonly api = inject(AdminCommissionApiService);
  private readonly providersApi = inject(AdminProvidersApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly platform = signal<PlatformCommissionResponse | null>(null);
  readonly platformLoading = signal(true); readonly platformError = signal(false); readonly platformSaving = signal(false); readonly platformInputError = signal(false); readonly platformMutationError = signal<string | null>(null);
  readonly providerResults = signal<readonly AdminProviderListItem[]>([]); readonly selectedProvider = signal<AdminProviderListItem | null>(null); readonly providerCommission = signal<ProviderCommissionResponse | null>(null);
  readonly providerSearching = signal(false); readonly searchError = signal(false); readonly providerLoading = signal(false); readonly providerError = signal(false); readonly providerSaving = signal(false); readonly providerInputError = signal(false); readonly providerMutationError = signal<string | null>(null); readonly feedback = signal<string | null>(null);
  readonly platformForm = this.fb.group({ percentage: ['', Validators.required] });
  readonly searchForm = this.fb.group({ query: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]] });
  readonly providerForm = this.fb.group({ percentage: ['', Validators.required] });
  readonly format = formatCommission;
  constructor() { this.loadPlatform(); }
  loadPlatform(): void { this.platformLoading.set(true); this.platformError.set(false); this.api.getPlatform().pipe(finalize(() => this.platformLoading.set(false))).subscribe({ next: value => { this.platform.set(value); this.platformForm.controls.percentage.setValue(value.commissionBasisPoints === null ? '' : basisPointsToPercentage(value.commissionBasisPoints)); }, error: () => this.platformError.set(true) }); }
  savePlatform(): void { const bps = percentageToBasisPoints(this.platformForm.controls.percentage.value); this.platformInputError.set(bps === null); if (bps === null || this.platformSaving()) return; this.platformSaving.set(true); this.platformMutationError.set(null); this.api.setPlatform({ commissionBasisPoints: bps }).pipe(finalize(() => this.platformSaving.set(false))).subscribe({ next: value => { this.platform.set(value); this.platformForm.controls.percentage.setValue(basisPointsToPercentage(value.commissionBasisPoints!)); this.feedback.set('Platform provider commission updated.'); }, error: error => this.platformMutationError.set(this.safeError(error)) }); }
  searchProviders(): void { if (this.searchForm.invalid || this.providerSearching()) { this.searchForm.markAllAsTouched(); return; } this.providerSearching.set(true); this.searchError.set(false); this.providersApi.list({ search: this.searchForm.controls.query.value.trim(), page: 1, limit: 25 }).pipe(finalize(() => this.providerSearching.set(false))).subscribe({ next: response => this.providerResults.set(response.items), error: () => this.searchError.set(true) }); }
  selectProvider(provider: AdminProviderListItem): void { this.selectedProvider.set(provider); this.providerResults.set([]); this.loadProviderCommission(); }
  loadProviderCommission(): void { const provider = this.selectedProvider(); if (!provider) return; this.providerLoading.set(true); this.providerError.set(false); this.api.getProvider(provider.id).pipe(finalize(() => this.providerLoading.set(false))).subscribe({ next: value => { this.providerCommission.set(value); this.providerForm.controls.percentage.setValue(value.providerOverrideBasisPoints === null ? '' : basisPointsToPercentage(value.providerOverrideBasisPoints)); }, error: () => this.providerError.set(true) }); }
  saveProviderOverride(): void { const provider = this.selectedProvider(); const bps = percentageToBasisPoints(this.providerForm.controls.percentage.value); this.providerInputError.set(bps === null); if (!provider || bps === null || this.providerSaving()) return; this.providerSaving.set(true); this.providerMutationError.set(null); this.api.setProvider(provider.id, { commissionBasisPoints: bps }).pipe(finalize(() => this.providerSaving.set(false))).subscribe({ next: value => { this.providerCommission.set(value); this.providerForm.controls.percentage.setValue(basisPointsToPercentage(value.providerOverrideBasisPoints!)); this.feedback.set('Provider commission override updated.'); }, error: error => this.providerMutationError.set(this.safeError(error)) }); }
  removeProviderOverride(): void { const provider = this.selectedProvider(); if (!provider || this.providerSaving()) return; this.providerSaving.set(true); this.providerMutationError.set(null); this.api.clearProvider(provider.id).pipe(finalize(() => this.providerSaving.set(false))).subscribe({ next: value => { this.providerCommission.set(value); this.providerForm.controls.percentage.setValue(''); this.feedback.set('Provider override removed. Platform inheritance restored.'); }, error: error => this.providerMutationError.set(this.safeError(error)) }); }
  effectiveLabel(value: ProviderCommissionResponse): string { if (value.effectiveBasisPoints === null) return 'Not configured'; return `${formatCommission(value.effectiveBasisPoints)} — ${value.source === 'PROVIDER_OVERRIDE' ? 'provider override' : 'inherited from platform default'}`; }
  private safeError(error: HttpErrorResponse): string { const message = error.error?.message; return (error.status === 400 || error.status === 409) && typeof message === 'string' ? message : 'We could not update the commission setting. Try again.'; }
}
