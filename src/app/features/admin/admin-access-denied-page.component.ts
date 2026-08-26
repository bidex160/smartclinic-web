import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-access-denied-page',
  imports: [RouterLink],
  template: `<section class="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
    <p class="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">Access denied</p>
    <h1 class="mt-3 text-3xl font-bold text-brand-900">You cannot manage package pricing</h1>
    <p class="mt-4 leading-7 text-slate-600">
      An ADMIN or OPERATIONS role is required for this area.
    </p>
    <a
      routerLink="/login"
      class="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 py-3 font-bold text-white focus:outline-none focus:ring-4 focus:ring-brand-200"
      >Return to admin sign in</a
    >
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccessDeniedPageComponent {}
