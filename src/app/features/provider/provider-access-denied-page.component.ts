import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-provider-access-denied-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-xl px-5 py-16 text-center sm:px-8">
      <p class="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">Provider access</p>
      <h1 class="mt-3 text-3xl font-bold text-brand-900">Provider access required</h1>
      <p class="mt-4 leading-7 text-slate-600">
        This account does not have permission to view provider offers.
      </p>
      <a
        routerLink="/"
        class="mt-7 inline-flex min-h-12 items-center rounded-xl bg-brand-600 px-6 py-3 font-bold text-white focus:outline-none focus:ring-4 focus:ring-brand-200"
        >Return to SmartClinic</a
      >
    </section>
  `,
})
export class ProviderAccessDeniedPageComponent {}
