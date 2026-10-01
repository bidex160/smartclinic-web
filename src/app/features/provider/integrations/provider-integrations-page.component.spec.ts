import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { ProviderIntegrationsApiService } from '../../../core/services/provider-integrations-api.service';
import { ProviderMembershipService } from '../../../core/services/provider-membership.service';
import { ProviderIntegrationsPageComponent } from './provider-integrations-page.component';

const key = (overrides: Record<string, unknown> = {}) => ({
  id: 'k1', name: 'Hospital EMR', keyPrefix: 'sck_1a2b3c4d', createdAt: '2026-10-01T09:00:00Z', lastUsedAt: null, revokedAt: null, ...overrides,
});

describe('ProviderIntegrationsPageComponent', () => {
  async function setup(api: Record<string, unknown> = {}, canManage = true, overview: Record<string, unknown> = {}) {
    const mock = {
      base: 'https://api.test/api/v1',
      overview: vi.fn(() => of({ apiKeys: [key()], webhook: null, webhooksAvailable: true, deliveries: [], ...overview })),
      createKey: vi.fn(() => of({ ...key({ id: 'k2', name: 'Lab system', keyPrefix: 'sck_99999999' }), key: 'sck_99999999_SECRETVALUE' })),
      revokeKey: vi.fn(() => of(key({ revokedAt: '2026-10-02T09:00:00Z' }))),
      saveWebhook: vi.fn(() => of({ url: 'https://emr.lagoon.ng/hooks', isActive: true, signingSecret: 'whsec_SHOWN_ONCE' })),
      removeWebhook: vi.fn(() => of({ removed: true })),
      testWebhook: vi.fn(() => of({ items: [{ id: 'd1', eventType: 'ping', status: 'DELIVERED', attemptCount: 1, lastStatusCode: 200, createdAt: '2026-10-01T10:00:00Z', deliveredAt: '2026-10-01T10:00:01Z' }] })),
      ...api,
    };
    const membership = { canManageTeam: () => canManage, membership: () => ({ provider: { displayName: 'Lagoon Hospital' } }) };
    await TestBed.configureTestingModule({
      imports: [ProviderIntegrationsPageComponent],
      providers: [provideRouter([]), { provide: ProviderIntegrationsApiService, useValue: mock }, { provide: ProviderMembershipService, useValue: membership }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderIntegrationsPageComponent);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, api: mock, el: fixture.nativeElement as HTMLElement };
  }

  it('creates a key and shows it once', async () => {
    const { fixture, page, api, el } = await setup();
    page.keyForm.setValue({ name: ' Lab system ' });
    page.createKey();
    fixture.detectChanges();
    expect(api.createKey).toHaveBeenCalledWith('Lab system');
    expect(el.querySelector('[data-new-key]')?.textContent).toContain('sck_99999999_SECRETVALUE');
    expect(el.querySelectorAll('[data-key]').length).toBe(2);
    page.newKey.set(null);
    fixture.detectChanges();
    expect(el.textContent).not.toContain('SECRETVALUE');
  });

  it('revokes a key after confirming', async () => {
    const { fixture, page, api, el } = await setup();
    page.confirmingRevoke.set('k1');
    fixture.detectChanges();
    page.revoke(key());
    fixture.detectChanges();
    expect(api.revokeKey).toHaveBeenCalledWith('k1');
    expect(el.querySelectorAll('[data-key]').length).toBe(0);
    expect(el.querySelector('[data-key-revoked]')?.textContent).toContain('Revoked');
  });

  it('saves a webhook, shows the secret once, and sends a test', async () => {
    const { fixture, page, api, el } = await setup();
    page.hookForm.setValue({ url: 'https://emr.lagoon.ng/hooks' });
    page.saveWebhook(false);
    fixture.detectChanges();
    expect(api.saveWebhook).toHaveBeenCalledWith('https://emr.lagoon.ng/hooks', false);
    expect(el.querySelector('[data-new-secret]')?.textContent).toContain('whsec_SHOWN_ONCE');
    page.test();
    fixture.detectChanges();
    expect(el.querySelector('[data-delivery-status]')?.textContent?.trim()).toBe('Delivered');
  });

  it('refuses a plain http webhook address', async () => {
    const { page, api } = await setup();
    page.hookForm.setValue({ url: 'http://emr.lagoon.ng/hooks' });
    page.saveWebhook(false);
    expect(api.saveWebhook).not.toHaveBeenCalled();
  });

  it('explains when updates are not switched on yet', async () => {
    const { el } = await setup({}, true, { webhooksAvailable: false });
    expect(el.querySelector('[data-webhooks-off]')).not.toBeNull();
    expect(el.querySelector('[data-webhook-url]')).toBeNull();
  });

  it('shows the server message when a key cannot be created', async () => {
    const { fixture, page, el } = await setup({ createKey: vi.fn(() => throwError(() => ({ error: { message: 'Revoke an old key first (at most 10 active keys)' } }))) });
    page.keyForm.setValue({ name: 'Another' });
    page.createKey();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Revoke an old key first');
  });

  it('is only for the owner or a team admin', async () => {
    const { api, el } = await setup({}, false);
    expect(api.overview).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Only the facility owner or a team admin');
  });

  it('includes a working example with the API address', async () => {
    const { el } = await setup();
    expect(el.querySelector('[data-curl]')?.textContent).toContain('https://api.test/api/v1/integrations/requests');
  });
});
