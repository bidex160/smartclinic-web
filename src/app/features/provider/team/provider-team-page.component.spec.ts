import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { ProviderMembershipService } from '../../../core/services/provider-membership.service';
import { ProviderTeamApiService } from '../../../core/services/provider-team-api.service';
import { ProviderTeamPageComponent } from './provider-team-page.component';

const member = (overrides: Record<string, unknown> = {}) => ({
  id: 'm1', displayName: 'Ngozi Eze', email: 'ngozi@lagoon.ng', role: 'LAB_SCIENTIST', roleLabel: 'Lab scientist', status: 'ACTIVE', joinedAt: '2026-10-01', inviteExpiresAt: null, createdAt: '2026-10-01', ...overrides,
});

describe('ProviderTeamPageComponent', () => {
  async function setup(api: Record<string, unknown> = {}, canManage = true) {
    const mock = {
      list: vi.fn(() => of({ items: [member()] })),
      invite: vi.fn(() => of({ member: member({ id: 'm2', email: 'tunde@lagoon.ng', role: 'PHARMACIST', roleLabel: 'Pharmacist', status: 'INVITED' }), inviteUrl: 'https://app/provider/join/TOKEN', deliveryStatus: 'SENT' })),
      updateRole: vi.fn((id: string, role: string) => of(member({ role, roleLabel: 'Doctor' }))),
      remove: vi.fn(() => of({ removed: true })),
      resend: vi.fn(),
      ...api,
    };
    const membership = { canManageTeam: () => canManage, membership: () => ({ provider: { displayName: 'Lagoon Hospital' } }) };
    await TestBed.configureTestingModule({
      imports: [ProviderTeamPageComponent],
      providers: [provideRouter([]), { provide: ProviderTeamApiService, useValue: mock }, { provide: ProviderMembershipService, useValue: membership }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderTeamPageComponent);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, api: mock, el: fixture.nativeElement as HTMLElement };
  }

  it('invites a pharmacist and offers the link to share', async () => {
    const { fixture, page, api, el } = await setup();
    page.form.setValue({ email: 'tunde@lagoon.ng', displayName: ' Tunde ', role: 'PHARMACIST' });
    page.invite();
    fixture.detectChanges();
    expect(api.invite).toHaveBeenCalledWith({ email: 'tunde@lagoon.ng', displayName: 'Tunde', role: 'PHARMACIST' });
    expect(el.querySelector('[data-invite-sent]')?.textContent).toContain('Invitation emailed to tunde@lagoon.ng');
    expect(decodeURIComponent(page.whatsApp(page.lastInvite()!))).toContain('join Lagoon Hospital on SmartClinic as pharmacist');
    expect(el.querySelectorAll('[data-member]')).toHaveLength(2);
    const selects = [...el.querySelectorAll('[data-role-select]')] as HTMLSelectElement[];
    expect(selects.map((s) => s.value)).toEqual(['LAB_SCIENTIST', 'PHARMACIST']);
  });

  it('shows why an invitation was refused', async () => {
    const { page } = await setup({ invite: vi.fn(() => throwError(() => ({ error: { message: 'This person is already on your team' } }))) });
    page.form.setValue({ email: 'ngozi@lagoon.ng', displayName: '', role: 'DOCTOR' });
    page.invite();
    expect(page.inviteError()).toBe('This person is already on your team');
  });

  it('changes a role and removes access after confirming', async () => {
    const { page, api } = await setup();
    page.changeRole(page.members()[0], 'DOCTOR');
    expect(api.updateRole).toHaveBeenCalledWith('m1', 'DOCTOR');
    expect(page.members()[0].role).toBe('DOCTOR');
    page.remove(page.members()[0]);
    expect(api.remove).toHaveBeenCalledWith('m1');
    expect(page.members()).toHaveLength(0);
  });

  it('explains that only owners and admins manage the team', async () => {
    const { el, api } = await setup({}, false);
    expect(el.textContent).toContain('Only the facility owner or a team admin');
    expect(api.list).toHaveBeenCalled();
  });
});
