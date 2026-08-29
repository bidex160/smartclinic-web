import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
