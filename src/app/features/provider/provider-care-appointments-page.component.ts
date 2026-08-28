import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CareAppointment, CareAppointmentStatus } from '../../core/models/find-care.model';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from '../care/care-delivery-mode';
@Component({
  selector: 'app-provider-care-appointments-page',
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <p class="text-sm font-bold uppercase text-brand-600">Care operations</p>
    <h1 class="mt-2 text-3xl font-bold">Care Appointments</h1>
    <p class="mt-2 text-slate-600">
      Appointments explicitly scheduled from accepted Care Requests.
    </p>
    <form [formGroup]="filter" class="mt-6 max-w-xs">
      <label class="font-bold"
        >Status<select
          formControlName="status"
          (change)="page.set(1); load()"
          class="mt-2 min-h-12 w-full rounded-xl border px-3"
        >
          <option value="">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ label(s) }}</option>
          }
        </select></label
      >
    </form>
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading Care Appointments…</p>
    } @else if (error()) {
      <p role="alert" class="mt-8 rounded-2xl bg-red-50 p-6">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </p>
    } @else if (!items().length) {
      <p class="mt-8 rounded-2xl border bg-white p-8 text-center">
        No Care Appointments match this view.
      </p>
    } @else {
      <div class="mt-8 overflow-x-auto rounded-2xl border bg-white">
        <table class="min-w-[900px] w-full text-left">
          <thead class="bg-slate-50">
            <tr>
              <th class="p-4">Appointment</th>
              <th class="p-4">Care Request</th>
              <th class="p-4">Service</th>
              <th class="p-4">Delivery</th>
              <th class="p-4">Date and time</th>
              <th class="p-4">Location</th>
              <th class="p-4">Status</th>
              <th class="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (a of items(); track a.appointmentReference) {
              <tr class="border-t">
                <td class="p-4 break-all font-semibold">{{ a.appointmentReference }}</td>
                <td class="p-4 break-all">{{ a.careRequestReference }}</td>
                <td class="p-4">{{ a.service.name }}</td>
                <td class="p-4">{{ deliveryModeLabel(a.deliveryMode) }}</td>
                <td class="p-4">
                  {{
                    utils.formatAppointment(
                      a.scheduledDate,
                      a.scheduledTimeFrom,
                      a.scheduledTimeTo
                    )
                  }}<span class="block text-sm text-slate-500">{{ a.timezone }}</span>
                </td>
                <td class="p-4">
                  {{
                    a.deliveryMode === 'VIRTUAL'
                      ? 'Online'
                      : a.deliveryMode === 'HOME_VISIT'
                        ? 'Home visit'
                        : a.providerLocation?.name || 'No specific location'
                  }}
                </td>
                <td class="p-4">{{ label(a.status) }}</td>
                <td class="p-4">
                  <a
                    [routerLink]="['/provider/care-appointments', a.appointmentReference]"
                    class="font-bold text-brand-700 underline"
                    >View appointment</a
                  >
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <nav class="mt-5 flex justify-between" aria-label="Appointment pages">
        <button
          type="button"
          (click)="change(-1)"
          [disabled]="page() <= 1"
          class="rounded-xl border px-4 py-2 font-bold disabled:opacity-50"
        >
          Previous</button
        ><span>Page {{ page() }} of {{ totalPages() || 1 }}</span
        ><button
          type="button"
          (click)="change(1)"
          [disabled]="page() >= totalPages()"
          class="rounded-xl border px-4 py-2 font-bold disabled:opacity-50"
        >
          Next
        </button>
      </nav>
    }
  </main>`,
})
export class ProviderCareAppointmentsPageComponent {
  private readonly api = inject(ProviderCareOperationsApiService);
  private readonly fb = inject(FormBuilder);
  readonly utils = inject(UtilsService);
  readonly statuses: readonly CareAppointmentStatus[] = [
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ];
  readonly filter = this.fb.nonNullable.group({ status: ['' as CareAppointmentStatus | ''] });
  readonly items = signal<readonly CareAppointment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly deliveryModeLabel = careDeliveryModeLabel;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getAppointments(this.page(), 20, this.filter.controls.status.value || undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.items.set(r.items);
          this.totalPages.set(r.totalPages);
        },
        error: () => this.error.set('Care Appointments could not be loaded right now.'),
      });
  }
  change(d: number) {
    const n = this.page() + d;
    if (n < 1 || n > this.totalPages()) return;
    this.page.set(n);
    this.load();
  }
  label(s: string) {
    return s === 'IN_PROGRESS'
      ? 'In progress'
      : s === 'NO_SHOW'
        ? 'No-show'
        : s.charAt(0) + s.slice(1).toLowerCase();
  }
}
