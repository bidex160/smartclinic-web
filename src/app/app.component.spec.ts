import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStateService } from './core/services/auth-state.service';
import { AuthSessionService } from './core/services/auth-session.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: { logout: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('renders the SmartClinic shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SmartClinic');
    expect(fixture.nativeElement.querySelector('main')).not.toBeNull();
  });

  it('shows the compact guest header with My SmartClinic and menu navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    const portal = [...header.querySelectorAll('a')].find((item) =>
      item.textContent?.includes('My SmartClinic'),
    );
    expect(portal?.getAttribute('href')).toBe('/login');
    expect(header.textContent).toContain('Menu');
    expect(header.textContent).not.toContain('Book My Smart Health Check');
  });

  it('shows only entitled portal destinations for a multi-role account', () => {
    const state = TestBed.inject(AuthStateService);
    state.setSession({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'multi@example.test',
        displayName: 'Multi role',
        roles: ['ADMIN', 'PROVIDER', 'USER'],
        status: 'ACTIVE',
      },
    });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const link = [...fixture.nativeElement.querySelectorAll('header a')].find(
      (item: HTMLAnchorElement) => item.textContent?.includes('My SmartClinic'),
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/me/dashboard');
    const menu = [...fixture.nativeElement.querySelectorAll('header button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'Menu',
    ) as HTMLButtonElement;
    menu.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Admin Portal');
  });
});
