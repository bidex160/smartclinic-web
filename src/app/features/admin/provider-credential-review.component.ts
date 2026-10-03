import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminCredentialsView, CREDENTIAL_STATUS_LABEL, ProviderCredentialsApiService } from '../../core/services/provider-credentials-api.service';

/** Staff check: specialties, the licence number, the certificate, and verify or send back. */
@Component({
  selector: 'app-provider-credential-review',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="licence-heading" class="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft" data-credential-review>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <h2 id="licence-heading" class="text-xl font-bold text-brand-900">Specialties and licence</h2>
        @if (view(); as v) {
          <span class="rounded-full px-3 py-1 text-sm font-semibold {{ v.verified ? 'bg-emerald-50 text-emerald-800' : v.credential?.status === 'REJECTED' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-700' }}" data-review-status>
            {{ v.verified ? '✓ Verified' : label[v.credential?.status ?? 'NOT_SUBMITTED'] }}
          </span>
        }
      </div>
      @if (view(); as v) {
        <dl class="mt-4 grid gap-3">
          <div>
            <dt class="text-sm font-semibold text-slate-600">Specialties</dt>
            <dd>
              @for (s of v.specialties; track s.code) { <span class="mr-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-sm">{{ s.isPrimary ? '★ ' : '' }}{{ s.name }}</span> }
              @empty { <span class="text-slate-500">{{ v.specialtyRequired ? 'None yet (required for doctors)' : 'None listed' }}</span> }
            </dd>
          </div>
          <div>
            <dt class="text-sm font-semibold text-slate-600">Licence</dt>
            <dd data-review-licence>
              @if (v.credential; as c) { <strong>{{ c.regulator }}</strong> · <span class="font-mono">{{ c.licenceNumber }}</span> <span class="ml-1 text-sm text-slate-500">(sent {{ c.submittedAt | date: 'mediumDate' }})</span> }
              @else { <span class="text-slate-500">Not added yet</span> }
            </dd>
          </div>
          @if (v.credential) {
            <div>
              <dt class="text-sm font-semibold text-slate-600">Certificate</dt>
              <dd>
                @if (v.documentUrl) { <a [href]="v.documentUrl" target="_blank" rel="noopener noreferrer" class="font-semibold text-brand-700 underline" data-review-document>Open certificate</a> <span class="ml-1 text-xs text-slate-500">(link works for 10 minutes)</span> }
                @else { <span class="text-slate-500">{{ v.credential.hasDocument ? 'Uploaded, but storage is unavailable right now' : 'Not uploaded' }}</span> }
              </dd>
            </div>
          }
          @if (v.checkedVia) { <div><dt class="text-sm font-semibold text-slate-600">Checked via</dt><dd>{{ v.checkedVia }}</dd></div> }
          @if (v.reviewNote) { <div><dt class="text-sm font-semibold text-slate-600">Note</dt><dd>{{ v.reviewNote }}</dd></div> }
        </dl>

        @if (v.credential && !v.verified) {
          <div class="mt-5 rounded-xl bg-slate-50 p-4">
            <p class="text-sm text-slate-700">
              Check the name and number with the regulator.
              @if (v.checkUrl) { <a [href]="v.checkUrl" target="_blank" rel="noopener noreferrer" class="font-semibold text-brand-700 underline" data-review-check-url>Open the {{ v.credential.regulator }} check page</a>. }
              @else { If they have no online register, call them. }
            </p>
            <label class="mt-3 block text-sm font-semibold">How did you check it?
              <input [value]="checkedVia()" (input)="checkedVia.set($any($event.target).value)" maxlength="120" placeholder="e.g. MDCN online register, called the council" class="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" data-review-checked-via />
            </label>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" (click)="verify()" [disabled]="busy() || checkedVia().trim().length < 2" class="min-h-11 rounded-lg bg-emerald-700 px-4 font-bold text-white disabled:opacity-40" data-review-verify>Mark as verified</button>
            </div>
            <label class="mt-4 block text-sm font-semibold">Or send it back, saying what to fix
              <textarea [value]="reason()" (input)="reason.set($any($event.target).value)" maxlength="500" rows="2" placeholder="e.g. The number isn't on the register under this name. Please upload your certificate." class="mt-1 w-full rounded-lg border border-slate-300 p-3 font-normal" data-review-reason></textarea>
            </label>
            <button type="button" (click)="reject()" [disabled]="busy() || reason().trim().length < 5" class="mt-2 min-h-11 rounded-lg border border-amber-700 px-4 font-bold text-amber-900 disabled:opacity-40" data-review-reject>Send back to provider</button>
          </div>
        }
      }
      @if (error()) { <p role="alert" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{{ error() }}</p> }
    </section>
  `,
})
export class ProviderCredentialReviewComponent implements OnInit {
  private readonly api = inject(ProviderCredentialsApiService);
  readonly providerId = input.required<string>();
  /** Fires after verify or send back, so the page can refresh approval readiness. */
  readonly changed = output<void>();
  readonly label = CREDENTIAL_STATUS_LABEL;
  readonly view = signal<AdminCredentialsView | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly checkedVia = signal('');
  readonly reason = signal('');

  ngOnInit(): void {
    this.api.adminGet(this.providerId()).subscribe({ next: (v) => this.view.set(v), error: (e) => this.fail(e) });
  }

  verify(): void {
    this.run(this.api.verify(this.providerId(), this.checkedVia().trim()));
  }

  reject(): void {
    this.run(this.api.reject(this.providerId(), this.reason().trim()));
  }

  private run(call: ReturnType<ProviderCredentialsApiService['adminGet']>): void {
    this.busy.set(true);
    this.error.set('');
    call.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (v) => { this.view.set(v); this.checkedVia.set(''); this.reason.set(''); this.changed.emit(); },
      error: (e) => this.fail(e),
    });
  }

  private fail(e: unknown): void {
    this.error.set(e instanceof HttpErrorResponse && typeof e.error?.message === 'string' ? e.error.message : 'Couldn’t load or save the licence. Try again.');
  }
}
