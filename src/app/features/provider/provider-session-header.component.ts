import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-provider-session-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-b border-brand-100 bg-white">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10"
      >
        <div>
          <p class="font-bold text-brand-900">SmartClinic</p>
          <p class="text-sm text-slate-600">Provider offers</p>
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
  `,
})
export class ProviderSessionHeaderComponent {
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
