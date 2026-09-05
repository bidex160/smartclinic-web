import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStateService } from '../../core/services/auth-state.service';
import { PaymentContactEmailComponent } from './payment-contact-email.component';

describe('PaymentContactEmailComponent', () => {
  it('omits paymentEmail when the account already has an email', async () => {
    const user = { id: 'user', email: 'account@example.com', displayName: 'Ada', roles: ['USER'], status: 'ACTIVE' };
    const { component, fixture } = await setup(user);
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(component.request()).toBeUndefined();
  });

  it('requires, validates, and normalizes payment email for a null-email account', async () => {
    const user = { id: 'user', email: null, displayName: 'Ada', roles: ['USER'], status: 'ACTIVE' };
    const { component, fixture } = await setup(user);
    expect(fixture.nativeElement.querySelector('input[type="email"]')).not.toBeNull();
    expect(component.request()).toBeNull();
    component.control.setValue('not-an-email');
    expect(component.request()).toBeNull();
    component.control.setValue('  ADA@Example.COM  ');
    expect(component.request()).toEqual({ paymentEmail: 'ada@example.com' });
    expect(user.email).toBeNull();
  });

  async function setup(user: Record<string, unknown>) {
    await TestBed.configureTestingModule({
      imports: [PaymentContactEmailComponent],
      providers: [{ provide: AuthStateService, useValue: { currentUser: signal(user) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PaymentContactEmailComponent);
    fixture.detectChanges();
    return { component: fixture.componentInstance, fixture };
  }
});
