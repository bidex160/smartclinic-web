// Keep your existing imports
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-provider-session-header',
  imports: [
    RouterLink,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- =========================================================
         KEEP YOUR EXISTING DESKTOP SIDEBAR HERE
    ========================================================== -->

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
          routerLink="/provider/dashboard"
          class="
            inline-flex items-center gap-2
            rounded-lg
            focus:outline-none
            focus:ring-1
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
              Provider Portal
            </span>
          </span>
        </a>

        @if (authState.currentUser(); as user) {
          <div class="text-right">
            <p class="max-w-32 truncate text-sm font-bold text-slate-900">
              {{ user.displayName }}
            </p>

            <p class="text-xs text-slate-500">
              Provider
            </p>
          </div>
        }
      </div>
    </header>

    <!-- =========================================================
         MOBILE NAVIGATION
    ========================================================== -->
    <details
      #mobileNav
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
          focus:ring-1
          focus:ring-inset
          focus:ring-brand-200
        "
      >
        Provider navigation
      </summary>

      <div class="border-t border-slate-100 px-4 py-4">
        <nav
          aria-label="Mobile provider portal"
          class="grid gap-1"
          (click)="closeMobileNav($event, mobileNav)"
        >
          <!-- Dashboard -->
          <a
            routerLink="/provider/dashboard"
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

          @if (operational()) {
            <!-- =================================================
                 WORK
            ================================================== -->
            <p
              class="
                mt-5 px-3
                text-xs font-bold uppercase
                tracking-wider
                text-slate-400
              "
            >
              Work
            </p>

            <a
              routerLink="/provider/offers"
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
              My Offers
            </a>

            <a
              routerLink="/provider/appointments"
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
              Health Checks
            </a>

            <a
              routerLink="/provider/care-requests"
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
              Care Requests
            </a>

            <a
              routerLink="/provider/care-appointments"
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
              Care Appointments
            </a>

            <a
              routerLink="/provider/earnings"
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
              Earnings
            </a>

            <a
              routerLink="/provider/payouts"
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
              Payouts
            </a>

            <a
              routerLink="/provider/payout-accounts"
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
              Payout Accounts
            </a>

            <a
              routerLink="/provider/fasttrack"
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
              FastTrack
            </a>

            <a
              routerLink="/provider/health-record-access"
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
              Health Record Access
            </a>

            <a
              routerLink="/provider/shared-health-records"
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
              Shared Health Records
            </a>

            <a
              routerLink="/provider/patient-connections"
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
              Patient Requests
            </a>

            <a
              routerLink="/provider/pharmacy-orders"
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
              Pharmacy Orders
            </a>
          }

          <!-- =================================================
               SETUP
          ================================================== -->
          <p
            class="
              mt-5 px-3
              text-xs font-bold uppercase
              tracking-wider
              text-slate-400
            "
          >
            Setup
          </p>

          <a
            routerLink="/provider/profile"
            fragment="profile"
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
            Profile
          </a>

          <a
            routerLink="/provider/service-units"
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
            Service Units
          </a>

          <a
            routerLink="/provider/patient-connections/configuration"
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
            Patient Connection Setup
          </a>

          <a
            routerLink="/provider/profile"
            fragment="configuration"
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
            Health Check Services & Locations
          </a>

          <a
            routerLink="/provider/care-services"
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
            Care Services
          </a>

          <a
            routerLink="/provider/payout-accounts"
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
            Payout Accounts
          </a>

          <a
            routerLink="/provider/profile"
            fragment="availability"
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
            Availability
          </a>

          <a
            routerLink="/provider/profile"
            fragment="service-areas"
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
            Home Visit Coverage
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
              focus:ring-1
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
export class ProviderSessionHeaderComponent {
  private readonly authSession = inject(AuthSessionService);

  readonly authState = inject(AuthStateService);

  readonly operational = input(true);

  /**
   * Close the expanded mobile navigation whenever
   * the user selects one of its router links.
   *
   * We intentionally only react to <a> elements so
   * other interactions inside the nav are unaffected.
   */
  closeMobileNav(
    event: MouseEvent,
    mobileNav: HTMLDetailsElement,
  ): void {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest('a');

    if (!link) {
      return;
    }

    mobileNav.open = false;
  }

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