import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { API_CONFIG } from '../../core/config/api-config.token';
import { AuthStateService } from '../../core/services/auth-state.service';
import { WellnessPointsAdminPageComponent } from './wellness-points-admin-page.component';

const summary = (paused = false) => ({
  settings: { paused, maxPercent: 20, minPoints: 100, valuePerPoint: { NGN: '5.00', GHS: '0.04', RWF: '4.00' } },
  redemptions: [{ status: 'SETTLED', currency: 'NGN', count: 3, points: 1200, amount: '6000.00' }],
  adjustments: { count: 1, pointsAdded: 100, pointsRemoved: 0 },
});
const patient = { patientReference: 'SCP-DH73-T4JW', name: 'Ada Obi', wallet: { earnedPoints: 300, adjustedPoints: 0, usedPoints: 100, availablePoints: 200 }, adjustments: [], redemptions: [] };

function setup(roles: string[]) {
  TestBed.configureTestingModule({
    imports: [WellnessPointsAdminPageComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      { provide: AuthStateService, useValue: { currentUser: signal({ roles }) } },
    ],
  });
  const fixture = TestBed.createComponent(WellnessPointsAdminPageComponent);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  http.expectOne('/api/v1/admin/wellness-points/summary').flush(summary());
  http.expectOne((r) => r.url === '/api/v1/admin/wellness-points/redemptions').flush({ items: [], page: 1, totalPages: 0, total: 0 });
  fixture.detectChanges();
  return { fixture, http, el: fixture.nativeElement as HTMLElement };
}

describe('Wellness points admin page', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows whether points are on, what they are worth, and how they are used', () => {
    const { el } = setup(['ADMIN']);
    expect(el.querySelector('[data-wellness-state]')!.textContent).toContain('On');
    expect(el.textContent).toContain('100 points = ₦500');
    expect(el.textContent).toContain('NGN 6000.00');
  });

  it('lets an admin pause points', () => {
    const { fixture, http, el } = setup(['ADMIN']);
    (el.querySelector('[data-wellness-pause]') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/admin/wellness-points/settings');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ paused: true });
    req.flush(summary(true).settings);
    http.expectOne('/api/v1/admin/wellness-points/summary').flush(summary(true));
    fixture.detectChanges();
    expect(el.querySelector('[data-wellness-state]')!.textContent).toContain('Paused');
  });

  it('finds a patient and saves an adjustment with a reason', () => {
    const { fixture, http, el } = setup(['ADMIN']);
    const c = fixture.componentInstance;
    c.findForm.setValue({ reference: ' scp-dh73-t4jw ' });
    c.findPatient();
    http.expectOne('/api/v1/admin/wellness-points/patients/SCP-DH73-T4JW').flush(patient);
    fixture.detectChanges();
    expect(el.querySelector('[data-available]')!.textContent).toContain('200');
    c.adjustForm.setValue({ points: 50, reason: 'Goodwill after a missed visit' });
    c.adjust();
    const req = http.expectOne('/api/v1/admin/wellness-points/patients/SCP-DH73-T4JW/adjustments');
    expect(req.request.body).toEqual({ points: 50, reason: 'Goodwill after a missed visit' });
    req.flush({ ...patient, wallet: { ...patient.wallet, adjustedPoints: 50, availablePoints: 250 } });
    http.expectOne('/api/v1/admin/wellness-points/summary').flush(summary());
    fixture.detectChanges();
    expect(el.querySelector('[data-available]')!.textContent).toContain('250');
  });

  it('lets operations staff look but not change anything', () => {
    const { fixture, http, el } = setup(['OPERATIONS']);
    expect(el.querySelector('[data-wellness-pause]')).toBeNull();
    expect(el.textContent).toContain('Only admins can change these settings.');
    fixture.componentInstance.findForm.setValue({ reference: 'SCP-DH73-T4JW' });
    fixture.componentInstance.findPatient();
    http.expectOne('/api/v1/admin/wellness-points/patients/SCP-DH73-T4JW').flush(patient);
    fixture.detectChanges();
    expect(el.querySelector('[data-wellness-adjust]')).toBeNull();
  });
});
