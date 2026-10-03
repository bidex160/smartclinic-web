import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_CONFIG } from '../../core/config/api-config.token';
import { FindFacilityPageComponent } from './find-facility-page.component';

const hit = (over: Record<string, unknown> = {}) => ({
  id: 'l1', displayName: 'St Jude Hospital', facilityType: 'HOSPITAL', city: 'Ikeja', stateOrRegion: 'Lagos', address: '12 Allen Ave',
  claimed: false, registryListed: true, registryVerified: true, channels: [{ channel: 'SMS', masked: '+234 803 ••• ••67' }, { channel: 'EMAIL', masked: 'i•••@stjude.ng' }], ...over,
});

function setup(q = '') {
  TestBed.configureTestingModule({
    imports: [FindFacilityPageComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap(q ? { q } : {}) } } }],
  });
  const f = TestBed.createComponent(FindFacilityPageComponent);
  f.detectChanges();
  return { f, http: TestBed.inject(HttpTestingController), el: f.nativeElement as HTMLElement };
}

describe('Find your facility (/claim)', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('searches from the shared link and opens the only match with its masked contacts', () => {
    const { f, http, el } = setup('St Jude');
    const req = http.expectOne((r) => r.url === '/api/v1/public/facility-claim-codes/search');
    expect(req.request.params.get('q')).toBe('St Jude');
    req.flush({ items: [hit()] });
    f.detectChanges();
    expect(el.querySelector('[data-result="l1"]')!.textContent).toContain('In the national Health Facility Registry');
    // Contacts came with the search: no second request.
    expect(el.querySelector('[data-send="SMS"]')!.textContent).toContain('+234 803 ••• ••67');
    expect(el.querySelector('[data-send="EMAIL"]')!.textContent).toContain('i•••@stjude.ng');
  });

  it('lets them pick from several and continue to sign-up after the code', () => {
    const { f, http, el } = setup();
    const input = el.querySelector('[data-facility-search]') as HTMLInputElement;
    input.value = 'Jude';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    (el.querySelector('[data-search-go]') as HTMLButtonElement).click();
    http.expectOne((r) => r.url === '/api/v1/public/facility-claim-codes/search').flush({ items: [hit(), hit({ id: 'l2', displayName: 'St Jude Clinic', claimed: true, channels: [] })] });
    f.detectChanges();
    expect(el.querySelector('[data-result="l2"]')!.textContent).toContain('Already claimed');
    expect(el.querySelector('[data-claim="l2"]')).toBeNull();
    (el.querySelector('[data-claim="l1"]') as HTMLButtonElement).click();
    f.detectChanges();
    (el.querySelector('[data-send="SMS"]') as HTMLButtonElement).click();
    http.expectOne('/api/v1/public/facility-claim-codes/l1/send').flush({ sentTo: '+234 803 ••• ••67', channel: 'SMS', expiresInSeconds: 600 });
    f.detectChanges();
    const code = el.querySelector('[data-code-input]') as HTMLInputElement;
    code.value = '654321';
    code.dispatchEvent(new Event('input'));
    f.detectChanges();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    (el.querySelector('[data-verify]') as HTMLButtonElement).click();
    http.expectOne('/api/v1/public/facility-claim-codes/l1/verify').flush({ claimToken: 'tok_abcdefghijklmnopqrstuvwx', registryVerified: true });
    expect(nav).toHaveBeenCalledWith(['/provider/register'], { queryParams: { claim: 'tok_abcdefghijklmnopqrstuvwx' } });
  });

  it('offers to join directly when nothing matches', () => {
    const { f, http, el } = setup('Nowhere Clinic');
    http.expectOne((r) => r.url === '/api/v1/public/facility-claim-codes/search').flush({ items: [] });
    f.detectChanges();
    expect(el.querySelector('[data-no-results]')!.textContent).toContain('Nowhere Clinic');
  });
});
