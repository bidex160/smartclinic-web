import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
import { PatientLayoutComponent } from './patient-layout.component';

describe('PatientLayoutComponent', () => {
  async function setup(reviewAccess: boolean | 401 | 403 = false) {
    await TestBed.configureTestingModule({
      imports: [PatientLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: { logout: () => of(undefined) } },
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
      { label: 'Care', route: '/me/care' },
      { label: 'Hospitals', route: '/me/providers' },
      { label: 'Impact', route: '/me/impact' },
      { label: 'Account', route: '/me/profile' },
    ]);
  });

  it.each([
    ['/me/dashboard', 'Home'],
    ['/me/care/CR-123', 'Care'],
    ['/me/request-care', 'Care'],
    ['/me/providers/connect', 'Hospitals'],
    ['/me/referrals', 'Impact'],
    ['/me/referrals/history', 'Impact'],
    ['/me/profile', 'Account'],
  ])('marks %s as %s without requiring an exact child-route match', async (url, label) => {
    const fixture = await setup();
    fixture.componentInstance.currentUrl.set(url);
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector(
      '[data-mobile-bottom-navigation] a[aria-current="page"]',
    );

    expect(active?.textContent.trim()).toBe(label);
  });

  it('does not classify Stay Well and secondary clinical pages as Care', async () => {
    const fixture = await setup();

    for (const url of ['/me/health-journey', '/me/health-passport', '/me/self-checks/SC-1']) {
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
    expect(content.className).toContain('pb-[calc(5rem+env(safe-area-inset-bottom))]');
    expect(content.classList.contains('lg:pb-0')).toBe(true);
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
      { label: 'Home', links: [['Dashboard', '/me/dashboard']] },
      {
        label: 'Stay Well',
        links: [
          ['Smart Health Passport', '/me/health-passport'],
          ['Guided Self-Checks', '/me/self-checks'],
          ['My Health Checks', '/me/health-checks'],
          ['Book Health Check', '/me/book'],
        ],
      },
      {
        label: 'Care',
        links: [
          ['My Care', '/me/care'],
          ['Health Records', '/me/health-records'],
          ['Prescriptions', '/me/prescriptions'],
          ['FastTrack', '/me/fasttrack'],
        ],
      },
      { label: 'Hospitals', links: [['My Providers', '/me/providers']] },
      {
        label: 'Impact',
        links: [
          ['My Impact', '/me/impact'],
          ['Referrals & Rewards', '/me/referrals'],
        ],
      },
      { label: 'Account', links: [['Profile', '/me/profile']] },
    ]);
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
});
