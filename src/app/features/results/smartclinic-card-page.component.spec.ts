import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { HealthBasicsApiService } from '../../core/services/health-basics-api.service';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { SmartClinicCardPageComponent } from './smartclinic-card-page.component';

describe('SmartClinicCardPageComponent', () => {
  const profile = {
    user: { displayName: 'Adaeze Okafor', email: null },
    patient: { patientReference: 'SCP-VFBJ-YD9J', givenName: 'Adaeze', familyName: 'Okafor', phone: null, dateOfBirth: '1992-04-12' },
  };
  const basics = {
    bloodGroup: 'O+', genotype: 'AS', allergies: 'Penicillin', conditions: null,
    emergencyContactName: 'Ngozi', emergencyContactPhone: '+2348000000000', emergencyContactRelationship: 'Sister',
    source: 'SELF_REPORTED', updatedAt: '2026-10-01T10:00:00Z',
  };

  async function setup(basicsResponse: unknown) {
    await TestBed.configureTestingModule({
      imports: [SmartClinicCardPageComponent],
      providers: [
        provideRouter([]),
        { provide: HealthCheckResultsApiService, useValue: { getMyProfile: () => of(profile) } },
        { provide: HealthBasicsApiService, useValue: { get: vi.fn(() => basicsResponse) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SmartClinicCardPageComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the holder, a QR of the ID only, and their health basics', async () => {
    const element = await setup(of(basics));
    const card = element.querySelector('[data-smartclinic-card]')!;
    expect(card.textContent).toContain('Adaeze Okafor');
    expect(card.textContent).toContain('Born 12 April 1992');
    expect(element.querySelector('[data-card-id]')!.textContent).toBe('SCP-VFBJ-YD9J');
    expect(card.querySelector('app-qr-code svg')!.getAttribute('aria-label')).toBe('SmartClinic ID SCP-VFBJ-YD9J');
    const details = element.querySelector('[data-card-basics]')!.textContent!.replace(/\s+/g, ' ');
    expect(details).toContain('O+');
    expect(details).toContain('AS');
    expect(details).toContain('Penicillin');
    expect(details).toContain('Ngozi (Sister)');
    expect(card.querySelector('a[href="tel:+2348000000000"]')).not.toBeNull();
    expect(card.textContent).toContain('not clinically verified');
  });

  it('prompts to add basics when none are recorded', async () => {
    const element = await setup(of({ ...basics, bloodGroup: null, genotype: null, allergies: null, emergencyContactPhone: null }));
    expect(element.textContent).toContain('Add your blood group, genotype and allergies');
  });

  it('still shows the ID card when health basics fail to load', async () => {
    const element = await setup(throwError(() => new Error('down')));
    expect(element.querySelector('[data-card-id]')!.textContent).toBe('SCP-VFBJ-YD9J');
    expect(element.textContent).toContain('only your ID is shown');
  });
});
