import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';

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
    http.expectOne((r) => r.url === '/api/v1/admin/facility-outreach').flush(dash());
    f.detectChanges();
    expect(el.querySelector('[data-stage="LISTED"]')!.textContent).toContain('1');
    const card = el.querySelector('[data-facility="l1"]')!;
    expect(card.textContent).toContain('12 patients asking');
    expect(card.textContent).toContain('→ Send the invite');
  });

  it('sends the invite and, while WhatsApp isn’t automatic, offers the WhatsApp link and records it once sent', () => {
    const { f, http, el } = setup(FacilityOutreachPageComponent);
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

  it('explains an old or claimed link', () => {
    const { f, http, el } = setup(FacilityClaimPageComponent, { token: 'old' });
    http.expectOne('/api/v1/public/facility-claims/old').flush({ message: 'nope' }, { status: 404, statusText: 'Not Found' });
    f.detectChanges();
    expect(el.querySelector('[data-missing]')).toBeTruthy();
  });
});
