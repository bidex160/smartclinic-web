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
  };

  beforeEach(async () => {
    api.directory.mockClear(); api.requestContact.mockClear();
    await TestBed.configureTestingModule({
      imports: [PartnerFacilityDirectoryPageComponent],
      providers: [provideRouter([]), { provide: PartnerFacilityDirectoryApiService, useValue: api }],
    }).compileComponents();
  });

  it('shows non-joined facilities as contact requests and requires consent before submission', () => {
    const fixture = TestBed.createComponent(PartnerFacilityDirectoryPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Central Hospital');
    expect(fixture.nativeElement.textContent).toContain('Available to join');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('article button');
    expect(button.disabled).toBe(true);
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('article input[type="checkbox"]');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    button.click();
    expect(api.requestContact).toHaveBeenCalledWith('listing-1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Request received');
  });
});
