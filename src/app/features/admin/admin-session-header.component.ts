import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-admin-session-header',
  imports: [
    RouterLink,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- =========================================================
         DESKTOP SIDEBAR
    ========================================================== -->
    <aside
      class="
        fixed inset-y-0 left-0 z-40 hidden w-64 flex-col
        border-r border-brand-800
        bg-brand-950
        text-white
        lg:flex
      "
    >
      <!-- Brand -->
      <div class="border-b border-brand-800 px-6 py-6">
        <a
          routerLink="/"
          class="
            inline-flex items-center gap-3
            rounded-lg
            focus:outline-none
            focus:ring-4
            focus:ring-brand-700
          "
        >
          <span
            class="
              flex h-10 w-10 items-center justify-center
              rounded-xl
              bg-brand-600
              text-lg font-bold text-white
              shadow-sm
            "
          >
            S
          </span>

          <span>
            <span class="block text-lg font-bold text-white">
              SmartClinic
            </span>

            <span
              class="
                mt-0.5 block
                text-[11px] font-bold uppercase
                tracking-[0.16em]
                text-brand-300
              "
            >
              Operations
            </span>
          </span>
        </a>
      </div>

      <!-- Navigation -->
      <nav
        aria-label="SmartClinic operations"
        class="flex-1 overflow-y-auto px-4 py-6"
      >
        <div class="grid gap-1">
          <!-- Dashboard -->
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="!bg-brand-700 !text-white"
            [routerLinkActiveOptions]="{ exact: true }"
            class="
              flex min-h-11 items-center
              rounded-xl
              px-4 py-3
              text-sm font-semibold
              text-brand-100
              transition
              hover:bg-brand-800
              hover:text-white
              focus:outline-none
              focus:ring-4
              focus:ring-brand-700
            "
          >
            Dashboard
          </a>

          <!-- OPERATIONS -->
          <p
            class="
              mb-2 mt-7
              px-4
              text-[11px] font-bold uppercase
              tracking-[0.16em]
              text-brand-300
            "
          >
            Operations
          </p>

          <a
            routerLink="/admin/matching-queue"
            routerLinkActive="!bg-brand-700 !text-white"
            class="
              flex min-h-11 items-center
              rounded-xl
              px-4 py-3
              text-sm font-semibold
              text-brand-100
              transition
              hover:bg-brand-800
              hover:text-white
              focus:outline-none
              focus:ring-4
              focus:ring-brand-700
            "
          >
            Matching Queue
          </a>

          <a
            routerLink="/admin/provider-assignments"
            routerLinkActive="!bg-brand-700 !text-white"
            class="
              flex min-h-11 items-center
              rounded-xl
              px-4 py-3
              text-sm font-semibold
              text-brand-100
              transition
              hover:bg-brand-800
              hover:text-white
              focus:outline-none
              focus:ring-4
              focus:ring-brand-700
            "
          >
            Provider Assignments
          </a>
          <a routerLink="/admin/referrals" routerLinkActive="!bg-brand-700 !text-white" class="flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold text-brand-100 transition hover:bg-brand-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-brand-700">Referrals</a>
          <a routerLink="/admin/reward-withdrawals" routerLinkActive="!bg-brand-700 !text-white" class="flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold text-brand-100 transition hover:bg-brand-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-brand-700">Reward Withdrawals</a>

          <!-- PROVIDERS -->
          <p
            class="
              mb-2 mt-7
              px-4
              text-[11px] font-bold uppercase
              tracking-[0.16em]
              text-brand-300
            "
          >
            Providers
          </p>

          <a
            routerLink="/admin/providers"
            routerLinkActive="!bg-brand-700 !text-white"
            class="
              flex min-h-11 items-center
              rounded-xl
              px-4 py-3
              text-sm font-semibold
              text-brand-100
              transition
              hover:bg-brand-800
              hover:text-white
              focus:outline-none
              focus:ring-4
              focus:ring-brand-700
            "
          >
            Providers
          </a>

          <!-- COMMERCIAL -->
          <p
            class="
              mb-2 mt-7
              px-4
              text-[11px] font-bold uppercase
              tracking-[0.16em]
              text-brand-300
            "
          >
            Commercial
          </p>

          <a
            routerLink="/admin/package-prices"
            routerLinkActive="!bg-brand-700 !text-white"
            class="
              flex min-h-11 items-center
              rounded-xl
              px-4 py-3
              text-sm font-semibold
              text-brand-100
              transition
              hover:bg-brand-800
              hover:text-white
              focus:outline-none
              focus:ring-4
              focus:ring-brand-700
            "
          >
            Package Pricing
          </a>
        </div>
      </nav>

      <!-- Account footer -->
      <div class="border-t border-brand-800 px-5 py-5">
        @if (authState.currentUser(); as user) {
          <div class="mb-4">
            <p class="truncate text-sm font-bold text-white">
              {{ user.displayName }}
            </p>

            <p class="mt-1 text-xs font-medium text-brand-300">
              Admin / Operations
            </p>
          </div>
        }

        <button
          type="button"
          (click)="logout()"
          [disabled]="authState.loading()"
          class="
            flex min-h-11 w-full items-center justify-center
            rounded-xl
            border border-brand-600
            px-4 py-2.5
            text-sm font-bold
            text-brand-100
            transition
            hover:border-brand-400
            hover:bg-brand-800
            hover:text-white
            focus:outline-none
            focus:ring-4
            focus:ring-brand-700
            disabled:cursor-wait
            disabled:opacity-60
          "
        >
          {{ authState.loading() ? 'Signing out…' : 'Sign out' }}
        </button>
      </div>
    </aside>

    <!-- =========================================================
         MOBILE HEADER
    ========================================================== -->
    <header
      class="
        sticky top-0 z-40
        border-b border-slate-200
        bg-white
        lg:hidden
      "
    >
      <div
        class="
          flex min-h-16
          items-center justify-between
          gap-4
          px-5
        "
      >
        <a
          routerLink="/admin/dashboard"
          class="
            inline-flex items-center gap-2
            rounded-lg
            focus:outline-none
            focus:ring-4
            focus:ring-brand-200
          "
        >
          <span
            class="
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              bg-brand-600
              font-bold text-white
            "
          >
            S
          </span>

          <span>
            <span class="block font-bold text-brand-900">
              SmartClinic
            </span>

            <span
              class="
                block text-[10px]
                font-bold uppercase
                tracking-wider
                text-slate-400
              "
            >
              Operations
            </span>
          </span>
        </a>

        @if (authState.currentUser(); as user) {
          <div class="text-right">
            <p class="max-w-32 truncate text-sm font-bold text-slate-900">
              {{ user.displayName }}
            </p>

            <p class="text-xs text-slate-500">
              Admin / Operations
            </p>
          </div>
        }
      </div>
    </header>

    <!-- =========================================================
         MOBILE NAV
    ========================================================== -->
    <details
      class="
        border-b border-slate-200
        bg-white
        lg:hidden
      "
    >
      <summary
        class="
          flex min-h-12 cursor-pointer
          items-center
          px-5 py-3
          font-bold
          text-brand-800
          hover:bg-brand-50
          focus:outline-none
          focus:ring-4
          focus:ring-inset
          focus:ring-brand-200
        "
      >
        Operations navigation
      </summary>

      <div class="border-t border-slate-100 px-4 py-4">
        <nav
          aria-label="Mobile SmartClinic operations"
          class="grid gap-1"
        >
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="bg-brand-100 text-brand-900"
            [routerLinkActiveOptions]="{ exact: true }"
            class="
              min-h-11 rounded-lg
              px-3 py-3
              font-semibold
              text-slate-700
              hover:bg-brand-50
              hover:text-brand-900
            "
          >
            Dashboard
          </a>

          <p
            class="
              mt-5 px-3
              text-xs font-bold uppercase
              tracking-wider
              text-slate-400
            "
          >
            Operations
          </p>

          <a
            routerLink="/admin/matching-queue"
            routerLinkActive="bg-brand-100 text-brand-900"
            class="
              min-h-11 rounded-lg
              px-3 py-3
              font-semibold
              text-slate-700
              hover:bg-brand-50
              hover:text-brand-900
            "
          >
            Matching Queue
          </a>

          <a
            routerLink="/admin/provider-assignments"
            routerLinkActive="bg-brand-100 text-brand-900"
            class="
              min-h-11 rounded-lg
              px-3 py-3
              font-semibold
              text-slate-700
              hover:bg-brand-50
              hover:text-brand-900
            "
          >
            Provider Assignments
          </a>
          <a routerLink="/admin/referrals" routerLinkActive="bg-brand-100 text-brand-900" class="min-h-11 rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-900">Referrals</a>
          <a routerLink="/admin/reward-withdrawals" routerLinkActive="bg-brand-100 text-brand-900" class="min-h-11 rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-900">Reward Withdrawals</a>

          <p
            class="
              mt-5 px-3
              text-xs font-bold uppercase
              tracking-wider
              text-slate-400
            "
          >
            Providers
          </p>

          <a
            routerLink="/admin/providers"
            routerLinkActive="bg-brand-100 text-brand-900"
            class="
              min-h-11 rounded-lg
              px-3 py-3
              font-semibold
              text-slate-700
              hover:bg-brand-50
              hover:text-brand-900
            "
          >
            Providers
          </a>

          <p
            class="
              mt-5 px-3
              text-xs font-bold uppercase
              tracking-wider
              text-slate-400
            "
          >
            Commercial
          </p>

          <a
            routerLink="/admin/package-prices"
            routerLinkActive="bg-brand-100 text-brand-900"
            class="
              min-h-11 rounded-lg
              px-3 py-3
              font-semibold
              text-slate-700
              hover:bg-brand-50
              hover:text-brand-900
            "
          >
            Package Pricing
          </a>

          <div class="my-3 border-t border-slate-200"></div>

          <button
            type="button"
            (click)="logout()"
            [disabled]="authState.loading()"
            class="
              min-h-11 rounded-lg
              border border-brand-600
              px-3 py-3
              text-left
              font-bold
              text-brand-700
              hover:bg-brand-50
              focus:outline-none
              focus:ring-4
              focus:ring-brand-200
              disabled:cursor-wait
              disabled:opacity-60
            "
          >
            {{ authState.loading() ? 'Signing out…' : 'Sign out' }}
          </button>
        </nav>
      </div>
    </details>
  `,
})
export class AdminSessionHeaderComponent {
  private readonly authSession = inject(AuthSessionService);

  readonly authState = inject(AuthStateService);

  logout(): void {
    if (this.authState.loading()) {
      return;
    }

    this.authState.loading.set(true);

    this.authSession
      .logout()
      .pipe(
        finalize(() => {
          this.authState.loading.set(false);
        }),
      )
      .subscribe();
  }
}
