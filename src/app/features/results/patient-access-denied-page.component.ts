import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-patient-access-denied-page',
  imports: [RouterLink],
  template: `<main class="mx-auto max-w-2xl px-5 py-16 text-center">
    <h1 class="text-3xl font-bold text-brand-900">Patient portal access required</h1>
    <p class="mt-4 text-slate-600">This account does not have access to a patient workspace.</p>
    <a
      routerLink="/"
      class="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-600 px-6 font-bold text-white"
      >Return home</a
    >
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientAccessDeniedPageComponent {}
