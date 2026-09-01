import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';

@Component({
  selector: 'app-patient-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-900 p-5 text-white lg:flex"
    >
      <a
        routerLink="/"
        class="flex items-center gap-3 rounded-lg focus:ring-4 focus:ring-white/30"
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
          <strong class="block text-[15px] font-bold text-white">SmartClinic Network</strong>
          <small class="uppercase tracking-wider text-brand-100">
            Patient Portal
          </small>
        </span>
      </a>

      <nav class="mt-9 grid gap-2" aria-label="Patient portal">
        @for (item of navigation(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-white/15"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="min-h-11 rounded-xl px-4 py-3 font-semibold hover:bg-white/10 focus:ring-4 focus:ring-white/30"
          >
            {{ item.label }}
          </a>
        }
      </nav>

      <button
        type="button"
        (click)="logout()"
        class="mt-auto min-h-11 rounded-xl border border-white/30 px-4 text-left font-bold focus:ring-4 focus:ring-white/30"
      >
        Sign out
      </button>
    </aside>

    <header class="border-b bg-white px-5 py-4 lg:hidden">
      <div class="flex items-center justify-between">
        <a routerLink="/me/dashboard" class="font-bold text-brand-900">
          SmartClinic · Patient Portal
        </a>

        <button
          type="button"
          (click)="menuOpen.set(!menuOpen())"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="patient-mobile-nav"
          class="min-h-11 rounded-lg border px-4 font-bold"
        >
          Menu
        </button>
      </div>

      @if (menuOpen()) {
        <nav
          id="patient-mobile-nav"
          class="mt-4 grid gap-2"
          aria-label="Patient portal mobile"
        >
          @for (item of navigation(); track item.route) {
            <a
              [routerLink]="item.route"
              (click)="menuOpen.set(false)"
              class="rounded-lg px-3 py-3 font-bold text-brand-800"
            >
              {{ item.label }}
            </a>
          }

          <button
            type="button"
            (click)="logout()"
            class="rounded-lg px-3 py-3 text-left font-bold text-brand-800"
          >
            Sign out
          </button>
        </nav>
      }
    </header>

    <div class="min-h-screen bg-slate-50 lg:ml-64">
      <router-outlet />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientLayoutComponent implements OnInit {
  private readonly session = inject(AuthSessionService);

  private readonly guidedSelfCheckOperationsApi = inject(
    GuidedSelfCheckOperationsApiService,
  );

  readonly menuOpen = signal(false);

  /**
   * Backend-authoritative review access.
   *
   * We do not infer this from USER / ADMIN / PROVIDER roles.
   * A successful call to the internal review endpoint confirms
   * that this user is eligible to access the internal clinical
   * review workflow.
   */
  readonly canReviewSelfChecks = signal(false);

  readonly navigation = computed(() => {
    const items = [
      {
        label: 'Dashboard',
        route: '/me/dashboard',
        exact: true,
      },
      {
        label: 'Smart Health Passport',
        route: '/me/health-passport',
        exact: true,
      },
      {
        label: 'Guided Self-Checks',
        route: '/me/self-checks',
        exact: false,
      },
      {
        label: 'My Health Checks',
        route: '/me/health-checks',
        exact: true,
      },
      {
        label: 'Book Health Check',
        route: '/me/book',
        exact: true,
      },
      {
        label: 'My Care',
        route: '/me/care',
        exact: false,
      },
      {
        label: 'Health Records',
        route: '/me/health-records',
        exact: false,
      },
      {
        label: 'Prescriptions',
        route: '/me/prescriptions',
        exact: false,
      },
      {
        label: 'My Providers',
        route: '/me/providers',
        exact: false,
      },
      {
        label: 'FastTrack',
        route: '/me/fasttrack',
        exact: false,
      },
      {
        label: 'My Impact',
        route: '/me/impact',
        exact: true,
      },
      {
        label: 'Referrals & Rewards',
        route: '/me/referrals',
        exact: true,
      },
    ];

    if (this.canReviewSelfChecks()) {
      items.push({
        label: 'My Reviews',
        route: '/me/internal/guided-self-check-reviews',
        exact: false,
      });
    }

    items.push({
      label: 'Profile',
      route: '/me/profile',
      exact: true,
    });

    return items;
  });

  ngOnInit(): void {
    this.loadClinicalReviewAccess();
  }

  private loadClinicalReviewAccess(): void {
    this.guidedSelfCheckOperationsApi
      .listMyReviews({
        page: 1,
        limit: 1,
      })
      .subscribe({
        next: () => {
          this.canReviewSelfChecks.set(true);
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.canReviewSelfChecks.set(false);
            return;
          }

          // Do not incorrectly mark an eligible clinician as unauthorized
          // merely because the server/network temporarily failed.
          console.error(
            'Unable to determine internal clinical review access',
            error,
          );
        },
      });
  }

  logout(): void {
    this.session.logout().subscribe();
  }
}