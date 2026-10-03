import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { DeviceNotificationsService } from '../../core/services/device-notifications.service';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
import { PatientLayoutComponent } from './patient-layout.component';

describe('PatientLayoutComponent', () => {
  const calls: string[] = [];
  const device = {
    syncPush: vi.fn(async () => false),
    disconnectPush: vi.fn(async () => { calls.push('disconnect'); }),
  };

  async function setup(reviewAccess: boolean | 401 | 403 = false) {
    await TestBed.configureTestingModule({
      imports: [PatientLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: { logout: () => { calls.push('logout'); return of(true); } } },
        { provide: DeviceNotificationsService, useValue: device },
        {
          provide: GuidedSelfCheckOperationsApiService,
          useValue: {
            listMyReviews: () =>
              reviewAccess === true
                ? of({ items: [], total: 0, page: 1, limit: 1 })
                : throwError(() => ({ status: reviewAccess || 403 })),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientLayoutComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders exactly five primary mobile destinations using established routes', async () => {
    const fixture = await setup();
    const nav = fixture.nativeElement.querySelector('[data-mobile-bottom-navigation]');
    const links = [...nav.querySelectorAll('a')].map((link: HTMLAnchorElement) => ({
      label: link.textContent.trim(),
      route: link.getAttribute('href'),
    }));

    expect(nav.getAttribute('aria-label')).toBe('Patient navigation');
    expect(links).toEqual([
      { label: 'Home', route: '/me/dashboard' },
      { label: 'Health', route: '/me/health' },
      { label: 'Care', route: '/me/care' },
      { label: 'Hospitals', route: '/me/providers' },
      { label: 'Me', route: '/me/profile' },
    ]);
  });

  it.each([
    ['/me/dashboard', 'Home'],
    ['/me/health', 'Health'],
    ['/me/health-passport', 'Health'],
    ['/me/self-checks/SC-1', 'Health'],
    ['/me/health-records/HR-1', 'Health'],
    ['/me/care/CR-123', 'Care'],
    ['/me/request-care', 'Care'],
    ['/me/providers/connect', 'Hospitals'],
    ['/me/partner-facilities', 'Hospitals'],
    ['/me/referrals', 'Me'],
    ['/me/referrals/history', 'Me'],
    ['/me/impact', 'Me'],
    ['/me/profile', 'Me'],
  ])('marks %s as %s without requiring an exact child-route match', async (url, label) => {
    const fixture = await setup();
    fixture.componentInstance.currentUrl.set(url);
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector(
      '[data-mobile-bottom-navigation] a[aria-current="page"]',
    );

    expect(active?.textContent.trim()).toBe(label);
  });

  it('does not mark unrelated pages as an active tab', async () => {
    const fixture = await setup();

    for (const url of ['/me/notifications-settings', '/healthy-families', '/me/fasttrack']) {
      fixture.componentInstance.currentUrl.set(url);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector(
          '[data-mobile-bottom-navigation] a[aria-current="page"]',
        ),
      ).toBeNull();
    }
  });

  it('keeps shell-level fixed-nav clearance, safe-area spacing and desktop hiding', async () => {
    const fixture = await setup();
    const nav = fixture.nativeElement.querySelector('[data-mobile-bottom-navigation]');
    const content = fixture.nativeElement.querySelector('[data-patient-content]');

    expect(nav.classList.contains('lg:hidden')).toBe(true);
    expect(nav.className).toContain('pb-[env(safe-area-inset-bottom)]');
    // Clears both the bottom bar and the floating guide so the last action is never covered.
    expect(content.className).toContain('pb-[calc(9rem+env(safe-area-inset-bottom))]');
    expect(content.classList.contains('lg:pb-24')).toBe(true);
  });

  it('preserves Health Records in desktop and expandable mobile navigation', async () => {
    const fixture = await setup();
    fixture.componentInstance.menuOpen.set(true);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a[href="/me/health-records"]');
    expect(links.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Health Records');
  });

  it('groups every desktop patient destination by product area without changing routes', async () => {
    const fixture = await setup();
    const groups = [...fixture.nativeElement.querySelectorAll('[data-navigation-group]')].map(
      (group: HTMLElement) => ({
        label: group.getAttribute('data-navigation-group'),
        links: [...group.querySelectorAll('a')].map((link: HTMLAnchorElement) => [
          link.textContent.trim(),
          link.getAttribute('href'),
        ]),
      }),
    );

    expect(groups).toEqual([
      { label: 'Home', links: [['Dashboard', '/me/dashboard'], ['My Health', '/me/health']] },
      {
        label: 'Stay Well',
        links: [
          ['Smart Health Passport', '/me/health-passport'],
          ['Guided Self-Checks', '/me/self-checks'],
          ['My Health Checks', '/me/health-checks'],
          ['Book Health Check', '/me/book'],
          ['My progress', '/me/progress'],
          ['Play & challenges', '/me/play'],
        ],
      },
      {
        label: 'Care',
        links: [
          ['My Care', '/me/care'],
          ['Health Records', '/me/health-records'],
          ['Lab Tests', '/me/lab-tests'],
          ['Medicines', '/me/medicines'],
          ['Prescriptions', '/me/prescriptions'],
          ['Pay Bills', '/me/pay-bills'],
          ['FastTrack', '/me/fasttrack'],
        ],
      },
      { label: 'Hospitals', links: [['My Providers', '/me/providers']] },
      {
        label: 'Coverage & programmes',
        links: [
          ['Health Insurance / HMO', '/me/insurance'],
          ['Healthy Families', '/healthy-families'],
        ],
      },
      {
        label: 'Impact',
        links: [
          ['My Impact', '/me/impact'],
          ['Referrals & Rewards', '/me/referrals'],
        ],
      },
      { label: 'Account', links: [['Family & Dependants', '/me/family'], ['Profile', '/me/profile'], ['Get help', '/help']] },
    ]);
  });

  it('exposes HMO and Healthy Families in desktop and mobile patient navigation', async () => {
    const fixture = await setup();
    fixture.componentInstance.menuOpen.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('a[href="/me/insurance"]')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('a[href="/healthy-families"]')).toHaveLength(2);
  });

  it('preserves backend-authoritative My Reviews navigation visibility', async () => {
    const fixture = await setup(true);
    fixture.componentInstance.menuOpen.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('My Reviews');
    expect(
      fixture.nativeElement.querySelectorAll('a[href="/me/internal/guided-self-check-reviews"]')
        .length,
    ).toBe(2);
    const group = fixture.nativeElement.querySelector(
      '[data-navigation-group="Clinical Work"]',
    );
    expect(group.textContent).toContain('My Reviews');
  });

  it.each([401, 403] as const)(
    'keeps Clinical Work absent when backend-authoritative access returns %s',
    async (status) => {
      const fixture = await setup(status);
      fixture.componentInstance.menuOpen.set(true);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelector('[data-navigation-group="Clinical Work"]'),
      ).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('My Reviews');
    },
  );

  it('keeps sign out and existing active route styling available', async () => {
    const fixture = await setup();
    const dashboard = fixture.nativeElement.querySelector(
      '[data-navigation-group="Home"] a[href="/me/dashboard"]',
    );

    expect(dashboard.getAttribute('routerlinkactive')).toBe('bg-white/15');
    expect(fixture.nativeElement.querySelector('aside button').textContent).toContain('Sign out');
  });

  it('keeps this browser subscribed on load and stops push before signing out', async () => {
    calls.length = 0;
    device.syncPush.mockClear();
    const fixture = await setup();
    expect(device.syncPush).toHaveBeenCalledTimes(1);
    await fixture.componentInstance.logout();
    expect(calls).toEqual(['disconnect', 'logout']);
  });
});
