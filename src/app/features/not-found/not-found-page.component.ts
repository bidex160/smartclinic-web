import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `<section class="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-28">
    <p class="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">404</p>
    <h1 class="mt-3 text-4xl font-bold tracking-tight text-brand-900">
      We could not find that page
    </h1>
    <p class="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">
      The link may be out of date, or the page may have moved. You can safely return to
      SmartClinic's home page.
    </p>
    <a
      routerLink="/"
      class="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 py-3 font-bold text-white hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 focus:ring-offset-2"
      >Return home</a
    >
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
