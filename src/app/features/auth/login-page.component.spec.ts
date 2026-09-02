import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  async function setup(
    fail = false,
    options: {
      returnUrl?: string | null;
      roles?: ('USER' | 'ADMIN' | 'OPERATIONS' | 'PROVIDER')[];
    } = {},
  ) {
    const response: any = {
      accessToken: 'token',
      user: {
        id: 'u',
        email: 'patient@example.com',
        displayName: 'Patient',
        roles: options.roles ?? ['USER'],
        status: 'ACTIVE',
      },
    };
    const api = { login: vi.fn(() => (fail ? throwError(() => ({ status: 401 })) : of(response))) };
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => options.returnUrl ?? null } },
          },
        },
        { provide: AuthApiService, useValue: api },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      api,
      router,
      auth: TestBed.inject(AuthStateService),
    };
  }
  it('renders one identifier field with purposeful copy and username autocomplete', async () => {
    const { fixture } = await setup();
    const input = fixture.nativeElement.querySelector('#identifier');
    expect(fixture.nativeElement.textContent).toContain('Email or phone number');
    expect(fixture.nativeElement.textContent).toContain('linked to your SmartClinic account');
    expect(input.type).toBe('text');
    expect(input.placeholder).toBe('you@example.com or +234 801 234 5678');
    expect(input.autocomplete).toBe('username');
    expect(fixture.nativeElement.querySelector('#password').autocomplete).toBe('current-password');
  });
  it.each([
    'patient@example.com',
    '08012345678',
    '2348012345678',
    '+2348012345678',
    '+234 801 234 5678',
  ])(
    'submits supported identifier form %s without frontend phone normalization',
    async (identifier) => {
      const { component, api } = await setup();
      component.form.setValue({ identifier, password: 'existing-password' });
      component.submit();
      expect(api.login).toHaveBeenCalledWith({ identifier, password: 'existing-password' });
    },
  );
  it('requires identifier and password without email-only validation', async () => {
    const { component, api } = await setup();
    component.form.setValue({ identifier: '', password: '' });
    component.submit();
    expect(api.login).not.toHaveBeenCalled();
    component.form.controls.identifier.setValue('08012345678');
    expect(component.form.controls.identifier.valid).toBe(true);
    expect(component.form.controls.password.hasError('required')).toBe(true);
  });
  it('preserves session and patient redirect behavior', async () => {
    const { component, router, auth } = await setup();
    component.form.setValue({ identifier: 'patient@example.com', password: 'existing-password' });
    component.submit();
    expect(auth.accessToken()).toBe('token');
    expect(router.navigate).toHaveBeenCalledWith(['/me/dashboard']);
  });
  it('honors a safe internal returnUrl and preserves its package query parameter', async () => {
    const destination = '/health-check/packages?package=ESSENTIAL';
    const { component, router } = await setup(false, { returnUrl: destination });
    component.form.setValue({ identifier: 'patient@example.com', password: 'existing-password' });
    component.submit();
    expect(router.navigateByUrl).toHaveBeenCalledWith(destination);
    expect(router.navigate).not.toHaveBeenCalledWith(['/me/dashboard']);
  });
  it('rejects an external returnUrl and uses the normal patient dashboard', async () => {
    const { component, router } = await setup(false, { returnUrl: '//example.com/phishing' });
    component.form.setValue({ identifier: 'patient@example.com', password: 'existing-password' });
    component.submit();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/me/dashboard']);
  });
  it('does not let a non-Patient role use a patient returnUrl', async () => {
    const { component, router } = await setup(false, {
      returnUrl: '/me/health-journey',
      roles: ['PROVIDER'],
    });
    component.form.setValue({ identifier: 'provider@example.com', password: 'existing-password' });
    component.submit();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/provider/dashboard']);
  });
  it('shows identifier-neutral generic authentication failure', async () => {
    const { component, fixture } = await setup(true);
    component.form.setValue({ identifier: '+2348012345678', password: 'wrong' });
    component.submit();
    fixture.detectChanges();
    expect(component.errorMessage).toBe(
      'We could not sign you in. Check your login details and try again.',
    );
    expect(component.errorMessage).not.toContain('not found');
  });
});
