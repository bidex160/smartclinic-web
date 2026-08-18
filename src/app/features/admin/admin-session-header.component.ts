import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-admin-session-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-b border-brand-100 bg-white">
      <div class="mx-auto max-w-7xl px-5 py-4 sm:px-8 lg:px-10">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="font-bold text-brand-900">SmartClinic operations</p>
            @if (authState.currentUser(); as user) {
              <p class="text-sm text-slate-600">{{ user.displayName }}</p>
            }
          </div>
          <button
            type="button"
            (click)="logout()"
            [disabled]="authState.loading()"
            class="min-h-11 rounded-lg border border-brand-600 px-4 py-2 font-bold text-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-wait disabled:opacity-60"
          >
            {{ authState.loading() ? 'Signing out…' : 'Sign out' }}
          </button>
        </div>
        <nav aria-label="Operations" class="mt-4 flex flex-wrap gap-4 text-sm font-bold">
          <a
            routerLink="/admin/package-prices"
            routerLinkActive="text-brand-800 underline"
            class="rounded py-2 text-brand-700 underline-offset-4 focus:outline-none focus:ring-4 focus:ring-brand-200"
            >Package pricing</a
          >
          <a
            routerLink="/admin/matching-queue"
            routerLinkActive="text-brand-800 underline"
            class="rounded py-2 text-brand-700 underline-offset-4 focus:outline-none focus:ring-4 focus:ring-brand-200"
            >Matching queue</a
          >
          <a
            routerLink="/admin/providers"
            routerLinkActive="text-brand-800 underline"
            class="rounded py-2 text-brand-700 underline-offset-4 focus:outline-none focus:ring-4 focus:ring-brand-200"
            >Providers</a
          >
          <a
            routerLink="/admin/provider-assignments"
            routerLinkActive="text-brand-800 underline"
            class="rounded py-2 text-brand-700 underline-offset-4 focus:outline-none focus:ring-4 focus:ring-brand-200"
            >Provider assignments</a
          >
        </nav>
      </div>
    </header>
  `,
})
export class AdminSessionHeaderComponent {
  private readonly authSession = inject(AuthSessionService);
  readonly authState = inject(AuthStateService);

  logout(): void {
    if (this.authState.loading()) return;
    this.authState.loading.set(true);
    this.authSession
      .logout()
      .pipe(finalize(() => this.authState.loading.set(false)))
      .subscribe();
  }
}
