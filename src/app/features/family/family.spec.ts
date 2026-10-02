import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';

import { API_CONFIG } from '../../core/config/api-config.token';
import { NotificationNavigationService } from '../../core/services/notification-navigation.service';
import { FamilyKidsPanelComponent } from './family-kids-panel.component';
import { KidsCornerPageComponent } from './kids-corner-page.component';
import { ReminderSettingsCardComponent } from './reminder-settings-card.component';

const kid = (over: Record<string, unknown> = {}) => ({
  patientReference: 'SCP-KID1-AAAA', firstName: 'Tobi', age: 4, kidsCorner: true,
  nextVisit: { key: 'year5', dueDate: '2027-05-01', daysAway: 210 },
  tasks: [{ id: 't1', key: 'washHands', doneToday: false }, { id: 't2', key: 'drinkWater', doneToday: true }],
  stars: { today: 1, total: 14, level: 2, nextAt: 30 },
  quiz: { questionId: 'q02', answered: null },
  ...over,
});

function setup<T>(component: Type<T>) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ ref: 'SCP-KID1-AAAA' }) } } },
    ],
  });
  const fixture = TestBed.createComponent(component);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  return { fixture, http, el: fixture.nativeElement as HTMLElement };
}

describe('Kids corner', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('greets the child, shows stars, big picture tasks and Kito’s question', () => {
    const { fixture, http, el } = setup(KidsCornerPageComponent);
    http.expectOne((r) => r.url === '/api/v1/me/family/kids/SCP-KID1-AAAA').flush(kid());
    fixture.detectChanges();
    expect(el.querySelector('[data-kid-hello]')!.textContent).toContain('Hi Tobi!');
    expect(el.querySelector('[data-stars-today]')!.textContent).toContain('1');
    expect(el.querySelector('[data-task="washHands"]')!.textContent).toContain('Wash hands with soap');
    expect(el.querySelector('[data-task="drinkWater"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('[data-kid-quiz]')!.textContent).toContain('Which drink is best when you are thirsty?');
    expect(el.querySelector('[data-next-visit]')!.textContent).toContain('5 years');
  });

  it('ticking a task earns a star; answering shows right or wrong', () => {
    const { fixture, http, el } = setup(KidsCornerPageComponent);
    http.expectOne((r) => r.url.endsWith('/kids/SCP-KID1-AAAA')).flush(kid());
    fixture.detectChanges();
    (el.querySelector('[data-task="washHands"]') as HTMLButtonElement).click();
    const tick = http.expectOne('/api/v1/me/family/kids/SCP-KID1-AAAA/tasks/t1/done');
    expect(tick.request.method).toBe('POST');
    tick.flush(kid({ tasks: [{ id: 't1', key: 'washHands', doneToday: true }, { id: 't2', key: 'drinkWater', doneToday: true }], stars: { today: 2, total: 15, level: 2, nextAt: 30 } }));
    fixture.detectChanges();
    expect(el.textContent).toContain('All done today!');

    (el.querySelector('[data-kid-option="0"]') as HTMLButtonElement).click();
    const ans = http.expectOne('/api/v1/me/family/kids/SCP-KID1-AAAA/quiz/answers');
    expect(ans.request.body).toMatchObject({ questionId: 'q02', choiceIndex: 0 });
    ans.flush(kid({ quiz: { questionId: 'q02', answered: { choiceIndex: 0, correct: true, correctIndex: 0 } } }));
    fixture.detectChanges();
    expect(el.textContent).toContain('Yes! Well done');
  });

  it('lets a grown-up add a task from the list', () => {
    const { fixture, http, el } = setup(KidsCornerPageComponent);
    http.expectOne((r) => r.url.endsWith('/kids/SCP-KID1-AAAA')).flush(kid());
    fixture.detectChanges();
    (el.querySelector('[data-add-task="eatFruit"]') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/me/family/kids/SCP-KID1-AAAA/tasks');
    expect(req.request.body).toMatchObject({ taskKey: 'eatFruit' });
    req.flush(kid());
  });
});

describe('Family panel and reminder', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows the family streak and each child’s progress', () => {
    const { fixture, http, el } = setup(FamilyKidsPanelComponent);
    http.expectOne((r) => r.url === '/api/v1/me/family').flush({ today: '2026-10-03', familyStreak: { current: 6, best: 9, activeToday: true }, children: [kid(), { ...kid(), patientReference: 'SCP-GRAN-0001', firstName: 'Mama', age: 70, kidsCorner: false }] });
    fixture.detectChanges();
    expect(el.querySelector('[data-family-streak]')!.textContent).toContain('6-day streak');
    expect(el.querySelectorAll('[data-kid]')).toHaveLength(1);
    expect(el.querySelector('[data-kid]')!.textContent).toContain('1 of 2 done today');
  });

  it('saves the reminder with the person’s time and language', () => {
    const { fixture, http, el } = setup(ReminderSettingsCardComponent);
    http.expectOne('/api/v1/me/nudges').flush({ enabled: true, localTime: '08:00', timezone: 'Africa/Lagos', language: 'en', whatsapp: false, whatsappAvailable: false });
    fixture.detectChanges();
    fixture.componentInstance.time.set('19:30');
    (el.querySelector('[data-reminder-save]') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/me/nudges');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toMatchObject({ enabled: true, localTime: '19:30', language: 'en', whatsapp: false });
    req.flush({ enabled: true, localTime: '19:30', timezone: 'Africa/Lagos', language: 'en', whatsapp: false, whatsappAvailable: false });
    fixture.detectChanges();
    expect(el.textContent).toContain('WhatsApp reminders are coming soon.');
    expect(el.textContent).toContain('Saved');
  });

});

describe('Nudge links', () => {
  it('opens the screen a nudge points to, and nowhere unsafe', () => {
    const nav = new NotificationNavigationService();
    const n = (route: unknown) => ({ entityType: 'WELLNESS', entityReference: 'kids', metadata: { route } }) as any;
    expect(nav.destination(n('/me/family/kids/SCP-KID1-AAAA'), 'USER')).toEqual(['/me/family/kids/SCP-KID1-AAAA']);
    expect(nav.destination(n('https://evil.example'), 'USER')).toEqual(['/me/progress']);
  });
});
