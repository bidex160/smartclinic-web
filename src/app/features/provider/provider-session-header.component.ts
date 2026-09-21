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
import { ProviderOnboardingProfile } from '../../core/models/provider-onboarding.model';
import { NotificationBellComponent } from '../../shared/components/notification-bell.component';

@Component({
  selector: 'app-provider-session-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    NotificationBellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
 <!-- =========================================================
         DESKTOP SIDEBAR
    ========================================================== -->
    <aside
      class="
        fixed inset-y-0 left-0 z-40
        hidden w-64 flex-col
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
            focus:ring-1 ml-2
            focus:ring-brand-700
          "
        >
          <img
            class="
              flex h-10 w-10 items-center justify-center
              rounded-xl
              bg-brand-600
              text-lg font-bold text-white
              shadow-sm
            "
            src="/assets/fanvico.png"
            alt="SmartClinic Logo"
          />

          <span>
            <span class="block text-[15px] font-bold text-white">
              SmartClinic Network
            </span>

            <span
              class="
                mt-0.5 block
                text-[11px] font-bold uppercase
                tracking-[0.16em]
                text-brand-300
              "
            >
              Provider Portal
            </span>
          </span>
        </a>
      </div>

      <!-- Navigation -->
      <nav
        aria-label="Provider portal"
        class="flex-1 overflow-y-auto px-4 py-6"
      >
        <div class="grid gap-1">
          <!-- Dashboard -->
          <a
            routerLink="/provider/dashboard"
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
              focus:ring-1 ml-2
              focus:ring-brand-700
            "
          >
            Dashboard
          </a>

          <!-- =====================================================
               WORK
          ====================================================== -->
          @if (operational()) {
            <p
              class="
                mb-2 mt-7
                px-4
                text-[11px] font-bold uppercase
                tracking-[0.16em]
                text-brand-300
              "
            >
              Work
            </p>

            @if (careProvider()) {
            <a
              routerLink="/provider/offers"
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
                focus:ring-1 ml-2
                focus:ring-brand-700
              "
            >
              My Offers
            </a>

            <a
              routerLink="/provider/appointments"
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
                focus:ring-1 ml-2
                focus:ring-brand-700
              "
            >
              Health Checks
            </a>


            <a
              routerLink="/provider/care-requests"
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
                focus:ring-1 ml-2
                focus:ring-brand-700
              "
            >
              Patient requests
            </a>

            <a
              routerLink="/provider/care-appointments"
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
                focus:ring-1 ml-2
                focus:ring-brand-700
              "
            >
              Appointments
            </a>

            }

            <a
              routerLink="/provider/earnings"
              routerLinkActive="!bg-brand-700 !text-white"
              class="flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold text-brand-100 transition hover:bg-brand-800 hover:text-white focus:outline-none focus:ring-1 ml-2 focus:ring-brand-700"
            >
              Payments
            </a>

            <a routerLink="/provider/payouts" routerLinkActive="!bg-brand-700 !text-white" class="flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold text-brand-100 transition hover:bg-brand-800 hover:text-white focus:outline-none focus:ring-1 ml-2 focus:ring-brand-700">Payouts</a>

            <a
              routerLink="/provider/fasttrack"
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
                focus:ring-1 ml-2
                focus:ring-brand-700
              "
            >
              FastTrack
            </a>
            <a
  routerLink="/provider/health-record-access"
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
    focus:ring-1
    ml-2
    focus:ring-brand-700
  "
>
  Patient record access
</a>

            <a
              routerLink="/provider/shared-health-records"
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
                focus:ring-1 ml-2
                focus:ring-brand-700
              "
            >
              Shared records
            </a>

            <!-- Exact match is important here.
                 Otherwise /provider/patient-connections/configuration
                 also activates this menu item. -->
            <a
              routerLink="/provider/patient-connections"
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
                focus:ring-1 ml-2
                focus:ring-brand-700
              "
            >
              Patient connections
            </a>

            @if (orderProvider()) {
            <a
              routerLink="/provider/pharmacy-orders"
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
                focus:ring-1 ml-2
                focus:ring-brand-700
              "
            >
              Patient orders
            </a>
            }
          }

          <!-- =====================================================
               SETUP
          ====================================================== -->
          <p
            class="
              mb-2 mt-7
              px-4
              text-[11px] font-bold uppercase
              tracking-[0.16em]
              text-brand-300
            "
          >
            Setup
          </p>

          <a
            routerLink="/provider/profile"
            fragment="profile"
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
              focus:ring-1 ml-2
              focus:ring-brand-700
            "
          >
            Profile
          </a>

          <a
            routerLink="/provider/service-units"
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
              focus:ring-1 ml-2
              focus:ring-brand-700
            "
          >
            Service units
          </a>

          <a
            routerLink="/provider/patient-connections/configuration"
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
              focus:ring-1 ml-2
              focus:ring-brand-700
            "
          >
            Connection setup
          </a>

          <a
            routerLink="/provider/profile"
            fragment="configuration"
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
              focus:ring-1 ml-2
              focus:ring-brand-700
            "
          >
            Health check setup
          </a>

            <a
              routerLink="/provider/care-services"
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
              focus:ring-1 ml-2
              focus:ring-brand-700
            "
          >
            Services
          </a>

          <a
            routerLink="/provider/profile"
            fragment="availability"
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
              focus:ring-1 ml-2
              focus:ring-brand-700
            "
          >
            Availability
          </a>

          <a
            routerLink="/provider/profile"
            fragment="service-areas"
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
              focus:ring-1 ml-2
              focus:ring-brand-700
            "
          >
            Home visit area
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
              Provider
            </p>
          </div>
        }

        <button
          type="button"
          (click)="logout()"
          [disabled]="authState.loading()"
          class="
            flex min-h-11 w-full
            items-center justify-center
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
            focus:ring-1 ml-2
            focus:ring-brand-700
            disabled:cursor-wait
            disabled:opacity-60
          "
        >
          {{ authState.loading() ? 'Signing out…' : 'Sign out' }}
        </button>
        <div class="mt-3 w-fit rounded-xl bg-white"><app-notification-bell /></div>
        <a routerLink="/provider/notifications" class="mt-3 block rounded-xl px-4 py-2 text-sm font-bold text-brand-100 hover:bg-brand-800">Notifications</a>
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

          <app-notification-bell />
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
    justify-end
    flex min-h-12 cursor-pointer
    items-center
    gap-2
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
Menu
  <svg
    class="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
    />
  </svg>

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

            @if (careProvider()) {
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
              Patient requests
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
              Appointments
            </a>

            }

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
              Payments
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
              Settlement account
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
              Patient record access
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
              Shared records
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
              Patient connections
            </a>

            @if (orderProvider()) {
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
              Patient orders
            </a>
            }
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
            Service units
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
            Connection setup
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
            Health check setup
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
            Services
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
            Settlement account
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
            Home visit area
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
  readonly providerType = input<ProviderOnboardingProfile['providerType'] | null>(null);
  readonly orderProvider = () => this.providerType() === 'PHARMACY' || this.providerType() === 'DIAGNOSTIC_CENTRE';
  readonly careProvider = () => !this.orderProvider();

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
