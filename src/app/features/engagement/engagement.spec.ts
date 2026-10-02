import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';

import { API_CONFIG } from '../../core/config/api-config.token';
import { EngagementOverview } from '../../core/models/engagement.model';
import { DailyQuizCardComponent } from './daily-quiz-card.component';
import { ProgressPageComponent } from './progress-page.component';

const overview = (answered: EngagementOverview['quiz']['answered'] = null, points = 40): EngagementOverview => ({
  points,
  level: { number: 1, name: 'Starter', min: 0, nextName: 'Steady', nextAt: 100 },
  streak: { current: 2, best: 4 },
  badges: [
    { code: 'FIRST_CHECK_IN', name: 'First check-in', description: 'Told us how you feel', earned: true },
    { code: 'STREAK_7', name: 'One-week streak', description: 'Active 7 days in a row', earned: false, progress: { current: 4, target: 7 } },
  ],
  passport: {
    percent: 33, done: 3, total: 9,
    items: [
      { key: 'dateOfBirth', label: 'Add your date of birth', done: true, route: '/me/profile' },
      { key: 'genotype', label: 'Record your genotype', done: false, route: '/me/profile' },
    ],
    nextStep: { key: 'genotype', label: 'Record your genotype', done: false, route: '/me/profile' },
  },
  quiz: { localDate: '2026-10-02', questionId: 'q-water', topic: 'Hydration', question: 'How much water?', options: ['A little', 'Enough to keep urine pale'], answered, bankSize: 40 },
  pointsRules: { quizAnswered: 5, quizCorrect: 5, checkInDay: 5, routineDay: 3, selfCheck: 20, healthCheck: 50, passportItem: 10 },
});

function setup<T>(component: Type<T>) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }],
  });
  const fixture = TestBed.createComponent(component);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  return { fixture, http, el: fixture.nativeElement as HTMLElement };
}

describe('Daily quiz card', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('answers once, reveals the explanation and shows the points earned', () => {
    const { fixture, http, el } = setup(DailyQuizCardComponent);
    http.expectOne((r) => r.url === '/api/v1/me/engagement' && !!r.params.get('timezone')).flush(overview());
    fixture.detectChanges();
    expect(el.textContent).toContain('How much water?');

    (el.querySelectorAll('[data-quiz-option]')[1] as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/me/engagement/quiz/answers');
    expect(req.request.body).toMatchObject({ questionId: 'q-water', choiceIndex: 1 });
    const { pointsRules: _rules, ...summary } = overview({ choiceIndex: 1, correct: true, correctIndex: 1, explanation: 'Pale urine means you are drinking enough.', source: 'WHO' }, 50);
    req.flush({ ...summary, pointsEarned: 10 });
    fixture.detectChanges();

    expect(el.textContent).toContain('Correct!');
    expect(el.textContent).toContain('Pale urine means');
    expect(el.querySelector('[data-quiz-points]')!.textContent).toContain('+10 points');
    expect([...el.querySelectorAll<HTMLButtonElement>('[data-quiz-option]')].every((b) => b.disabled)).toBe(true);
  });

  it('stays out of the way if engagement can’t load', () => {
    const { fixture, http, el } = setup(DailyQuizCardComponent);
    http.expectOne((r) => r.url === '/api/v1/me/engagement').flush('down', { status: 503, statusText: 'Down' });
    fixture.detectChanges();
    expect(el.querySelector('[data-daily-quiz]')).toBeNull();
    expect(el.querySelector('[role="status"]')).toBeNull();
  });
});

describe('Progress page', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows level, points, streak, badges with progress and the next passport step', () => {
    const { fixture, http, el } = setup(ProgressPageComponent);
    http.expectOne((r) => r.url === '/api/v1/me/engagement').flush(overview());
    fixture.detectChanges();
    expect(el.querySelector('h1')!.textContent).toContain('Level 1 · Starter');
    expect(el.querySelector('[data-points]')!.textContent).toContain('40');
    expect(el.textContent).toContain('60 to Steady');
    expect(el.querySelector('[data-streak]')!.textContent).toContain('2');
    expect(el.querySelector('[data-badge="FIRST_CHECK_IN"]')!.getAttribute('data-earned')).toBe('true');
    expect(el.querySelector('[data-badge="STREAK_7"]')!.textContent).toContain('4 / 7');
    expect(el.querySelector('[data-passport-next]')!.textContent).toContain('Record your genotype');
    expect(el.textContent).toContain('aren’t money');
  });
});
