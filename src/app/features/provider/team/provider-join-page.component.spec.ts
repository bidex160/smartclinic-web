import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthSessionService } from '../../../core/services/auth-session.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ProviderMembershipService } from '../../../core/services/provider-membership.service';
import { ProviderTeamApiService } from '../../../core/services/provider-team-api.service';
import { ProviderJoinPageComponent } from './provider-join-page.component';

const preview = { providerDisplayName: 'Lagoon Hospital', providerType: 'HOSPITAL', role: 'LAB_SCIENTIST', roleLabel: 'Lab scientist', invitedEmail: 'n****@lagoon.ng', expiresAt: '2026-10-08' };

describe('ProviderJoinPageComponent', () => {
  async function setup(options: { signedIn: boolean; api?: Record<string, unknown> }) {
    const api = { inspectInvitation: vi.fn(() => of(preview)), acceptInvitation: vi.fn(() => of({ role: 'LAB_SCIENTIST' })), ...options.api };
    const session = { refreshSession: vi.fn(() => of({})) };
    const membership = { set: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ProviderJoinPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'TOKEN123' } } } },
        { provide: ProviderTeamApiService, useValue: api },
        { provide: AuthSessionService, useValue: session },
        { provide: ProviderMembershipService, useValue: membership },
        { provide: AuthStateService, useValue: { authenticated: signal(options.signedIn), currentUser: signal({ email: 'ngozi@lagoon.ng' }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderJoinPageComponent);
    fixture.detectChanges();
    return { fixture, api, session, membership, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the facility and role, and sends signed-out people to sign in and back', async () => {
    const { el } = await setup({ signedIn: false });
    expect(el.textContent).toContain('Join Lagoon Hospital');
    expect(el.textContent).toContain('Lab scientist');
    expect(el.querySelector('[data-sign-in]')?.getAttribute('href')).toContain('returnUrl=%2Fprovider%2Fjoin%2FTOKEN123');
  });

  it('joins, refreshes the session and opens the provider dashboard', async () => {
    const { fixture, api, session, membership, el } = await setup({ signedIn: true });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    (el.querySelector('[data-accept]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(api.acceptInvitation).toHaveBeenCalledWith('TOKEN123');
    expect(membership.set).toHaveBeenCalledWith({ role: 'LAB_SCIENTIST' });
    expect(session.refreshSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/provider/dashboard');
  });

  it('explains a wrong-email account and an expired link', async () => {
    const wrong = await setup({ signedIn: true, api: { acceptInvitation: vi.fn(() => throwError(() => ({ status: 403 }))) } });
    wrong.fixture.componentInstance.accept();
    expect(wrong.fixture.componentInstance.acceptError()).toContain('different email');
    TestBed.resetTestingModule();
    const expired = await setup({ signedIn: false, api: { inspectInvitation: vi.fn(() => throwError(() => ({ status: 410 }))) } });
    expect(expired.el.textContent).toContain('This invitation has expired');
  });
});
