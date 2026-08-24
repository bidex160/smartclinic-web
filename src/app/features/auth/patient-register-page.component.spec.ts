import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
