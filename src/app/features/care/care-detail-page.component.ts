import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CareRequest } from '../../core/models/find-care.model';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { CareChatApiService } from '../../core/services/care-chat-api.service';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from './care-delivery-mode';

@Component({
  selector: 'app-care-detail-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <a routerLink="/me/care" class="font-bold text-brand-700 underline">← My Care</a>
      @if (loading()) {
        <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading Care Request…</p>
      } @else if (error()) {
        <div role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
          We couldn't load this Care Request.
          <button type="button" (click)="load()" class="font-bold underline">Try again</button>
        </div>
      } @else if (request(); as r) {
        <header class="mt-6">
          <p class="text-sm font-bold uppercase text-brand-600">Care Request {{ r.reference }}</p>
          <h1 class="mt-2 text-3xl font-bold">{{ r.service.name }}</h1>
          <p class="mt-2 text-lg">{{ label(r.status) }}</p>
        </header>
        <section class="mt-7 rounded-2xl border bg-white p-6">
          <dl class="grid gap-5 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-slate-500">Delivery</dt>
              <dd>{{ deliveryModeLabel(r.deliveryMode) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Provider</dt>
              <dd class="font-semibold">
                {{
                  r.assignedProvider?.displayName ||
                    r.preferredProvider?.displayName ||
                    'SmartClinic is helping choose'
                }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Location</dt>
              <dd>
                {{ r.geography.city }}, {{ r.geography.stateOrRegion }},
                {{ r.geography.countryCode }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Requested appointment</dt>
              <dd>
                {{
                  r.preferredDate
                    ? utils.formatAppointment(r.preferredDate, r.preferredTime)
                    : 'No date requested'
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
          <p class="mt-6 rounded-xl bg-slate-50 p-4">{{ nextStep(r.status) }}</p>
        </section>
        @if (r.appointment; as a) {
          <section class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
            <h2 class="text-xl font-bold">Your appointment</h2>
            <p class="mt-3 font-semibold">
              {{ deliveryModeLabel(a.deliveryMode) }} · {{ appointmentLabel(a.status) }}
            </p>
            @if (a.scheduledDate) {
              <p class="mt-2">
                {{
                  utils.formatAppointment(a.scheduledDate, a.scheduledTimeFrom, a.scheduledTimeTo)
                }}
                @if (a.timezone) {
                  · {{ a.timezone }}
                }
              </p>
            }
            <p class="mt-1">
              {{
                a.deliveryMode === 'VIRTUAL'
                  ? a.hasMeetingLink
                    ? 'Meeting link ready'
                    : 'Meeting link pending'
                  : a.deliveryMode === 'HOME_VISIT'
                    ? 'Home visit'
                    : a.providerLocation?.name || 'Provider location pending'
              }}
            </p>
            <a
              [routerLink]="['/me/care/appointments', a.reference]"
              class="mt-4 inline-block font-bold text-brand-700 underline"
              >View appointment</a
            >
          </section>
        }
        @if (canCancelRequest(r.status) && !r.appointment) {
          <button
            type="button"
            (click)="cancelOpen.set(true)"
            class="mt-6 rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
          >
            Cancel Care Request
          </button>
        }
        @if (chatAvailable()) {
          <section class="mt-6 rounded-2xl border bg-white p-6">
            <h2 class="text-xl font-bold">Communication</h2>
            <p class="mt-2 text-slate-600">Message your provider about this Care Request.</p>
            <a
              [routerLink]="['/me/care', r.reference, 'chat']"
              class="mt-4 inline-flex min-h-12 items-center rounded-xl border border-brand-300 px-5 py-3 font-bold text-brand-800"
              >Open care chat
              @if (chatUnread() > 0) {
                <span class="ml-2 rounded-full bg-brand-700 px-2 py-0.5 text-xs text-white">{{
                  chatUnread()
                }}</span>
              }
            </a>
          </section>
        }
        @if (fastTrackEligible()) {
          <section class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
            <h2 class="text-xl font-bold">FastTrack available</h2>
            <p class="mt-2">
              Request priority appointment handling with this provider. Clinical urgency and medical
              triage always take priority.
            </p>
            @if (actionError()) {
              <p role="alert" class="mt-3 text-red-700">{{ actionError() }}</p>
            }
            <button
              type="button"
              (click)="createFastTrack()"
              [disabled]="creating()"
              class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {{ creating() ? 'Creating FastTrack request…' : 'Request FastTrack' }}
            </button>
          </section>
        }
      }
      @if (cancelOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-care-title"
            class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="cancel-care-title" class="text-xl font-bold">Cancel this Care Request?</h2>
            <p class="mt-2 text-slate-600">
              SmartClinic will stop working on this request. This action does not cancel a scheduled
              appointment.
            </p>
            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                (click)="cancelOpen.set(false)"
                [disabled]="cancelling()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Keep request</button
              ><button
                type="button"
                (click)="cancelRequest()"
                [disabled]="cancelling()"
                class="rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ cancelling() ? 'Cancelling…' : 'Cancel Care Request' }}
              </button>
            </div>
          </section>
        </div>
      }
    </main>
  `,
})
export class CareDetailPageComponent {
  private readonly api = inject(CareRequestsApiService);
  private readonly chatApi = inject(CareChatApiService);
  private readonly find = inject(FindCareApiService);
  private readonly fast = inject(FastTrackApiService);
  private readonly router = inject(Router);
  readonly utils = inject(UtilsService);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly request = signal<CareRequest | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly fastTrackEligible = signal(false);
  readonly creating = signal(false);
  readonly cancelling = signal(false);
  readonly cancelOpen = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly chatAvailable = signal(false);
  readonly chatUnread = signal(0);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api.get(this.reference).subscribe({
      next: (r) => {
        this.request.set(r);
        this.loading.set(false);
        this.checkFastTrack(r);
        this.chatApi.getChat('patient', this.reference).subscribe({
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
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
  private checkFastTrack(r: CareRequest) {
    if (r.status !== 'PROVIDER_ACCEPTED' || !r.assignedProvider) return;
    this.find.getProvider(r.assignedProvider.providerReference).subscribe({
      next: (p) =>
        this.fastTrackEligible.set(
          !!p.services.find((s) => s.code === r.service.code && s.supportsFastTrack),
        ),
      error: () => this.fastTrackEligible.set(false),
    });
  }
  createFastTrack() {
    if (this.creating()) return;
    this.creating.set(true);
    this.actionError.set(null);
    this.fast
      .createForCareRequest(this.reference)
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (r) => void this.router.navigate(['/me/fasttrack', r.reference]),
        error: () =>
          this.actionError.set(
            'FastTrack is not currently available for this Care Request. Refresh the request or try again later.',
          ),
      });
  }
  canCancelRequest(status: string) {
    return [
      'SUBMITTED',
      'MATCHING',
      'PROVIDER_SELECTED',
      'AWAITING_PROVIDER_RESPONSE',
      'DECLINED',
      'UNFULFILLABLE',
    ].includes(status);
  }
  cancelRequest() {
    if (this.cancelling()) return;
    this.cancelling.set(true);
    this.actionError.set(null);
    this.api
      .cancel(this.reference)
      .pipe(finalize(() => this.cancelling.set(false)))
      .subscribe({
        next: () => {
          this.cancelOpen.set(false);
          this.load();
        },
        error: () => {
          this.cancelOpen.set(false);
          this.actionError.set(
            'This Care Request could not be cancelled. We refreshed its current status.',
          );
          this.load();
        },
      });
  }
  label(s: string) {
    return (
      (
        {
          MATCHING: 'Finding a provider',
          AWAITING_PROVIDER_RESPONSE: 'Waiting for provider',
          PROVIDER_ACCEPTED: 'Provider accepted',
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
          MATCHING: 'SmartClinic is looking for an eligible provider.',
          AWAITING_PROVIDER_RESPONSE: 'The selected provider is reviewing your request.',
          PROVIDER_ACCEPTED: 'Your provider has accepted this Care Request.',
          UNFULFILLABLE: 'SmartClinic operations needs to review provider availability.',
        } as Record<string, string>
      )[s] ?? 'Check this page for the latest backend-confirmed status.'
    );
  }
  appointmentLabel(s: string) {
    return s === 'IN_PROGRESS'
      ? 'In progress'
      : s === 'NO_SHOW'
        ? 'No-show'
        : s.charAt(0) + s.slice(1).toLowerCase();
  }
  deliveryModeLabel = careDeliveryModeLabel;
}
