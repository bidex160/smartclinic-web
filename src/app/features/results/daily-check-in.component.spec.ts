import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { PatientDashboardApiService } from '../../core/services/patient-dashboard-api.service';
import { DailyCheckInComponent } from './daily-check-in.component';

describe('DailyCheckInComponent', () => {
  async function setup(fail = false) {
    const progress = { localDate: '2026-10-01', completedReferences: [], streakDays: 1, bestStreak: 1, todayCheckIn: { mood: 4, energy: null, sleep: null }, week: [] };
    const api = { saveTodayCheckIn: vi.fn(() => (fail ? throwError(() => new Error('down')) : of(progress))) };
    await TestBed.configureTestingModule({
      imports: [DailyCheckInComponent],
      providers: [{ provide: PatientDashboardApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(DailyCheckInComponent);
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fixture.detectChanges();
    return { fixture, api, saved, progress };
  }

  const moodButton = (element: HTMLElement, label: string) =>
    element.querySelector(`[role="radiogroup"][aria-label="Mood"] [aria-label="${label}"]`) as HTMLButtonElement;

  it('saves a mood with one tap and then offers optional energy and sleep', async () => {
    const { fixture, api, saved, progress } = await setup();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('How are you feeling today?');
    expect(element.textContent).not.toContain('Energy');

    moodButton(element, 'Good').click();
    fixture.detectChanges();

    expect(api.saveTodayCheckIn).toHaveBeenCalledWith(expect.objectContaining({ mood: 4, energy: null, sleep: null }));
    expect(saved).toHaveBeenCalledWith(progress);
    expect(moodButton(element, 'Good').getAttribute('aria-checked')).toBe('true');
    expect(element.textContent).toContain('Energy');

    (element.querySelector('[aria-label="Last night’s sleep Okay"]') as HTMLButtonElement).click();
    expect(api.saveTodayCheckIn).toHaveBeenLastCalledWith(expect.objectContaining({ mood: 4, sleep: 3 }));
  });

  it('restores the previous answer and explains when saving fails', async () => {
    const { fixture } = await setup(true);
    const element: HTMLElement = fixture.nativeElement;
    moodButton(element, 'Great').click();
    fixture.detectChanges();
    expect(moodButton(element, 'Great').getAttribute('aria-checked')).toBe('false');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('could not save');
  });

  it('shows an existing check-in and never claims to diagnose', async () => {
    const { fixture } = await setup();
    fixture.componentRef.setInput('checkIn', { mood: 2, energy: 3, sleep: null });
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(moodButton(element, 'Low').getAttribute('aria-checked')).toBe('true');
    expect(element.textContent).toContain('not a diagnosis');
  });
});
