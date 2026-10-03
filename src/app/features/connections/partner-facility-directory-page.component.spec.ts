import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PartnerFacilityDirectoryApiService } from '../../core/services/partner-facility-directory-api.service';
import { PartnerFacilityDirectoryPageComponent } from './partner-facility-directory-page.component';

describe('PartnerFacilityDirectoryPageComponent', () => {
  const item = {
    id: 'listing-1', sourceReference: 'HFR-1', displayName: 'Central Hospital', facilityType: 'HOSPITAL' as const,
    location: { city: 'Ikeja', stateOrRegion: 'Lagos', countryCode: 'NG' }, readiness: 'AVAILABLE_TO_JOIN' as const,
    providerReference: null, source: 'NHFR', sourceVerifiedAt: null, availableForConnection: false,
  };
  const api = {
    directory: vi.fn(() => of({ items: [item], page: 1, limit: 18, total: 1, totalPages: 1 })),
    requestContact: vi.fn(() => of({ accepted: true, alreadyRequested: false })),
    createRequest: vi.fn(() => of({ accepted: true, reference: 'SC-PFR-12345678', status: 'NEW', createdAt: new Date().toISOString() })),
  };

  beforeEach(async () => {
    api.directory.mockClear(); api.requestContact.mockClear(); api.createRequest.mockClear();
    await TestBed.configureTestingModule({
      imports: [PartnerFacilityDirectoryPageComponent],
      providers: [provideRouter([]), { provide: PartnerFacilityDirectoryApiService, useValue: api }],
    }).compileComponents();
  });

  it('shows non-joined facilities as contact requests and requires consent before submission', () => {
    const fixture = TestBed.createComponent(PartnerFacilityDirectoryPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Central Hospital');
    expect(fixture.nativeElement.textContent).toContain('Not on SmartClinic yet');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[data-ask-join]');
    expect(button.disabled).toBe(true);
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('article input[type="checkbox"]');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    button.click();
    expect(api.requestContact).toHaveBeenCalledWith('listing-1');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-asked]').textContent).toContain('You’ve asked them to join');
  });

  it('shows Verified, distance, call, directions and Google reviews, and the WhatsApp invite', () => {
    api.directory.mockReturnValueOnce(of({ items: [{ ...item, verified: true, levelOfCare: 'Secondary', distanceKm: 0.4, contact: { phone: '+2348031234567', whatsapp: null },
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Central%20Hospital', directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=6.6,3.35', alreadyAsked: true }], page: 1, limit: 18, total: 1, totalPages: 1 }));
    const fixture = TestBed.createComponent(PartnerFacilityDirectoryPageComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-verified]')).toBeTruthy();
    expect(el.textContent).toContain('Hospital or clinic · Secondary');
    expect(el.textContent).toContain('400 m away');
    expect(el.querySelector<HTMLAnchorElement>('[data-call]')!.getAttribute('href')).toBe('tel:+2348031234567');
    expect(el.querySelector<HTMLAnchorElement>('[data-directions]')!.href).toContain('maps/dir');
    expect(el.querySelector<HTMLAnchorElement>('[data-reviews]')!.href).toContain('maps/search');
    expect(el.querySelector('[data-asked]')).toBeTruthy();
    expect(el.querySelector('[data-ask-join]')).toBeNull();
    const invite = decodeURIComponent(el.querySelector<HTMLAnchorElement>('[data-invite-whatsapp]')!.href);
    expect(invite).toContain('https://wa.me/?text=Hello Central Hospital');
    expect(invite).toContain('/claim?q=Central%20Hospital');
  });

  it('sorts by distance with the location rounded, and filters to verified', () => {
    const geo = { getCurrentPosition: vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 6.524412, longitude: 3.379206 } } as GeolocationPosition)) };
    Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
    const fixture = TestBed.createComponent(PartnerFacilityDirectoryPageComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-near-me]') as HTMLButtonElement).click();
    expect(api.directory).toHaveBeenLastCalledWith(expect.objectContaining({ near: { lat: 6.524412, lng: 3.379206 } }));
    const box = fixture.nativeElement.querySelector('[data-verified-only]') as HTMLInputElement;
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    expect(api.directory).toHaveBeenLastCalledWith(expect.objectContaining({ verifiedOnly: true }));
  });

  it('submits a consented manual appointment request for an unjoined hospital', () => {
    const fixture = TestBed.createComponent(PartnerFacilityDirectoryPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.setConsent('listing-1', true);
    fixture.componentInstance.requestAppointment(item, '2099-10-01T09:00');
    expect(api.createRequest).toHaveBeenCalledWith('listing-1', 'APPOINTMENT', new Date('2099-10-01T09:00').toISOString());
    expect(fixture.componentInstance.messageFor('listing-1')).toContain('will contact the hospital');
  });
});
