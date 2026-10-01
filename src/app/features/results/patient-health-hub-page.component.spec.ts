import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { PatientHealthHubPageComponent } from './patient-health-hub-page.component';

describe('PatientHealthHubPageComponent', () => {
  async function setup(items: { localDate: string; mood: number; energy: null; sleep: null }[] | 'error') {
    const api = { getCheckIns: vi.fn(() => (items === 'error' ? throwError(() => new Error('down')) : of({ items }))) };
    await TestBed.configureTestingModule({
      imports: [PatientHealthHubPageComponent],
      providers: [provideRouter([]), { provide: PatientDashboardApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientHealthHubPageComponent);
    fixture.detectChanges();
    return { fixture, api };
  }

  it('shows the last 7 days with each check-in mood, ending today', async () => {
    const { fixture, api } = await setup([]);
    const component = fixture.componentInstance;
    const now = new Date();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).format(now);
    api.getCheckIns.mockReturnValue(of({ items: [{ localDate: today, mood: 5, energy: null, sleep: null }] }));
    component.load(now);
    fixture.detectChanges();

    const days = [...fixture.nativeElement.querySelectorAll('[data-mood-week] li > span:first-child')] as HTMLElement[];
    expect(days).toHaveLength(7);
    expect(days[6].getAttribute('aria-label')).toMatch(/: Great$/);
    expect(days.slice(0, 6).every((day) => day.getAttribute('aria-label')?.endsWith('no check-in'))).toBe(true);
  });

  it('links to every part of staying well', async () => {
    const { fixture } = await setup([]);
    const hrefs = [...fixture.nativeElement.querySelectorAll('nav[aria-label="Health sections"] a')].map((a: HTMLAnchorElement) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/me/health-passport', '/me/health-records', '/me/self-checks', '/me/health-checks', '/me/dashboard', '/me/family']);
    expect(fixture.nativeElement.textContent).toContain('No check-ins yet');
  });

  it('keeps the page usable when check-ins fail to load', async () => {
    const { fixture } = await setup('error');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('unavailable');
    expect(fixture.nativeElement.querySelectorAll('nav[aria-label="Health sections"] a')).toHaveLength(6);
  });
});
