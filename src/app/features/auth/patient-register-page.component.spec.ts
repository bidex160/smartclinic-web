import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { PatientRegisterPageComponent } from './patient-register-page.component';

describe('PatientRegisterPageComponent', () => {
  it('submits only patient registration identity and does not authenticate locally', async () => {
    const register = vi.fn(() =>
      of({
        id: 'user',
        email: 'ada@example.test',
        displayName: 'Ada Okafor',
        roles: ['USER'],
        status: 'ACTIVE',
      }),
    );
    await TestBed.configureTestingModule({
      imports: [PatientRegisterPageComponent],
      providers: [provideRouter([]), { provide: AuthApiService, useValue: { register } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientRegisterPageComponent);
    fixture.componentInstance.form.setValue({
      givenName: ' Ada ',
      familyName: ' Okafor ',
      email: 'ADA@EXAMPLE.TEST',
      phone: '+2348000000000',
      password: 'secure-password',
    });
    fixture.componentInstance.register();
    fixture.detectChanges();
    expect(register).toHaveBeenCalledWith({
      givenName: 'Ada',
      familyName: 'Okafor',
      email: 'ada@example.test',
      phone: '+2348000000000',
      password: 'secure-password',
    });
    expect(TestBed.inject(AuthStateService).authenticated()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Account created');
    expect(fixture.nativeElement.querySelector('select[name="role"]')).toBeNull();
  });
  it('captures an explicit referral query value without browser persistence', async () => {
    const register = vi.fn(() => of({}));
    await TestBed.configureTestingModule({
      imports: [PatientRegisterPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ ref: 'SC-ABC123' }) } },
        },
        { provide: AuthApiService, useValue: { register } },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(PatientRegisterPageComponent).componentInstance;
    component.form.setValue({
      givenName: 'Ada',
      familyName: 'Okafor',
      email: 'ada@example.test',
      phone: '',
      password: 'secure-password',
    });
    component.register();
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ referralCode: 'SC-ABC123' }));
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
  it('preserves only a safe returnUrl on sign-in after registration', async () => {
    const register = vi.fn(() => of({}));
    await TestBed.configureTestingModule({
      imports: [PatientRegisterPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                returnUrl: '/health-check/packages?package=COMPLETE',
              }),
            },
          },
        },
        { provide: AuthApiService, useValue: { register } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientRegisterPageComponent);
    fixture.detectChanges();
    const links = [...fixture.nativeElement.querySelectorAll('a[href^="/login"]')];
    expect(links[0].getAttribute('href')).toBe(
      '/login?returnUrl=%2Fhealth-check%2Fpackages%3Fpackage%3DCOMPLETE',
    );
  });
});
