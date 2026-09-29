import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { MyProvidersPageComponent } from './my-providers-page.component';

describe('MyProvidersPageComponent', () => {
  it('makes a connected hospital status and useful actions immediately clear', async () => {
    await TestBed.configureTestingModule({
      imports: [MyProvidersPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientProviderConnectionsApiService, useValue: { listMine: () => of({ items: [{ reference: 'SC-PPC-1', status: 'CONNECTED', externalPatientReference: 'SMHB-001', provider: { displayName: 'Smartclinic Healthstation Belham', providerType: 'HOSPITAL' } }] }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MyProvidersPageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Smartclinic Healthstation Belham');
    expect(text).toContain('Connected');
    expect(text).toContain('SMHB-001');
    expect(fixture.nativeElement.querySelector('a[href="/me/providers/SC-PPC-1"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/me/pay-bills"]')).not.toBeNull();
  });
});
