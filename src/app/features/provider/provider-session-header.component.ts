import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-provider-session-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-b border-brand-100 bg-white lg:pl-64">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10"
      >
        <div>
          <a routerLink="/" class="font-bold text-brand-900">SmartClinic</a>
          <p class="text-sm font-semibold uppercase tracking-wider text-slate-600">
            Provider Portal
          </p>
        </div>
        <div class="flex items-center gap-4">
          @if (authState.currentUser(); as user) {
            <p class="hidden text-right text-sm text-slate-600 sm:block">
              <span class="block font-bold text-slate-900">{{ user.displayName }}</span>
              <span>Provider</span>
            </p>
          }
          <button
            type="button"
            (click)="logout()"
            [disabled]="authState.loading()"
            class="min-h-11 rounded-lg border border-brand-600 px-4 py-2 font-bold text-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-wait disabled:opacity-60"
          >
            {{ authState.loading() ? 'Signing out…' : 'Sign out' }}
          </button>
        </div>
      </div>
    </header>
    <aside
      class="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-brand-100 bg-brand-950 px-5 py-6 text-white lg:block"
    >
      <a routerLink="/" class="text-xl font-bold">SmartClinic</a>
      <p class="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-200">
        Provider Portal
      </p>
      <nav aria-label="Provider portal" class="mt-8 grid gap-1 text-sm">
        <a
          routerLink="/provider/dashboard"
          routerLinkActive="bg-white/15"
          class="rounded-lg px-3 py-3 font-bold focus:ring-4 focus:ring-brand-300"
          >Dashboard</a
        >
        @if (operational()) {
          <p class="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-brand-200">Work</p>
          <a
            routerLink="/provider/offers"
            routerLinkActive="bg-white/15"
            class="rounded-lg px-3 py-3 font-bold"
            >My Offers</a
          >
          <a
            routerLink="/provider/appointments"
            routerLinkActive="bg-white/15"
            class="rounded-lg px-3 py-3 font-bold"
            >Appointments / Health Checks</a
          >
        }
        <p class="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-brand-200">Setup</p>
        <a routerLink="/provider/profile" fragment="profile" class="rounded-lg px-3 py-3 font-bold"
          >Profile</a
        >
        <a
          routerLink="/provider/profile"
          fragment="configuration"
          class="rounded-lg px-3 py-3 font-bold"
          >Services, locations & availability</a
        >
        <a
          routerLink="/provider/profile"
          fragment="service-areas"
          class="rounded-lg px-3 py-3 font-bold"
          >Service Areas</a
        >
      </nav>
    </aside>
    <details class="border-b bg-white px-5 py-3 lg:hidden">
      <summary class="min-h-11 cursor-pointer py-2 font-bold text-brand-800">
        Provider navigation
      </summary>
      <nav aria-label="Mobile provider portal" class="grid gap-1 pb-3">
        <a routerLink="/provider/dashboard" class="rounded-lg px-3 py-3 font-bold">Dashboard</a>
        @if (operational()) {
          <a routerLink="/provider/offers" class="rounded-lg px-3 py-3 font-bold">My Offers</a>
          <a routerLink="/provider/appointments" class="rounded-lg px-3 py-3 font-bold"
            >Appointments / Health Checks</a
          >
        }
        <a routerLink="/provider/profile" class="rounded-lg px-3 py-3 font-bold">Provider setup</a>
      </nav>
    </details>
  `,
})
export class ProviderSessionHeaderComponent {
  private readonly authSession = inject(AuthSessionService);
  readonly authState = inject(AuthStateService);
  readonly operational = input(true);

  logout(): void {
    if (this.authState.loading()) return;
    this.authState.loading.set(true);
    this.authSession
      .logout()
      .pipe(finalize(() => this.authState.loading.set(false)))
      .subscribe();
  }
}
