import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ProviderInvitationsApiService } from '../../core/services/provider-invitations-api.service';
import { ProviderSetupPageComponent } from './provider-setup-page.component';

describe('ProviderSetupPageComponent', () => {
  it('inspects a valid invitation and renders only safe context', async () => {
    const { fixture, api } = await setup();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(api.inspect).toHaveBeenCalledWith('a'.repeat(43));
    expect(text).toContain('Care Provider');
    expect(text).toContain('p******@example.test');
    expect(text).not.toContain('tokenHash');
    expect(text).not.toContain('passwordHash');
  });

  it.each([404, 410])('shows a generic invalid state for inspection status %s', async (status) => {
    const { component, fixture } = await setup({
      inspectError: new HttpErrorResponse({ status, error: { message: 'raw invitation state' } }),
    });
    fixture.detectChanges();
    expect(component.invalidInvitation()).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('raw invitation state');
  });

  it('validates display name, password length, and matching confirmation', async () => {
    const { component } = await setup();
    component.setupForm.setValue({
      displayName: '',
      password: 'short',
      confirmPassword: 'different',
    });
    component.acceptInvitation();
    expect(component.setupForm.controls.displayName.invalid).toBe(true);
    expect(component.setupForm.controls.password.invalid).toBe(true);
    expect(component.setupForm.hasError('passwordMismatch')).toBe(true);
  });

  it('submits only displayName/password once and does not authenticate automatically', async () => {
    const pending = new Subject<any>();
    const { component, api } = await setup({ accept: () => pending });
    component.setupForm.setValue({
      displayName: 'Ada Provider',
      password: 'very-secure-password',
      confirmPassword: 'very-secure-password',
    });
    component.acceptInvitation();
    component.acceptInvitation();
    expect(api.accept).toHaveBeenCalledTimes(1);
    expect(api.accept).toHaveBeenCalledWith('a'.repeat(43), {
      displayName: 'Ada Provider',
      password: 'very-secure-password',
    });
    pending.next({
      providerDisplayName: 'Care Provider',
      email: 'provider@example.test',
      status: 'ACCEPTED',
      loginRequired: true,
    });
    pending.complete();
    expect(component.accepted()?.loginRequired).toBe(true);
    expect(component.setupForm.controls.password.value).toBe('');
  });

  it('shows existing-user conflict guidance without credential recovery', async () => {
    const { component } = await setup({
      acceptError: new HttpErrorResponse({ status: 409, error: { message: 'raw user id' } }),
    });
    component.setupForm.setValue({
      displayName: 'Ada',
      password: 'very-secure-password',
      confirmPassword: 'very-secure-password',
    });
    component.acceptInvitation();
    expect(component.error()).toContain('existing SmartClinic account');
    expect(component.error()).not.toContain('raw user id');
  });

  async function setup(
    options: {
      inspectError?: HttpErrorResponse;
      acceptError?: HttpErrorResponse;
      accept?: () => any;
    } = {},
  ) {
    const api = {
      inspect: vi.fn(() =>
        options.inspectError
          ? throwError(() => options.inspectError)
          : of({
              providerDisplayName: 'Care Provider',
              invitedEmail: 'p******@example.test',
              expiresAt: '2026-09-01T00:00:00Z',
            }),
      ),
      accept: vi.fn(
        options.accept ??
          (() =>
            options.acceptError
              ? throwError(() => options.acceptError)
              : of({
                  providerDisplayName: 'Care Provider',
                  email: 'provider@example.test',
                  status: 'ACCEPTED',
                  loginRequired: true,
                })),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderSetupPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ token: 'a'.repeat(43) }) } },
        },
        { provide: ProviderInvitationsApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderSetupPageComponent);
    return { fixture, component: fixture.componentInstance, api };
  }
});
