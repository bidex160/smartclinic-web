import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
@Component({
  selector: 'app-provider-diagnostic-order-detail-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/provider/pharmacy-orders" class="font-bold text-brand-700 underline">← Patient orders</a>
    @if(loading()){
        <p class="mt-6 rounded-2xl border p-6">Loading request…</p>
    }@else if(error()){
        <p class="mt-6 rounded-2xl bg-red-50 p-6">{{error()}}</p>
    }@else if(item();as f){
        <header class="mt-6"><p class="text-sm font-bold uppercase text-brand-600">
            {{f.clinicalOrder.type==='IMAGING'?'Imaging request':'Laboratory request'}}</p>
            <h1 class="mt-2 text-3xl font-black">{{f.patient.givenName}} {{f.patient.familyName}}</h1>
            <p class="mt-2 text-slate-600">Requested by {{f.clinicalOrder.orderingProvider.displayName}}</p>
           </header>
           <section class="mt-6 rounded-2xl border bg-white p-6">
                <p class="font-bold">{{f.clinicalOrder.reference}}</p>@if(f.clinicalOrder.clinicalNote){<p class="mt-2">{{f.clinicalOrder.clinicalNote}}</p>
            }<p class="mt-3 text-sm">Status: <strong>{{statusLabel(f.status)}}</strong></p>
        </section>
            @if(f.status==='SELECTED'){
                <button (click)="accept()" [disabled]="pending()" class="mt-6 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">Accept patient request →</button>
             }@else if(f.status==='ACCEPTED'){
                <section class="mt-6 rounded-2xl border bg-white p-6">
                    <h2 class="text-xl font-bold">Send the patient a price</h2>
                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                        <label>Price (NGN)<input #price inputmode="decimal" class="mt-1 block w-full rounded-xl border p-3"></label>
                        <label>Quote valid until<input #expiry type="datetime-local" class="mt-1 block w-full rounded-xl border p-3"></label>
                        </div>
                        <button (click)="quote(price.value,expiry.value)" [disabled]="pending()" class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">Send price to patient →</button>
                    </section>
                    <section class="mt-6 rounded-2xl border bg-white p-6">
                        <h2 class="text-xl font-bold">Upload patient result</h2>
                        <p class="mt-2 text-sm text-slate-600">When payment is confirmed and the test or scan is complete, upload the result for the patient and ordering clinician.</p>
                        <input #file type="file" class="mt-4 block">
                        <button (click)="upload(file.files?.[0])" [disabled]="pending()" class="mt-4 rounded-xl border px-5 py-3 font-bold">Upload result</button>
                  </section>
            }
        }     
  </main>`,
})
export class ProviderDiagnosticOrderDetailPageComponent {
  private api = inject(PharmacyFulfillmentApiService);
  readonly ref = inject(ActivatedRoute).snapshot.paramMap.get('reference')!;
  readonly item = signal<any>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api
      .getFulfillment(this.ref)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (x) => this.item.set(x),
        error: () => this.error.set('This diagnostic request is unavailable.'),
      });
  }
  statusLabel(status: string) {
    const labels: Record<string, string> = { SELECTED: 'New request', ACCEPTED: 'Accepted - price needed', QUOTED: 'Price sent to patient', FUNDED: 'Payment confirmed', COMPLETED: 'Result completed', CANCELLED: 'Cancelled' };
    return labels[status] ?? status.replaceAll('_', ' ').toLowerCase().replace(/^./, (x) => x.toUpperCase());
  }
  accept() {
    this.run(this.api.acceptFulfillment(this.ref));
  }
  quote(v: string, e: string) {
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(v.trim());
    if (!m || !e) {
      this.error.set('Enter a valid price and expiry.');
      return;
    }
    const total = Number(BigInt(m[1]) * 100n + BigInt((m[2] ?? '').padEnd(2, '0')));
    this.pending.set(true);
    this.api
      .createDiagnosticQuote(this.ref, {
        totalMinor: total,
        currency: 'NGN',
        expiresAt: new Date(e).toISOString(),
      })
      .subscribe({
        next: (q) =>
          this.api
            .submitDiagnosticQuote(q.reference)
            .pipe(finalize(() => this.pending.set(false)))
            .subscribe({
              next: () => this.load(),
              error: () => this.error.set('The price could not be sent.'),
            }),
        error: () => {
          this.pending.set(false);
          this.error.set('The price could not be created.');
        },
      });
  }
  upload(file?: File) {
    if (!file) {
      this.error.set('Choose a result file first.');
      return;
    }
    this.run(this.api.uploadDiagnosticResult(this.ref, file));
  }
  private run(obs: any) {
    this.pending.set(true);
    this.error.set(null);
    obs
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.load(),
        error: (e: any) =>
          this.error.set(e?.error?.message || 'The action could not be completed.'),
      });
  }
}
