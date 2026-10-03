import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_CONFIG } from '../../core/config/api-config.token';
import { FacilityClaimPageComponent } from '../claim/facility-claim-page.component';
import { FacilityOutreachPageComponent } from './facility-outreach-page.component';

const item = (over: Record<string, unknown> = {}) => ({
  id: 'l1', displayName: 'Garki Hospital', facilityType: 'HOSPITAL', countryCode: 'NG', state: 'Federal Capital Territory', city: 'Garki', source: 'IMPORT',
  stage: 'LISTED', demand: 12, phone: '+2348031234567', whatsapp: '+2348039990000', email: null, website: null, address: null, contactName: 'Dr Bello',
  invitesSent: 0, lastContactAt: null, hasClaimLink: false, providerReference: null, providerId: null, nextAction: 'Send the invite', ...over,
});
const dash = (items = [item()]) => ({
  summary: { LISTED: 1, CONTACTED: 0, CLAIMED: 0, VERIFIED: 0, LIVE: 0, DECLINED: 0, WRONG_CONTACT: 0 }, total: items.length,
  places: [{ countryCode: 'NG', state: 'Federal Capital Territory', city: 'Garki', demand: 12, total: 1, stages: { LISTED: 1 } }], items,
});

const registry = (over: Record<string, unknown> = {}) => ({
  configured: true, enabled: true, running: false,
  totals: { listed: 42600, active: 42567, registryVerified: 39000, reachable: 21000, withLocation: 40000, onGoogle: 0, claimed: 12 },
  byType: [], googlePlaces: { configured: false },
  recent: [{ id: 's1', status: 'SUCCEEDED', startedAt: '2026-10-03T01:05:00Z', finishedAt: '2026-10-03T01:25:00Z', counts: { created: 120, updated: 300, closed: 2, removed: 1, pages: 430 }, error: null, triggeredBy: 'SCHEDULE' }],
  ...over,
});

function setup<T>(c: Type<T>, params: Record<string, string> = {}) {
  TestBed.configureTestingModule({
    imports: [c],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params), queryParamMap: convertToParamMap({}) } } }],
  });
  const f = TestBed.createComponent(c);
  f.detectChanges();
  return { f, http: TestBed.inject(HttpTestingController), el: f.nativeElement as HTMLElement };
}

describe('Facility outreach page', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows the funnel and the most-requested facilities with the next step', () => {
    const { f, http, el } = setup(FacilityOutreachPageComponent);
    http.expectOne('/api/v1/admin/facility-registry').flush(registry());
    http.expectOne((r) => r.url === '/api/v1/admin/facility-outreach').flush(dash());
    f.detectChanges();
    expect(el.querySelector('[data-stage="LISTED"]')!.textContent).toContain('1');
    const card = el.querySelector('[data-facility="l1"]')!;
    expect(card.textContent).toContain('12 patients asking');
    expect(card.textContent).toContain('→ Send the invite');
  });

  it('sends the invite and, while WhatsApp isn’t automatic, offers the WhatsApp link and records it once sent', () => {
    const { f, http, el } = setup(FacilityOutreachPageComponent);
    http.expectOne('/api/v1/admin/facility-registry').flush(registry());
    http.expectOne((r) => r.url === '/api/v1/admin/facility-outreach').flush(dash());
    f.detectChanges();
    (el.querySelector('[data-invite]') as HTMLButtonElement).click();
    http.expectOne('/api/v1/admin/facility-outreach/l1/invite').flush({ sent: [], claimUrl: 'https://s/claim/t', message: 'Hello', whatsappUrl: 'https://wa.me/2348039990000?text=Hello', smsUrl: 'sms:+2348031234567?body=Hello', automaticWhatsApp: false });
    f.detectChanges();
    expect((el.querySelector('[data-wa-link]') as HTMLAnchorElement).href).toContain('wa.me/2348039990000');
    (el.querySelector('[data-wa-sent]') as HTMLButtonElement).click();
    const sent = http.expectOne('/api/v1/admin/facility-outreach/l1/manual-sent');
    expect(sent.request.body).toEqual({ channel: 'WHATSAPP' });
    sent.flush({});
    http.expectOne((r) => r.url === '/api/v1/admin/facility-outreach').flush(dash([item({ stage: 'CONTACTED', invitesSent: 1, nextAction: 'Invited today: reminders are scheduled' })]));
    f.detectChanges();
    expect(el.querySelector('[data-stage-chip]')!.textContent).toContain('Contacted');
  });

  it('logs a call with its outcome', () => {
    const { f, http, el } = setup(FacilityOutreachPageComponent);
    http.expectOne('/api/v1/admin/facility-registry').flush(registry());
    http.expectOne((r) => r.url === '/api/v1/admin/facility-outreach').flush(dash());
    f.detectChanges();
    (el.querySelector('[data-log]') as HTMLButtonElement).click();
    f.detectChanges();
    const form = el.querySelector('[data-log-form]') as HTMLFormElement;
    (form.querySelector('[name="outcome"]') as HTMLSelectElement).value = 'CALL_BACK';
    (form.querySelector('[name="note"]') as HTMLInputElement).value = 'Medical director back Monday';
    (el.querySelector('[data-save-log]') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/admin/facility-outreach/l1/contact-log');
    expect(req.request.body).toEqual({ kind: 'CALL', outcome: 'CALL_BACK', note: 'Medical director back Monday' });
    req.flush({});
    http.expectOne((r) => r.url === '/api/v1/admin/facility-outreach').flush(dash());
  });
});

describe('Registry panel', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows what the nightly sync did and can start one', async () => {
    const { f, http, el } = setup(FacilityOutreachPageComponent);
    http.expectOne('/api/v1/admin/facility-registry').flush(registry());
    http.expectOne((r) => r.url === '/api/v1/admin/facility-outreach').flush(dash());
    f.detectChanges();
    expect(el.querySelector('[data-registry-active]')!.textContent).toContain('42,567');
    expect(el.querySelector('[data-registry-last]')!.textContent).toContain('120 added, 300 updated, 3 closed');
    (el.querySelector('[data-sync-now]') as HTMLButtonElement).click();
    http.expectOne('/api/v1/admin/facility-registry/sync').flush({ started: true });
    await new Promise((r) => setTimeout(r, 1100));
    http.expectOne('/api/v1/admin/facility-registry').flush(registry({ running: false }));
  });

  it('explains how to set it up when there is no key', () => {
    const { f, http, el } = setup(FacilityOutreachPageComponent);
    http.expectOne('/api/v1/admin/facility-registry').flush(registry({ configured: false, recent: [] }));
    http.expectOne((r) => r.url === '/api/v1/admin/facility-outreach').flush(dash());
    f.detectChanges();
    expect(el.querySelector('[data-registry-setup]')!.textContent).toContain('HFR_API_KEY');
    expect(el.querySelector('[data-sync-now]')).toBeNull();
  });
});

describe('Facility claim page', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows patient demand and sends them to sign-up with the claim token and type', () => {
    const { f, http, el } = setup(FacilityClaimPageComponent, { token: 'tok_abcdefghijklmnopqrstuv' });
    http.expectOne('/api/v1/public/facility-claims/tok_abcdefghijklmnopqrstuv').flush({ displayName: 'Garki Hospital', facilityType: 'HOSPITAL', providerType: 'HOSPITAL', countryCode: 'NG', stateOrRegion: 'Federal Capital Territory', city: 'Garki', interestedPatients: 12, claimed: false });
    f.detectChanges();
    expect(el.querySelector('[data-demand]')!.textContent).toContain('12 patients have asked');
    const href = (el.querySelector('[data-claim-start]') as HTMLAnchorElement).getAttribute('href')!;
    expect(decodeURIComponent(href)).toBe('/provider/register?claim=tok_abcdefghijklmnopqrstuv&type=HOSPITAL');
  });

  it('asks a registry-licensed facility for a code first, then goes to sign-up', async () => {
    const { f, http, el } = setup(FacilityClaimPageComponent, { token: 'tok_abcdefghijklmnopqrstuv' });
    http.expectOne('/api/v1/public/facility-claims/tok_abcdefghijklmnopqrstuv').flush({ displayName: 'Garki Hospital', facilityType: 'HOSPITAL', providerType: 'HOSPITAL', countryCode: 'NG', stateOrRegion: 'Federal Capital Territory', city: 'Garki', interestedPatients: 0, claimed: false, listingId: 'l1', registryListed: true, registryVerified: true, ownershipVerified: false });
    f.detectChanges();
    expect(el.querySelector('[data-registry-licence]')).toBeTruthy();
    expect(el.querySelector('[data-claim-start]')).toBeNull();
    http.expectOne('/api/v1/public/facility-claim-codes/l1').flush({ id: 'l1', displayName: 'Garki Hospital', claimed: false, registryVerified: true, channels: [{ channel: 'SMS', masked: '+234 803 ••• ••67' }] });
    f.detectChanges();
    (el.querySelector('[data-send="SMS"]') as HTMLButtonElement).click();
    http.expectOne('/api/v1/public/facility-claim-codes/l1/send').flush({ sentTo: '+234 803 ••• ••67', channel: 'SMS', expiresInSeconds: 600 });
    f.detectChanges();
    expect(el.querySelector('[data-sent]')!.textContent).toContain('+234 803 ••• ••67');
    const input = el.querySelector('[data-code-input]') as HTMLInputElement;
    input.value = '123 456';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    (el.querySelector('[data-verify]') as HTMLButtonElement).click();
    const v = http.expectOne('/api/v1/public/facility-claim-codes/l1/verify');
    expect(v.request.body).toEqual({ code: '123456' });
    v.flush({ claimToken: 'tok_abcdefghijklmnopqrstuv', registryVerified: true });
    expect(nav).toHaveBeenCalledWith(['/provider/register'], { queryParams: { claim: 'tok_abcdefghijklmnopqrstuv' } });
  });

  it('shows the code error from the server', () => {
    const { f, http, el } = setup(FacilityClaimPageComponent, { token: 'tok_abcdefghijklmnopqrstuv' });
    http.expectOne('/api/v1/public/facility-claims/tok_abcdefghijklmnopqrstuv').flush({ displayName: 'Garki Hospital', facilityType: 'HOSPITAL', providerType: 'HOSPITAL', countryCode: 'NG', stateOrRegion: null, city: null, interestedPatients: 0, claimed: false, listingId: 'l1', registryVerified: true, ownershipVerified: false });
    f.detectChanges();
    http.expectOne('/api/v1/public/facility-claim-codes/l1').flush({ id: 'l1', displayName: 'Garki Hospital', claimed: false, registryVerified: true, channels: [{ channel: 'EMAIL', masked: 'i•••@garki.ng' }] });
    f.detectChanges();
    (el.querySelector('[data-send="EMAIL"]') as HTMLButtonElement).click();
    http.expectOne('/api/v1/public/facility-claim-codes/l1/send').flush({ message: 'Too many codes today. Try again tomorrow, or contact SmartClinic.' }, { status: 429, statusText: 'Too Many Requests' });
    f.detectChanges();
    expect(el.querySelector('[data-code-error]')!.textContent).toContain('Too many codes today');
  });

  it('explains an old or claimed link', () => {
    const { f, http, el } = setup(FacilityClaimPageComponent, { token: 'old' });
    http.expectOne('/api/v1/public/facility-claims/old').flush({ message: 'nope' }, { status: 404, statusText: 'Not Found' });
    f.detectChanges();
    expect(el.querySelector('[data-missing]')).toBeTruthy();
  });
});
