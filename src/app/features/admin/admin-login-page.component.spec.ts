import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginResponse, UserRole } from '../../core/models/auth.model';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AdminLoginPageComponent } from './admin-login-page.component';

describe('AdminLoginPageComponent', () => {
  it('stores an ADMIN login and navigates to pricing', async () => {
    const response = loginResponse(['ADMIN']);
    const { component, authState, router } = await setup(() => of(response));
    component.form.setValue({ email: 'admin@example.test', password: 'secret' });

    component.login();

    expect(authState.accessToken()).toBe('access-token');
    expect(authState.currentUser()).toEqual(response.user);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/package-prices']);
  });

  it('shows a safe error for invalid login', async () => {
    const { component, authState, router } = await setup(() =>
      throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'raw detail' } })),
    );
    component.form.setValue({ email: 'admin@example.test', password: 'wrong' });

    component.login();

    expect(authState.error()).toBe('We could not sign you in with those details.');
    expect(authState.error()).not.toContain('raw detail');
    expect(router.navigate).not.toHaveBeenCalledWith(['/admin/package-prices']);
  });

  it('denies a USER-only login without navigating to pricing', async () => {
    const { component, router } = await setup(() => of(loginResponse(['USER'])));
    component.form.setValue({ email: 'user@example.test', password: 'secret' });

    component.login();

    expect(component.accessDenied()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalledWith(['/admin/package-prices']);
  });

  async function setup(login: () => ReturnType<AuthApiService['login']>) {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    await TestBed.configureTestingModule({
      imports: [AdminLoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: router },
        { provide: AuthApiService, useValue: { login: vi.fn(login) } },
      ],
    }).compileComponents();
    return {
      component: TestBed.createComponent(AdminLoginPageComponent).componentInstance,
      authState: TestBed.inject(AuthStateService),
      router,
    };
  }
});

function loginResponse(roles: UserRole[]): LoginResponse {
  return {
    accessToken: 'access-token',
    user: {
      id: 'user-id',
      email: 'admin@example.test',
      displayName: 'Admin User',
      roles,
      status: 'ACTIVE',
    },
  };
}
