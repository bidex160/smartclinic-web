import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { ProviderSessionHeaderComponent } from './provider-session-header.component';

describe('ProviderSessionHeaderComponent', () => {
  it('uses the shared logout flow', async () => {
    const authSession = { logout: vi.fn(() => of(true)) };
    await TestBed.configureTestingModule({
      imports: [ProviderSessionHeaderComponent],
      providers: [provideRouter([]), { provide: AuthSessionService, useValue: authSession }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderSessionHeaderComponent);
    const state = TestBed.inject(AuthStateService);
    state.setSession({
      accessToken: 'token',
      user: {
        id: 'id',
        email: 'provider@example.test',
        displayName: 'Provider',
        roles: ['PROVIDER'],
        status: 'ACTIVE',
      },
    });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(authSession.logout).toHaveBeenCalledOnce();
  });

  it('shows setup navigation but hides operational work for a pending provider', async () => {
    const authSession = { logout: vi.fn(() => of(true)) };
    await TestBed.configureTestingModule({
      imports: [ProviderSessionHeaderComponent],
      providers: [provideRouter([]), { provide: AuthSessionService, useValue: authSession }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderSessionHeaderComponent);
    fixture.componentRef.setInput('operational', false);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Provider setup');
    expect(text).not.toContain('My Offers');
    expect(text).not.toContain('Appointments / Health Checks');
  });
});
