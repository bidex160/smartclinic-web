import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  CareAppointment,
  CareRequest,
  ProviderLocationOption,
} from '../../core/models/find-care.model';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { CareChatApiService } from '../../core/services/care-chat-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from '../care/care-delivery-mode';
import { formatMinor } from './care-money';
@Component({
  selector: 'app-provider-care-request-detail-page',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/provider/care-requests" class="font-bold text-brand-700 underline"
      >← Care Requests</a
    >
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading Care Request…</p>
    } @else if (error() && !request()) {
      <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    } @else if (request(); as r) {
      <header class="mt-6">
        <p class="break-all text-sm font-bold uppercase text-brand-600">{{ r.reference }}</p>
        <h1 class="mt-2 text-3xl font-bold">{{ r.service.name }}</h1>
        <p class="mt-2">{{ label(r.status) }}</p>
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
        <h2 class="text-xl font-bold">Request</h2>
        <dl class="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-500">Delivery</dt>
            <dd>{{ deliveryModeLabel(r.deliveryMode) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Service price</dt>
            <dd class="font-semibold">
              {{
                r.service.price
                  ? formatPrice(r.service.price.priceMinor, r.service.price.currency)
                  : 'Not set yet'
              }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Status</dt>
            <dd>{{ label(r.status) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Requested location</dt>
            <dd>
              {{ r.geography.city }}, {{ r.geography.stateOrRegion }}, {{ r.geography.countryCode }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Requested appointment</dt>
            <dd>
              {{
                r.preferredDate
                  ? utils.formatAppointment(r.preferredDate, r.preferredTime)
                  : 'Not specified'
              }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Contact method</dt>
            <dd>{{ r.contactMethod }}</dd>
          </div>
          @if (r.notes) {
            <div class="sm:col-span-2">
              <dt class="text-sm text-slate-500">Request notes</dt>
              <dd class="whitespace-pre-wrap">{{ r.notes }}</dd>
            </div>
          }
        </dl>
      </section>
      @if (r.funding || r.status === 'PROVIDER_ACCEPTED') {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Payment status</h2>
          <p class="mt-2 font-semibold">{{ fundingLabel(r) }}</p>
          @if (r.status === 'PROVIDER_ACCEPTED' && !fundingSatisfied(r)) {
            <p class="mt-2 text-slate-600">Awaiting patient payment. Care Chat remains available while payment is pending.</p>
          }
        </section>
      }
      @if (r.status === 'AWAITING_PROVIDER_RESPONSE') {
        <section class="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            (click)="accept()"
            [disabled]="pending()"
            class="min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {{ pending() ? 'Updating request…' : 'Accept request' }}</button
          ><button
            type="button"
            (click)="declineOpen.set(true)"
            [disabled]="pending()"
            class="min-h-12 rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
          >
            Decline request
          </button>
        </section>
      }
      @if (r.status === 'PROVIDER_ACCEPTED' && fundingSatisfied(r)) {
        <button
          type="button"
           (click)="openSchedule(r)"
          class="mt-6 min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
        >
          Schedule appointment
        </button>
      }
      @if (r.status === 'PROVIDER_ACCEPTED' && !fundingSatisfied(r)) {
        <p class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-950">Schedule appointment is unavailable while patient payment is pending.</p>
      }
      @if (chatAvailable()) {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">Communication</h2>
          <p class="mt-2 text-slate-600">Use the backend-safe patient identity in Care Chat.</p>
          <a
            [routerLink]="['/provider/care-requests', r.reference, 'chat']"
            class="mt-4 inline-flex min-h-12 items-center rounded-xl border border-brand-300 px-5 py-3 font-bold text-brand-800"
            >Chat with patient
            @if (chatUnread() > 0) {
              <span class="ml-2 rounded-full bg-brand-700 px-2 py-0.5 text-xs text-white">{{
                chatUnread()
              }}</span>
            }
          </a>
        </section>
      }
      @if (scheduledAppointment(); as appointment) {
        <section class="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
          <h2 class="text-xl font-bold">Appointment scheduled</h2>
          <p class="mt-2 break-all font-semibold">{{ appointment.appointmentReference }}</p>
          <p class="mt-2">
            {{
              utils.formatAppointment(
                appointment.scheduledDate,
                appointment.scheduledTimeFrom,
                appointment.scheduledTimeTo
              )
            }}
            · {{ appointment.timezone }}
          </p>
          <p class="mt-1">
            {{ appointment.providerLocation?.name || 'No specific provider location' }} ·
            {{ appointmentLabel(appointment.status) }}
          </p>
          <a
            [routerLink]="['/provider/care-appointments', appointment.appointmentReference]"
            class="mt-4 inline-block font-bold text-brand-700 underline"
            >View appointment</a
          >
        </section>
      }
    }
    @if (scheduleOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="schedule-care-title"
          class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="schedule-care-title" class="text-xl font-bold">Schedule appointment</h2>
          <p class="mt-2 text-slate-600">
            Enter an explicit appointment interval. SmartClinic will check provider eligibility and
            overlapping appointments.
          </p>
          <form [formGroup]="scheduleForm" (ngSubmit)="schedule()" class="mt-5 grid gap-4">
            <label class="font-bold"
              >Appointment date<input
                type="date"
                formControlName="scheduledDate"
                [min]="minimumDate"
                class="mt-2 min-h-12 w-full rounded-xl border px-3"
            /></label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="font-bold"
                >Start time<input
                  type="time"
                  formControlName="scheduledTimeFrom"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3" /></label
              ><label class="font-bold"
                >End time<input
                  type="time"
                  formControlName="scheduledTimeTo"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
              /></label>
            </div>
            @if (request()?.deliveryMode === 'IN_PERSON') {
              <label class="font-bold"
                >Provider location<select
                  formControlName="providerLocationReference"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">No specific provider location</option>
                  @for (location of locations(); track location.locationReference) {
                    <option [value]="location.locationReference">
                      {{ location.name }} · {{ location.city }}, {{ location.state }}
                    </option>
                  }
                </select></label
              >
            }
            <label class="font-bold"
              >Timezone<input
                formControlName="timezone"
                readonly
                class="mt-2 min-h-12 w-full rounded-xl border bg-slate-50 px-3"
              /><span class="mt-1 block text-sm font-normal text-slate-500"
                >IANA timezone used for the appointment.</span
              ></label
            ><label class="font-bold"
              >Notes (optional)<textarea
                formControlName="notes"
                maxlength="2000"
                rows="3"
                placeholder="Optional operational appointment note"
                class="mt-2 w-full rounded-xl border p-3"
              ></textarea>
            </label>
            @if (scheduleError()) {
              <p role="alert" class="rounded-xl bg-red-50 p-3 text-red-800">
                {{ scheduleError() }}
              </p>
            }
            <div class="flex justify-end gap-3">
              <button
                type="button"
                (click)="scheduleOpen.set(false)"
                [disabled]="pending()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Cancel</button
              ><button
                type="submit"
                [disabled]="pending()"
                class="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ pending() ? 'Scheduling…' : 'Schedule appointment' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
    @if (declineOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="decline-care-title"
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="decline-care-title" class="text-xl font-bold">Decline this Care Request?</h2>
          <p class="mt-2 text-slate-600">
            SmartClinic will record your response. The frontend will not reassign the request.
          </p>
          <form [formGroup]="declineForm" (ngSubmit)="confirmDecline()" class="mt-5">
            <label for="decline-reason" class="font-bold">Reason</label
            ><textarea
              id="decline-reason"
              formControlName="reason"
              rows="4"
              maxlength="1000"
              placeholder="Enter a reason for declining"
              class="mt-2 w-full rounded-xl border p-3"
            ></textarea>
            <div class="mt-5 flex justify-end gap-3">
              <button
                type="button"
                (click)="declineOpen.set(false)"
                [disabled]="pending()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Keep request</button
              ><button
                type="submit"
                [disabled]="pending() || declineForm.invalid"
                class="rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ pending() ? 'Declining…' : 'Decline request' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  </main>`,
})
export class ProviderCareRequestDetailPageComponent {
  private readonly api = inject(ProviderCareOperationsApiService);
  private readonly chatApi = inject(CareChatApiService);
  private readonly fb = inject(FormBuilder);
  readonly utils = inject(UtilsService);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly request = signal<CareRequest | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly declineOpen = signal(false);
  readonly scheduleOpen = signal(false);
  readonly scheduleError = signal<string | null>(null);
  readonly locations = signal<readonly ProviderLocationOption[]>([]);
  readonly scheduledAppointment = signal<CareAppointment | null>(null);
  readonly chatAvailable = signal(false);
  readonly chatUnread = signal(0);
  readonly timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  readonly minimumDate = this.localNow().date;
  readonly scheduleForm = this.fb.nonNullable.group({
    scheduledDate: ['', Validators.required],
    scheduledTimeFrom: ['', Validators.required],
    scheduledTimeTo: ['', Validators.required],
    providerLocationReference: [''],
    timezone: [this.timezone, Validators.required],
    notes: ['', [Validators.maxLength(2000)]],
  });
  readonly declineForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });
  constructor() {
    this.load();
    this.api.getLocations().subscribe({
      next: (value) => this.locations.set(value.filter((location) => location.isActive)),
    });
  }
  schedule() {
    if (this.scheduleForm.invalid || this.pending()) {
      this.scheduleForm.markAllAsTouched();
      return;
    }
    const value = this.scheduleForm.getRawValue();
    if (value.scheduledTimeTo <= value.scheduledTimeFrom) {
      this.scheduleError.set('End time must be after start time.');
      return;
    }
    const now = this.localNow();
    if (
      value.scheduledDate < now.date ||
      (value.scheduledDate === now.date && value.scheduledTimeFrom <= now.time)
    ) {
      this.scheduleError.set('Choose an appointment time in the future.');
      return;
    }
    this.pending.set(true);
    this.scheduleError.set(null);
    this.api
      .scheduleCareRequest(this.reference, {
        scheduledDate: value.scheduledDate,
        scheduledTimeFrom: this.toHourMinute(value.scheduledTimeFrom),
        scheduledTimeTo: this.toHourMinute(value.scheduledTimeTo),
        timezone: value.timezone,
        ...(this.request()?.deliveryMode === 'IN_PERSON' && value.providerLocationReference
          ? { providerLocationReference: value.providerLocationReference }
          : {}),
        ...(value.notes.trim() ? { notes: value.notes.trim() } : {}),
      })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (appointment) => {
          this.scheduledAppointment.set(appointment);
          this.scheduleOpen.set(false);
          this.feedback.set('Appointment scheduled.');
          this.load();
        },
        error: (error) => {
          this.scheduleError.set(
            error?.status === 409
              ? 'This time overlaps with another appointment or the Care Request changed. Choose another time and try again.'
              : 'We could not schedule this appointment. Review the date and time and try again.',
          );
          this.load();
        },
      });
  }

  private toHourMinute(value?: string | null): string {
  if (!value) {
    return '';
  }
  // Handles HH:mm and HH:mm:ss
  const match = value.match(/^(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : '';
}

  private localNow() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((x) => x.type === type)?.value ?? '';
    return {
      date: `${part('year')}-${part('month')}-${part('day')}`,
      time: `${part('hour')}:${part('minute')}`,
    };
  }
  appointmentLabel(status: string) {
    return status === 'IN_PROGRESS'
      ? 'In progress'
      : status === 'NO_SHOW'
        ? 'No-show'
        : status.charAt(0) + status.slice(1).toLowerCase();
  }
  load() {
    this.loading.set(true);
    this.api
      .getCareRequest(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.request.set(r);
          this.chatApi.getChat('provider', this.reference).subscribe({
            next: (chat) => {
              this.chatAvailable.set(true);
              this.chatUnread.set(chat.unreadCount);
            },
            error: () => {
              this.chatAvailable.set(false);
              this.chatUnread.set(0);
            },
          });
        },
        error: () =>
          this.error.set(
            'This Care Request is unavailable or no longer assigned to your provider workspace.',
          ),
      });
  }
  accept() {
    if (this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.api
      .acceptCareRequest(this.reference)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.feedback.set('Care Request accepted.');
          this.load();
        },
        error: (e) => {
          this.error.set(
            e?.status === 409
              ? 'This Care Request changed before your response. We refreshed its current state.'
              : 'We could not accept this Care Request.',
          );
          this.load();
        },
      });
  }
  confirmDecline() {
    if (this.declineForm.invalid || this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.api
      .declineCareRequest(this.reference, this.declineForm.controls.reason.value.trim())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.declineOpen.set(false);
          this.feedback.set('Care Request declined.');
          this.load();
        },
        error: (e) => {
          this.declineOpen.set(false);
          this.error.set(
            e?.status === 409
              ? 'This Care Request changed before your response. We refreshed its current state.'
              : 'We could not decline this Care Request.',
          );
          this.load();
        },
      });
  }
  label(s: string) {
    return (
      (
        {
          AWAITING_PROVIDER_RESPONSE: 'Awaiting your response',
          PROVIDER_ACCEPTED: 'Accepted',
          CANCELLED: 'Cancelled',
          DECLINED: 'Declined',
        } as Record<string, string>
      )[s] ??
      s
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
  readonly deliveryModeLabel = careDeliveryModeLabel;
  readonly formatPrice = formatMinor;
  fundingSatisfied(request: CareRequest): boolean {
    return request.funding?.status === 'PAID' || request.funding?.status === 'SATISFIED_FREE';
  }
  fundingLabel(request: CareRequest): string {
    if (request.funding?.status === 'PAID') return 'Paid';
    if (request.funding?.status === 'SATISFIED_FREE') return 'Free — no payment required';
    return 'Awaiting payment';
  }

 openSchedule(request: CareRequest): void {
  this.scheduleError.set(null);

  const now = this.localNow();

  const preferredDate = request.preferredDate ?? '';
  const preferredTime = request.preferredTime ?? '';

  const preferredIsFuture =
    !!preferredDate &&
    (
      preferredDate > now.date ||
      (preferredDate === now.date && preferredTime > now.time)
    );

  this.scheduleForm.reset({
    scheduledDate: preferredIsFuture ? preferredDate : '',
    scheduledTimeFrom: preferredIsFuture ? preferredTime : '',
    scheduledTimeTo: '',
    providerLocationReference: '',
    timezone: this.timezone,
    notes: '',
  });

  this.scheduleOpen.set(true);
}
}
