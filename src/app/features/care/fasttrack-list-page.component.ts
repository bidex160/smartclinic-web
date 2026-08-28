import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FastTrackRequest } from '../../core/models/find-care.model';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { UtilsService } from '../../core/services/utils.service';
@Component({
  selector: 'app-fasttrack-list-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase text-brand-600">Patient Portal</p>
        <h1 class="mt-2 text-3xl font-bold">FastTrack requests</h1>
        <p class="mt-2 text-slate-600">
          Priority appointment handling with participating providers. Clinical urgency and medical
          triage always take priority.
        </p>
      </div>
      <a
        routerLink="/me/fasttrack/new"
        class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
        >Request FastTrack</a
      >
    </div>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading FastTrack requests…</p>
    } @else if (error()) {
      <p role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        We couldn't load FastTrack requests.
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </p>
    } @else if (!items().length) {
      <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
        <h2 class="text-xl font-bold">No FastTrack requests yet</h2>
        <p class="mt-2">
          Already booked outside SmartClinic? Ask the provider to verify your appointment.
        </p>
      </section>
    } @else {
      <div class="mt-8 overflow-x-auto rounded-2xl border bg-white">
        <table class="min-w-[780px] w-full text-left">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4">Reference</th>
              <th class="p-4">Provider</th>
              <th class="p-4">Service</th>
              <th class="p-4">Appointment</th>
              <th class="p-4">Status</th>
              <th class="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.reference) {
              <tr class="border-t">
                <td class="p-4 font-semibold">{{ item.reference }}</td>
                <td class="p-4">{{ item.provider.displayName }}</td>
                <td class="p-4">{{ item.service.name }}</td>
                <td class="p-4">
                  {{
                    item.externalAppointment
                      ? utils.formatAppointment(
                          item.externalAppointment.appointmentDate,
                          item.externalAppointment.appointmentTime
                        )
                      : 'SmartClinic Care Request'
                  }}
                </td>
                <td class="p-4">{{ label(item.status) }}</td>
                <td class="p-4">
                  <a
                    [routerLink]="['/me/fasttrack', item.reference]"
                    class="font-bold text-brand-700 underline"
                    >View</a
                  >
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </main>`,
})
export class FastTrackListPageComponent {
  private readonly api = inject(FastTrackApiService);
  readonly utils = inject(UtilsService);
  readonly items = signal<readonly FastTrackRequest[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api.list().subscribe({
      next: (p) => {
        this.items.set(p.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
  label(s: string) {
    return (
      (
        {
          VERIFYING: 'Verifying appointment',
          READY_FOR_PAYMENT: 'Ready for payment',
          PAYMENT_PENDING: 'Payment pending',
          CONFIRMED: 'FastTrack confirmed',
        } as Record<string, string>
      )[s] ??
      s
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    );
  }
}
