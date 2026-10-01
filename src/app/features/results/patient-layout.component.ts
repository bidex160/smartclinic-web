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
import { DeviceNotificationsService } from '../../core/services/device-notifications.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
import { NotificationBellComponent } from '../../shared/components/notification-bell.component';

@Component({
  selector: 'app-patient-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NotificationBellComponent],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col overflow-hidden bg-ink text-white lg:flex"
    >
      <div class="sc-motif pointer-events-none absolute inset-x-0 top-0 h-48 opacity-[0.06]" aria-hidden="true"></div>
      <div class="sc-weave absolute inset-x-0 top-0" aria-hidden="true"></div>

      <a
        routerLink="/"
        class="relative mx-5 mt-7 flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ochre-300"
      >
        <img class="size-10 rounded-xl bg-white/10 p-1" src="/assets/fanvico.png" alt="SmartClinic Logo" />
        <span>
          <strong class="font-display block text-[17px] font-semibold leading-tight text-white">SmartClinic</strong>
          <small class="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ochre-300">Health companion</small>
        </span>
      </a>

      @if (authState.currentUser(); as user) {
        <div class="relative mx-5 mt-6 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ochre-300 to-clay-500 text-sm font-bold text-ink" aria-hidden="true">{{ initials() }}</span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold">{{ user.displayName }}</span>
            <span class="block text-xs text-white/60">Personal health space</span>
          </span>
        </div>
      }

      <nav class="relative mt-5 flex-1 overflow-y-auto px-3 pb-4" aria-label="Patient portal">
        @for (group of navigationGroups(); track group.label) {
          <section class="mb-3" [attr.data-navigation-group]="group.label">
            <h2 class="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {{ group.label }}
            </h2>
            <div class="grid gap-0.5">
              @for (item of group.items; track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-white/15"
                  [routerLinkActiveOptions]="{ exact: item.exact }"
                  class="group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ochre-300"
                >
                  <svg aria-hidden="true" class="size-[18px] shrink-0 text-white/50 transition group-hover:text-ochre-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    @for (d of iconFor(item.route); track $index) { <path [attr.d]="d" /> }
                  </svg>
                  {{ item.label }}
                </a>
              }
            </div>
          </section>
        }
      </nav>

      <div class="relative flex items-center gap-2 border-t border-white/10 px-5 py-4">
        <button
          type="button"
          (click)="logout()"
          class="min-h-10 flex-1 rounded-xl px-3 text-left text-sm font-semibold text-white/75 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ochre-300"
        >
          Sign out
        </button>
        <div class="rounded-xl bg-white">
          <app-notification-bell />
        </div>
      </div>
    </aside>

    <header class="sticky top-0 z-30 border-b border-ink/[0.06] bg-sand-50/90 px-4 py-2.5 backdrop-blur-xl lg:hidden">
      <div class="flex items-center justify-between">
        <a routerLink="/me/dashboard" class="flex items-center gap-2.5" aria-label="SmartClinic home">
          <img class="size-9 rounded-xl" src="/assets/fanvico.png" alt="" />
          <span class="font-display text-lg font-semibold text-ink">SmartClinic</span>
        </a>

        <div class="flex items-center gap-1.5">
          <app-notification-bell />
          <button
            type="button"
            (click)="menuOpen.set(!menuOpen())"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="patient-mobile-nav"
            class="grid size-11 place-items-center rounded-full text-ink transition hover:bg-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span class="sr-only">Menu</span>
            <svg aria-hidden="true" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              @if (menuOpen()) { <path d="M6 6l12 12M18 6 6 18" /> } @else { <path d="M4 7h16M4 12h16M4 17h10" /> }
            </svg>
          </button>
        </div>
      </div>

      @if (menuOpen()) {
        <nav id="patient-mobile-nav" class="mt-3 grid max-h-[70vh] gap-1 overflow-y-auto pb-3" aria-label="Patient portal mobile">
          @for (item of navigation(); track item.route) {
            <a
              [routerLink]="item.route"
              (click)="menuOpen.set(false)"
              class="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-ink hover:bg-white"
            >
              <svg aria-hidden="true" class="size-5 shrink-0 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                @for (d of iconFor(item.route); track $index) { <path [attr.d]="d" /> }
              </svg>
              {{ item.label }}
            </a>
          }

          <a routerLink="/me/notifications" (click)="menuOpen.set(false)" class="rounded-xl px-3 py-3 font-medium text-ink hover:bg-white">Notifications</a>

          <button
            type="button"
            (click)="logout()"
            class="rounded-xl px-3 py-3 text-left font-semibold text-clay-700 hover:bg-white"
          >
            Sign out
          </button>
        </nav>
      }
    </header>

    <div
      data-patient-content
      class="min-h-screen bg-sand-50 pb-[calc(9rem+env(safe-area-inset-bottom))] lg:ml-[17rem] lg:pb-24"
    >
      <router-outlet />
    </div>

    <nav
      aria-label="Patient navigation"
      data-mobile-bottom-navigation
      class="fixed inset-x-0 bottom-0 z-40 grid-cols-5 border-t border-ink/[0.06] bg-white/90 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(29,21,48,0.06)] backdrop-blur-xl max-lg:grid lg:hidden"
    >
      @for (item of bottomNavigation; track item.route) {
        <a
          [routerLink]="item.route"
          [attr.aria-current]="isBottomNavActive(item.key) ? 'page' : null"
          [class.text-brand-800]="isBottomNavActive(item.key)"
          [class.text-ink-muted]="!isBottomNavActive(item.key)"
          class="group flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
        >
          <span
            class="grid h-7 w-12 place-items-center rounded-full transition"
            [class.bg-brand-100]="isBottomNavActive(item.key)"
          >
            <svg aria-hidden="true" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              @for (d of bottomIcons[item.key]; track $index) { <path [attr.d]="d" /> }
            </svg>
          </span>
          <span class="truncate">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientLayoutComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deviceNotifications = inject(DeviceNotificationsService);

  private readonly guidedSelfCheckOperationsApi = inject(GuidedSelfCheckOperationsApiService);

  readonly menuOpen = signal(false);
  readonly currentUrl = signal(this.router.url);

  readonly bottomNavigation = [
    { key: 'home', label: 'Home', route: '/me/dashboard' },
    { key: 'health', label: 'Health', route: '/me/health' },
    { key: 'care', label: 'Care', route: '/me/care' },
    { key: 'hospitals', label: 'Hospitals', route: '/me/providers' },
    { key: 'me', label: 'Me', route: '/me/profile' },
  ] as const;

  readonly initials = computed(() => {
    const name = this.authState.currentUser()?.displayName?.trim() ?? '';
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || 'SC';
  });

  readonly bottomIcons: Record<(typeof this.bottomNavigation)[number]['key'], readonly string[]> = {
    home: ['m3 11 9-8 9 8', 'M5 10v10h14V10M9 20v-6h6v6'],
    care: ['M12 21s-7-4.35-9.25-8.45C.9 9.2 2.48 5 6.5 5c2.1 0 3.2 1.2 3.9 2.2C11.1 6.2 12.2 5 14.5 5c4.02 0 5.6 4.2 3.75 7.55C16 16.65 12 21 12 21Z'],
    hospitals: ['M4 21V5h10v16M14 9h6v12M2 21h20', 'M8 9h2M8 13h2M8 17h2M17 13h1M17 17h1', 'M9 2v4M7 4h4'],
    health: ['M3 12h4l2-5 4 10 2-5h6'],
    me: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
  };

  private readonly navIcons: Record<string, readonly string[]> = {
    '/me/dashboard': ['m3 11 9-8 9 8', 'M5 10v10h14V10'],
    '/me/health': ['M3 12h4l2-5 4 10 2-5h6'],
    '/me/health-passport': ['M5 3h11l3 3v15H5Z', 'M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0', 'M8 18h8'],
    '/me/self-checks': ['M9 11l2 2 4-4', 'M5 4h14v16H5Z'],
    '/me/health-checks': ['M3 12h4l2-5 4 10 2-5h6'],
    '/me/book': ['M4 6h16v14H4Z', 'M8 3v6M16 3v6M4 10h16M12 13v4M10 15h4'],
    '/me/care': ['M12 21s-7-4.35-9.25-8.45C.9 9.2 2.48 5 6.5 5c2.1 0 3.2 1.2 3.9 2.2C11.1 6.2 12.2 5 14.5 5c4.02 0 5.6 4.2 3.75 7.55C16 16.65 12 21 12 21Z'],
    '/me/health-records': ['M6 3h9l4 4v14H6Z', 'M14 3v5h5M9 13h7M9 17h5'],
    '/me/lab-tests': ['M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3', 'M7.5 15h9'],
    '/me/medicines': ['M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7Z', 'M7 10l7 7'],
    '/me/prescriptions': ['M6 3h12v18H6Z', 'M9 8h3a2 2 0 0 1 0 4H9V7M11 12l4 5'],
    '/me/pay-bills': ['M3 6h18v12H3Z', 'M3 10h18M7 15h3'],
    '/me/fasttrack': ['M13 2 4 14h7l-1 8 9-12h-7Z'],
    '/me/providers': ['M4 21V5h10v16M14 9h6v12M2 21h20', 'M9 2v4M7 4h4'],
    '/me/insurance': ['M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z', 'M9 12l2 2 4-4'],
    '/healthy-families': ['M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M2 20a5 5 0 0 1 10 0M12 20a5 5 0 0 1 10 0'],
    '/me/impact': ['M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7Z'],
    '/me/referrals': ['M20 12v9H4v-9M2 7h20v5H2ZM12 21V7', 'M12 7S10 2 7.5 3.5 9 7 12 7ZM12 7s2-5 4.5-3.5S15 7 12 7Z'],
    '/me/family': ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M2 21a7 7 0 0 1 14 0M17 8v6M14 11h6'],
    '/me/profile': ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
  };

  iconFor(route: string): readonly string[] {
    return this.navIcons[route] ?? ['M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0', 'M12 8v4l3 2'];
  }

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
      {
        label: 'Home',
        items: [
          { label: 'Dashboard', route: '/me/dashboard', exact: true },
          { label: 'My Health', route: '/me/health', exact: true },
        ],
      },
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
          { label: 'Lab Tests', route: '/me/lab-tests', exact: true },
          { label: 'Medicines', route: '/me/medicines', exact: true },
          { label: 'Prescriptions', route: '/me/prescriptions', exact: false },
          { label: 'Pay Bills', route: '/me/pay-bills', exact: true },
          { label: 'FastTrack', route: '/me/fasttrack', exact: false },
        ],
      },
      {
        label: 'Hospitals',
        items: [{ label: 'My Providers', route: '/me/providers', exact: false }],
      },
      {
        label: 'Coverage & programmes',
        items: [
          { label: 'Health Insurance / HMO', route: '/me/insurance', exact: true },
          { label: 'Healthy Families', route: '/healthy-families', exact: true },
        ],
      },
      {
        label: 'Impact',
        items: [
          { label: 'My Impact', route: '/me/impact', exact: true },
          { label: 'Referrals & Rewards', route: '/me/referrals', exact: true },
        ],
      },
      { label: 'Account', items: [{ label: 'Family & Dependants', route: '/me/family', exact: true }, { label: 'Profile', route: '/me/profile', exact: true }] },
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
    // Keeps reminders reaching this browser when SmartClinic is closed; never prompts.
    void this.deviceNotifications.syncPush();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  isBottomNavActive(key: (typeof this.bottomNavigation)[number]['key']): boolean {
    const path = this.currentUrl().split(/[?#]/, 1)[0];
    const within = (...roots: string[]) => roots.some((root) => path === root || path.startsWith(`${root}/`));

    switch (key) {
      case 'home':
        return path === '/me/dashboard';
      case 'health':
        return within(
          '/me/health',
          '/me/health-journey',
          '/me/health-passport',
          '/me/health-records',
          '/me/health-checks',
          '/me/self-checks',
          '/me/book',
        );
      case 'care':
        return path === '/me/request-care' || within('/me/care');
      case 'hospitals':
        return within('/me/providers', '/me/partner-facilities');
      case 'me':
        return within('/me/profile', '/me/family', '/me/impact', '/me/referrals', '/me/insurance', '/me/notifications');
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

  async logout(): Promise<void> {
    // Stop reminders reaching this browser before the session ends, in case it is shared.
    await this.deviceNotifications.disconnectPush();
    this.session.logout().subscribe();
  }
}
