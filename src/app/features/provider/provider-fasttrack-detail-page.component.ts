import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FastTrackRequest } from '../../core/models/find-care.model';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { UtilsService } from '../../core/services/utils.service';
@Component({
  selector: 'app-provider-fasttrack-detail-page',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/provider/fasttrack" class="font-bold text-brand-700 underline">← FastTrack</a>
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading FastTrack request…</p>
    } @else if (error() && !request()) {
      <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (request(); as r) {
      <header class="mt-6">
        <p class="break-all text-sm font-bold uppercase text-brand-600">{{ r.reference }}</p>
        <h1 class="mt-2 text-3xl font-bold">FastTrack · {{ r.service.name }}</h1>
        <p class="mt-2">{{ statusLabel(r.status) }}</p>
      </header>
      @if (feedback()) {
        <p aria-live="polite" class="mt-5 rounded-xl bg-green-50 p-4 text-green-900">
          {{ feedback() }}
        </p>
      }
      @if (error()) {
        <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{{ error() }}</p>
      }
      <section class="mt-6 rounded-2xl border bg-white p-6">
        <dl class="grid gap-5 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-500">Source</dt>
            <dd>{{ sourceLabel(r.source) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Status</dt>
            <dd>{{ statusLabel(r.status) }}</dd>
          </div>
          @if (r.externalAppointment; as a) {
            <div>
              <dt class="text-sm text-slate-500">Appointment reference</dt>
              <dd class="break-all">{{ a.reference }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Appointment</dt>
              <dd>{{ utils.formatAppointment(a.appointmentDate, a.appointmentTime) }}</dd>
            </div>
            @if (a.department) {
              <div>
                <dt class="text-sm text-slate-500">Department</dt>
                <dd>{{ a.department }}</dd>
              </div>
            }
            @if (a.doctorName) {
              <div>
                <dt class="text-sm text-slate-500">Doctor</dt>
                <dd>{{ a.doctorName }}</dd>
              </div>
            }
          }
          @if (r.careRequestReference) {
            <div>
              <dt class="text-sm text-slate-500">Care Request</dt>
              <dd>
                <a
                  [routerLink]="['/provider/care-requests', r.careRequestReference]"
                  class="font-bold text-brand-700 underline"
                  >{{ r.careRequestReference }}</a
                >
              </dd>
            </div>
          }
          @if (r.notes) {
            <div class="sm:col-span-2">
              <dt class="text-sm text-slate-500">Notes</dt>
              <dd class="whitespace-pre-wrap">{{ r.notes }}</dd>
            </div>
          }
        </dl>
      </section>
      <section class="mt-6 rounded-xl bg-slate-50 p-5">
        <h2 class="font-bold">Current next step</h2>
        <p class="mt-1">{{ nextStep(r.status) }}</p>
        <p class="mt-3 text-sm">Clinical urgency and medical triage always take priority.</p>
      </section>
      @if (r.source === 'EXTERNAL_APPOINTMENT' && r.status === 'VERIFYING') {
        <div class="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            (click)="verifyOpen.set(true)"
            [disabled]="pending()"
            class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
          >
            Verify appointment</button
          ><button
            type="button"
            (click)="rejectOpen.set(true)"
            [disabled]="pending()"
            class="rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
          >
            Reject request
          </button>
        </div>
      }
    }
    @if (verifyOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="verify-fasttrack-title"
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="verify-fasttrack-title" class="text-xl font-bold">Verify this appointment?</h2>
          <p class="mt-2 text-slate-600">
            Confirm that this appointment exists and is eligible for FastTrack. The patient may then
            become eligible to pay.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              (click)="verifyOpen.set(false)"
              [disabled]="pending()"
              class="rounded-xl border px-4 py-3 font-bold"
            >
              Cancel</button
            ><button
              type="button"
              (click)="verify()"
              [disabled]="pending()"
              class="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {{ pending() ? 'Verifying…' : 'Verify appointment' }}
            </button>
          </div>
        </section>
      </div>
    }
    @if (rejectOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="reject-fasttrack-title"
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="reject-fasttrack-title" class="text-xl font-bold">
            Reject this FastTrack request?
          </h2>
          <p class="mt-2 text-slate-600">
            Reject only when the external appointment cannot be verified or is not eligible.
          </p>
          <form [formGroup]="rejectForm" (ngSubmit)="reject()" class="mt-5">
            <label for="reject-reason" class="font-bold">Reason</label
            ><textarea
              id="reject-reason"
              formControlName="reason"
              rows="4"
              maxlength="2000"
              placeholder="Explain why this FastTrack request is being rejected"
              class="mt-2 w-full rounded-xl border p-3"
            ></textarea>
            <div class="mt-5 flex justify-end gap-3">
              <button
                type="button"
                (click)="rejectOpen.set(false)"
                [disabled]="pending()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Keep request</button
              ><button
                type="submit"
                [disabled]="pending() || rejectForm.invalid"
                class="rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ pending() ? 'Rejecting…' : 'Reject request' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  </main>`,
})
export class ProviderFastTrackDetailPageComponent {
  private readonly api = inject(ProviderCareOperationsApiService);
  private readonly fb = inject(FormBuilder);
  readonly utils = inject(UtilsService);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly request = signal<FastTrackRequest | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly verifyOpen = signal(false);
  readonly rejectOpen = signal(false);
  readonly rejectForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(2000)]],
  });
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api
      .getFastTrackRequest(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => this.request.set(r),
        error: () =>
          this.error.set(
            'This FastTrack request is unavailable or no longer assigned to your provider workspace.',
          ),
      });
  }
  verify() {
    if (this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.api
      .verifyFastTrack(this.reference)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.verifyOpen.set(false);
          this.feedback.set(
            'Appointment verified. The patient can continue when the backend marks payment ready.',
          );
          this.load();
        },
        error: (e) => {
          this.verifyOpen.set(false);
          this.error.set(
            e?.status === 409
              ? 'This FastTrack request changed before verification. We refreshed its current state.'
              : 'We could not verify this appointment.',
          );
          this.load();
        },
      });
  }
  reject() {
    if (this.rejectForm.invalid || this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.api
      .rejectFastTrack(this.reference, this.rejectForm.controls.reason.value.trim())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.rejectOpen.set(false);
          this.feedback.set('FastTrack request rejected.');
          this.load();
        },
        error: (e) => {
          this.rejectOpen.set(false);
          this.error.set(
            e?.status === 409
              ? 'This FastTrack request changed before your response. We refreshed its current state.'
              : 'We could not reject this FastTrack request.',
          );
          this.load();
        },
      });
  }
  sourceLabel(s: string) {
    return s === 'EXTERNAL_APPOINTMENT' ? 'External appointment' : 'SmartClinic request';
  }
  statusLabel(s: string) {
    return (
      (
        {
          VERIFYING: 'Awaiting verification',
          READY_FOR_PAYMENT: 'Awaiting patient payment',
          PAYMENT_PENDING: 'Payment pending',
          PAID: 'Paid',
          CONFIRMED: 'FastTrack confirmed',
        } as Record<string, string>
      )[s] ??
      s
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
  nextStep(s: string) {
    return (
      (
        {
          VERIFYING: 'Confirm whether the external appointment exists and supports FastTrack.',
          READY_FOR_PAYMENT:
            'The patient can now complete payment. No provider payment action is required.',
          PAYMENT_PENDING: 'SmartClinic is awaiting backend-authoritative payment confirmation.',
          PAID: 'Payment has been confirmed by the backend.',
          CONFIRMED: 'FastTrack is confirmed for priority appointment handling.',
        } as Record<string, string>
      )[s] ?? 'No provider action is currently available.'
    );
  }
}
