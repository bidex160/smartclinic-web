import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CareAppointment } from '../../core/models/find-care.model';
import { CareAppointmentsApiService } from '../../core/services/care-appointments-api.service';

const ACTIVE_STATUSES = new Set(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']);

const WHAT_TO_BRING = [
  'Your SmartClinic card on this phone',
  'A valid ID',
  'Your current medicines, or a list of their names',
  'Previous results or hospital reports, if you have them',
  'Your HMO card, if you use one',
] as const;

/**
 * Home turns into a visit companion on the day of an appointment: when and
 * where, how to get there or join, what to bring, and the card to show.
 */
@Component({
  selector: 'app-visit-day-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visit(); as v) {
      <section class="relative mt-5 overflow-hidden rounded-[1.75rem] bg-leaf-700 p-5 text-white shadow-lift sm:p-7" aria-labelledby="visit-heading" data-visit-day>
        <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true"></div>
        <div class="relative">
          <p class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ochre-300">
            <span class="size-1.5 rounded-full bg-ochre-300"></span>{{ v.status === 'IN_PROGRESS' ? 'Your visit is in progress' : 'Your visit today' }}
          </p>
          <h2 id="visit-heading" class="font-display mt-2 text-[1.7rem] font-semibold leading-tight">{{ v.service.name }} at {{ v.provider.displayName }}</h2>
          <p class="mt-1 text-lg font-semibold text-white/90">{{ time(v.scheduledTimeFrom) }}–{{ time(v.scheduledTimeTo) }}</p>

          @switch (v.deliveryMode) {
            @case ('VIRTUAL') {
              <p class="mt-3 text-sm text-white/80">This is an online consultation. Find a quiet place with good signal a few minutes before.</p>
            }
            @case ('HOME_VISIT') {
              <p class="mt-3 text-sm text-white/80">The care team will come to you. Keep your phone close in case they call for directions.</p>
            }
            @default {
              @if (v.providerLocation; as place) {
                <p class="mt-3 text-sm text-white/85">{{ place.name }} · {{ address(v) }}</p>
              }
            }
          }

          <div class="mt-5 flex flex-wrap gap-2">
            @if (v.deliveryMode === 'VIRTUAL' && v.meetingUrl) {
              <a [href]="v.meetingUrl" target="_blank" rel="noopener" class="inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-leaf-700 hover:bg-ochre-50">Join consultation</a>
            }
            @if (v.deliveryMode === 'IN_PERSON' && v.providerLocation) {
              <a [href]="directionsUrl(v)" target="_blank" rel="noopener" class="inline-flex min-h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-leaf-700 hover:bg-ochre-50" data-directions>Directions</a>
            }
            <a routerLink="/me/card" class="inline-flex min-h-12 items-center rounded-full bg-white/15 px-5 text-sm font-semibold ring-1 ring-white/30 hover:bg-white/25">Show my SmartClinic card</a>
            <a [routerLink]="['/me/care/appointments', v.appointmentReference]" class="inline-flex min-h-12 items-center rounded-full px-4 text-sm font-semibold text-white/90 hover:bg-white/10">Appointment details →</a>
          </div>

          @if (v.deliveryMode !== 'VIRTUAL') {
            <details class="group mt-5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <summary class="cursor-pointer list-none font-semibold">
                What to bring <span class="float-right transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <ul class="mt-3 grid gap-2 text-sm text-white/85">
                @for (item of whatToBring; track item) {
                  <li class="flex gap-2"><span aria-hidden="true">✓</span>{{ item }}</li>
                }
              </ul>
            </details>
          }
          <p class="mt-4 text-sm text-white/75">
            Bills from the visit will appear in <a routerLink="/me/pay-bills" class="font-semibold text-white underline underline-offset-2">Pay bills</a>, and prescriptions and results in your Health Passport.
          </p>
        </div>
      </section>
    }
  `,
})
export class VisitDayCardComponent {
  private readonly api = inject(CareAppointmentsApiService);

  readonly whatToBring = WHAT_TO_BRING;
  readonly visit = signal<CareAppointment | null>(null);

  constructor() {
    this.load();
  }

  load(now = new Date()): void {
    this.api.list(1, 20).subscribe({
      next: ({ items }) => {
        const today = items
          .filter((item) => ACTIVE_STATUSES.has(item.status) && item.scheduledDate === localDate(now, item.timezone))
          .sort((a, b) => a.scheduledTimeFrom.localeCompare(b.scheduledTimeFrom));
        this.visit.set(today.find((item) => item.status === 'IN_PROGRESS') ?? today[0] ?? null);
      },
      // Home must never break because appointments are unavailable.
      error: () => this.visit.set(null),
    });
  }

  time(value: string): string {
    return value.slice(0, 5);
  }

  address(visit: CareAppointment): string {
    const place = visit.providerLocation;
    if (!place) return '';
    return [place.addressLine1, place.addressLine2, place.city, place.stateOrRegion].filter(Boolean).join(', ');
  }

  directionsUrl(visit: CareAppointment): string {
    const place = visit.providerLocation;
    const query = [place?.name, this.address(visit), place?.countryCode].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
}

function localDate(now: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA').format(now);
  }
}
