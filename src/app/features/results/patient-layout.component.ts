import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';

@Component({
  selector: 'app-patient-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-900 p-5 text-white lg:flex"
    >
      <a routerLink="/" class="flex items-center gap-3 rounded-lg focus:ring-1 ml-2 focus:ring-white/30">
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
          <small class="uppercase tracking-wider text-brand-100"> Patient Portal </small>
        </span>
      </a>

      <nav class="mt-7 flex-1 overflow-y-auto pr-1" aria-label="Patient portal">
        @for (group of navigationGroups(); track group.label) {
          <section class="mb-4" [attr.data-navigation-group]="group.label">
            <h2 class="px-4 text-[11px] font-bold uppercase tracking-widest text-brand-200">
              {{ group.label }}
            </h2>
            <div class="mt-1 grid gap-1">
              @for (item of group.items; track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-white/15"
                  [routerLinkActiveOptions]="{ exact: item.exact }"
                  class="flex min-h-11 items-center rounded-xl px-4 py-2 font-semibold hover:bg-white/10 focus:ring-1 ml-2 focus:ring-white/30"
                >
                  {{ item.label }}
                </a>
              }
            </div>
          </section>
        }
      </nav>

      <button
        type="button"
        (click)="logout()"
        class="mt-auto min-h-11 rounded-xl border border-white/30 px-4 text-left font-bold focus:ring-1 ml-2 focus:ring-white/30"
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
        <nav id="patient-mobile-nav" class="mt-4 grid gap-2" aria-label="Patient portal mobile">
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

    <div
      data-patient-content
      class="min-h-screen bg-slate-50 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:ml-64 lg:pb-0"
    >
      <router-outlet />
    </div>

    <nav
      aria-label="Patient navigation"
      data-mobile-bottom-navigation
     class="fixed inset-x-0 bottom-0 z-40 grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur max-lg:grid lg:hidden"
    >
      @for (item of bottomNavigation; track item.route) {
        <a
          [routerLink]="item.route"
          [attr.aria-current]="isBottomNavActive(item.key) ? 'page' : null"
          [class.bg-brand-50]="isBottomNavActive(item.key)"
          [class.text-brand-700]="isBottomNavActive(item.key)"
          [class.text-slate-600]="!isBottomNavActive(item.key)"
          class="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-bold focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
        >
          @switch (item.key) {
            @case ('home') {
              <svg
                aria-hidden="true"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="m3 11 9-8 9 8" />
                <path d="M5 10v10h14V10M9 20v-6h6v6" />
              </svg>
            }
            @case ('care') {
              <svg
                aria-hidden="true"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M12 21s-7-4.35-9.25-8.45C.9 9.2 2.48 5 6.5 5c2.1 0 3.2 1.2 3.9 2.2C11.1 6.2 12.2 5 14.5 5c4.02 0 5.6 4.2 3.75 7.55C16 16.65 12 21 12 21Z"
                />
                <path d="M8 12h2l1-2 2 4 1-2h2" />
              </svg>
            }
            @case ('hospitals') {
              <svg
                aria-hidden="true"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M4 21V5h10v16M14 9h6v12M8 9h2M8 13h2M8 17h2M17 13h1M17 17h1M2 21h20" />
                <path d="M8 5V2h2v3" />
              </svg>
            }
            @case ('impact') {
              <svg
                aria-hidden="true"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            @case ('account') {
              <svg
                aria-hidden="true"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            }
          }
          <span class="truncate">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientLayoutComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly guidedSelfCheckOperationsApi = inject(GuidedSelfCheckOperationsApiService);

  readonly menuOpen = signal(false);
  readonly currentUrl = signal(this.router.url);

  readonly bottomNavigation = [
    { key: 'home', label: 'Home', route: '/me/dashboard' },
    { key: 'care', label: 'Care', route: '/me/care' },
    { key: 'hospitals', label: 'Hospitals', route: '/me/providers' },
    { key: 'impact', label: 'Impact', route: '/me/impact' },
    { key: 'account', label: 'Account', route: '/me/profile' },
  ] as const;

  /**
   * Backend-authoritative review access.
   *
   * We do not infer this from USER / ADMIN / PROVIDER roles.
   * A successful call to the internal review endpoint confirms
   * that this user is eligible to access the internal clinical
   * review workflow.
   */
  readonly canReviewSelfChecks = signal(false);

  readonly navigationGroups = computed(() => {
    const groups = [
      { label: 'Home', items: [{ label: 'Dashboard', route: '/me/dashboard', exact: true }] },
      {
        label: 'Stay Well',
        items: [
          { label: 'Smart Health Passport', route: '/me/health-passport', exact: true },
          { label: 'Guided Self-Checks', route: '/me/self-checks', exact: false },
          { label: 'My Health Checks', route: '/me/health-checks', exact: true },
          { label: 'Book Health Check', route: '/me/book', exact: true },
        ],
      },
      {
        label: 'Care',
        items: [
          { label: 'My Care', route: '/me/care', exact: false },
          { label: 'Health Records', route: '/me/health-records', exact: false },
          { label: 'Prescriptions', route: '/me/prescriptions', exact: false },
          { label: 'FastTrack', route: '/me/fasttrack', exact: false },
        ],
      },
      {
        label: 'Hospitals',
        items: [{ label: 'My Providers', route: '/me/providers', exact: false }],
      },
      {
        label: 'Impact',
        items: [
          { label: 'My Impact', route: '/me/impact', exact: true },
          { label: 'Referrals & Rewards', route: '/me/referrals', exact: true },
        ],
      },
      { label: 'Account', items: [{ label: 'Profile', route: '/me/profile', exact: true }] },
    ];

    if (this.canReviewSelfChecks()) {
      groups.push({
        label: 'Clinical Work',
        items: [
          {
            label: 'My Reviews',
            route: '/me/internal/guided-self-check-reviews',
            exact: false,
          },
        ],
      });
    }

    return groups;
  });

  readonly navigation = computed(() =>
    this.navigationGroups().flatMap((group) => group.items),
  );

  ngOnInit(): void {
    this.loadClinicalReviewAccess();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  isBottomNavActive(key: (typeof this.bottomNavigation)[number]['key']): boolean {
    const path = this.currentUrl().split(/[?#]/, 1)[0];

    switch (key) {
      case 'home':
        return path === '/me/dashboard';
      case 'care':
        return path === '/me/request-care' || path === '/me/care' || path.startsWith('/me/care/');
      case 'hospitals':
        return path === '/me/providers' || path.startsWith('/me/providers/');
      case 'impact':
        return (
          path === '/me/impact' || path === '/me/referrals' || path.startsWith('/me/referrals/')
        );
      case 'account':
        return path === '/me/profile';
    }
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
          console.error('Unable to determine internal clinical review access', error);
        },
      });
  }

  logout(): void {
    this.session.logout().subscribe();
  }
}
