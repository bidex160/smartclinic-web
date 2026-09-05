import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { ConnectProviderPageComponent } from './connect-provider-page.component';
describe('ConnectProviderPageComponent', () => {
  it('offers only supported paths and requires consent before sending the exact existing-link DTO', async () => {
    const provider = {
      providerReference: 'SCPR-PUBLIC',
      displayName: 'Prime',
      providerType: 'CLINIC',
      location: { city: 'Ikeja', stateOrRegion: 'Lagos', countryCode: 'NG' },
      newPatientRegistration: { enabled: false, feeMinor: null, currency: null },
      existingPatientLink: { enabled: true, feeMinor: 0, currency: 'NGN' },
    };
    const startExisting = vi.fn(() => of({ reference: 'SC-PPC-1' }));
    const api = {
      directory: vi.fn(() => of({ items: [provider], page: 1, totalPages: 2 })),
      listMine: vi.fn(() => of({ items: [], page: 1, totalPages: 0 })),
      startExisting,
      startNew: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ConnectProviderPageComponent],
      providers: [
          provideRouter([
            { path: 'me/providers/:reference', component: ConnectProviderPageComponent },
          ]),
        { provide: PatientProviderConnectionsApiService, useValue: api },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(ConnectProviderPageComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).not.toContain('I am a new patient');
    expect(f.nativeElement.textContent).toContain('Free');
    f.componentInstance.choose(provider);
    f.componentInstance.form.patchValue({
      path: 'EXISTING_PATIENT_LINK',
      externalPatientReference: 'YAB-1',
    });
    f.componentInstance.submit();
    expect(startExisting).not.toHaveBeenCalled();
    f.componentInstance.form.controls.consentAcknowledged.setValue(true);
    f.componentInstance.submit();
    expect(startExisting).toHaveBeenCalledWith({
      providerReference: 'SCPR-PUBLIC',
      consentAcknowledged: true,
      externalPatientReference: 'YAB-1',
    });
    f.componentInstance.load(2);
    expect(api.directory).toHaveBeenLastCalledWith('', 2, 10);
  });

  it('resolves an exact targeted provider without rendering alternative providers', async () => {
    const targetReference = 'SCPR-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const labTwo = { providerReference: targetReference, displayName: 'Lab Two', providerType: 'LABORATORY', location: { city: 'Oyo', stateOrRegion: 'Oyo', countryCode: 'NG' }, newPatientRegistration: { enabled: true, feeMinor: 560000, currency: 'NGN' }, existingPatientLink: { enabled: true, feeMinor: 400000, currency: 'NGN' } };
    const uch = { ...labTwo, providerReference: 'SCPR-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', displayName: 'UCH' };
    const api = { listMine: vi.fn(() => of({ items: [], page: 1, totalPages: 0 })), directory: vi.fn(() => of({ items: [uch, labTwo], page: 1, totalPages: 1 })), startNew: vi.fn(), startExisting: vi.fn() };
    await TestBed.configureTestingModule({ imports: [ConnectProviderPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ providerReference: targetReference, returnUrl: '/me/health-records/access-requests' }) } } }, { provide: PatientProviderConnectionsApiService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(ConnectProviderPageComponent); fixture.detectChanges();
    expect(api.listMine).toHaveBeenCalledWith(1, 100);
    expect(api.directory).toHaveBeenCalledWith('', 1, 100);
    expect(fixture.componentInstance.selected()?.providerReference).toBe(targetReference);
    expect(fixture.nativeElement.textContent).toContain('Connect with Lab Two');
    expect(fixture.nativeElement.textContent).toContain('₦5,600');
    expect(fixture.nativeElement.textContent).not.toContain('Search Providers');
    expect(fixture.nativeElement.textContent).not.toContain('UCH');
  });

  it('does not fall back to the generic directory UI for an invalid targeted reference', async () => {
    const api = { directory: vi.fn(), listMine: vi.fn(), startNew: vi.fn(), startExisting: vi.fn() };
    await TestBed.configureTestingModule({ imports: [ConnectProviderPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ providerReference: 'invalid', returnUrl: 'https://evil.test' }) } } }, { provide: PatientProviderConnectionsApiService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(ConnectProviderPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This Provider is unavailable');
    expect(fixture.nativeElement.textContent).not.toContain('Search Providers');
    expect(api.directory).not.toHaveBeenCalled(); expect(api.listMine).not.toHaveBeenCalled();
    expect(fixture.componentInstance.backUrl()).toBe('/me/providers');
  });
});
