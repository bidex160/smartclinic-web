import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { ProviderPatientConnectionsConfigurationPageComponent } from './provider-patient-connections-configuration-page.component';
describe('ProviderPatientConnectionsConfigurationPageComponent', () => {
  it('retains explicit zero as Free and does not convert blank to zero', async () => {
    const updateConfiguration = vi.fn(() => of({}));
    await TestBed.configureTestingModule({
      imports: [ProviderPatientConnectionsConfigurationPageComponent],
      providers: [
        {
          provide: PatientProviderConnectionsApiService,
          useValue: {
            getConfiguration: () =>
              of({
                newPatientRegistration: { enabled: true, feeMinor: 0, currency: 'NGN' },
                existingPatientLink: { enabled: false, feeMinor: null, currency: null },
              }),
            updateConfiguration,
          },
        },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(ProviderPatientConnectionsConfigurationPageComponent);
    f.detectChanges();
    expect(f.componentInstance.form.controls.newFee.value).toBe('0.00');
    f.componentInstance.save();
    expect(updateConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({ newPatientRegistrationFeeMinor: 0 }),
    );
    f.componentInstance.form.controls.newFee.setValue('');
    f.componentInstance.save();
    expect(updateConfiguration).toHaveBeenCalledTimes(1);
    expect(f.componentInstance.error()).toContain('Blank is not Free');
  });
});
