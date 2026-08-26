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

  it('shows guest sign-in, provider acquisition, and booking navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Sign in');
    expect(text).toContain('For Providers');
    expect(text).toContain('Book My Smart Health Check');
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
    const link = [...fixture.nativeElement.querySelectorAll('a')].find((item: HTMLAnchorElement) =>
      item.textContent?.includes('My Health'),
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/me/dashboard');
    expect(fixture.nativeElement.textContent).toContain('Admin Portal');
    expect(fixture.nativeElement.textContent).not.toContain('Provider Portal');
  });
});
