import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  HealthCheckResult,
  HealthCheckResultMeasurement,
} from '../../core/models/health-check-result.model';

@Component({
  selector: 'app-health-check-result-view',
  imports: [DatePipe],
  template: `
    <article class="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10">
      <header class="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <p class="text-sm font-bold uppercase tracking-[0.14em] text-brand-600">SmartClinic</p>
        <h1 class="mt-2 text-3xl font-bold text-brand-900">Smart Health Check results</h1>
        <dl class="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-600">Booking reference</dt>
            <dd class="font-bold">{{ result().bookingReference }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Package</dt>
            <dd class="font-bold">{{ result().healthCheckPackage.name }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Provider</dt>
            <dd class="font-bold">{{ result().provider?.displayName ?? 'Not available' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-600">Completed</dt>
            <dd class="font-bold">{{ result().completedAt | date: 'medium' }}</dd>
          </div>
        </dl>
      </header>

      <section class="mt-6" aria-labelledby="measurements-heading">
        <h2 id="measurements-heading" class="text-2xl font-bold text-brand-900">
          Recorded measurements
        </h2>
        <dl class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (measurement of result().measurements; track measurement.code) {
            <div class="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
              <dt class="font-bold text-brand-900">{{ label(measurement.code) }}</dt>
              <dd class="mt-2 text-2xl font-bold text-slate-900">
                @if (measurement.code === 'BLOOD_PRESSURE' && measurement.secondaryValue !== null) {
                  {{ measurement.value }} / {{ measurement.secondaryValue }}
                } @else {
                  {{ measurement.value }}
                }
                <span class="text-base font-medium text-slate-600">{{ measurement.unit }}</span>
              </dd>
              <dd class="mt-2 text-sm text-slate-600">
                Recorded {{ measurement.recordedAt | date: 'medium' }}
              </dd>
            </div>
          }
        </dl>
      </section>
      <aside class="mt-6 rounded-xl bg-slate-100 p-5 text-slate-700">
        These are the measurements recorded during your Smart Health Check. Clinical interpretation
        is not included in this view.
      </aside>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthCheckResultViewComponent {
  readonly result = input.required<HealthCheckResult>();
  label(code: HealthCheckResultMeasurement['code']): string {
    return (
      {
        BLOOD_PRESSURE: 'Blood pressure',
        BLOOD_GLUCOSE: 'Blood glucose',
        BMI: 'BMI',
        TEMPERATURE: 'Temperature',
        OXYGEN_SATURATION: 'Oxygen saturation',
        PULSE: 'Pulse',
      } as const
    )[code];
  }
}
