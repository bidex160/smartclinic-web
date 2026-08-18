import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStateService } from './core/services/auth-state.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the SmartClinic shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SmartClinic');
    expect(fixture.nativeElement.querySelector('main')).not.toBeNull();
  });

  it('shows the patient-scoped history entry for any authenticated multi-role account', () => {
    const state = TestBed.inject(AuthStateService);
    state.setSession({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'multi@example.test',
        displayName: 'Multi role',
        roles: ['ADMIN', 'PROVIDER'],
        status: 'ACTIVE',
      },
    });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const link = [...fixture.nativeElement.querySelectorAll('a')].find((item: HTMLAnchorElement) =>
      item.textContent?.includes('My Health Checks'),
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/me/health-checks');
  });
});
