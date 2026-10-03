import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_CONFIG } from '../../core/config/api-config.token';
import { clock, letterStates, shareGrid, whatsappLink } from '../../core/services/play-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { NotificationNavigationService } from '../../core/services/notification-navigation.service';
import { ChallengePageComponent } from './challenge-page.component';
import { HealthWordGameComponent } from './health-word-game.component';
import { PlayInvitePageComponent } from './play-invite-page.component';
import { PlayPageComponent } from './play-page.component';

const word = (over: Record<string, unknown> = {}) => ({
  localDate: '2026-10-03', puzzleNumber: 3, length: 5, maxGuesses: 6, category: 'mind', started: true,
  startedAt: new Date(Date.now() - 65_000).toISOString(), rows: [], finished: false, solved: false, seconds: 0,
  answer: null, fact: null, pointsEarned: 0, stats: { played: 2, solved: 2, streak: 2, distribution: [0, 1, 1, 0, 0, 0] },
  inviteCode: 'SC-ABC123', ...over,
});

const detail = (over: Record<string, unknown> = {}) => ({
  code: 'MNWA2E5C', theme: 'WORD', mode: 'DUEL', days: 7, startDate: '2026-10-03', endDate: '2026-10-09', status: 'live', daysLeft: 7,
  participants: 2, maxParticipants: 2, joined: true, joinable: false, isCreator: true, creatorName: 'Ada O.', rules: { maxPerDay: 20, describe: '' },
  board: [
    { name: 'Kofi M.', score: 20, rank: 1, daysActive: 1, doneToday: true, isMe: false },
    { name: 'Ada O.', score: 0, rank: 2, daysActive: 0, doneToday: false, isMe: true },
  ],
  ...over,
});

function setup<T>(component: Type<T>, params: Record<string, string> = {}, query: Record<string, string> = {}, authenticated = true) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params), queryParamMap: convertToParamMap(query) } } },
      { provide: AuthStateService, useValue: { authenticated: () => authenticated, isPatient: () => authenticated } },
    ],
  });
  const fixture = TestBed.createComponent(component);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  return { fixture, http, el: fixture.nativeElement as HTMLElement };
}

describe('Play helpers', () => {
  it('shares a coloured grid that never contains the word', () => {
    const rows = [{ guess: 'EARTH', marks: ['near', 'miss', 'miss', 'miss', 'miss'] as const }, { guess: 'SLEEP', marks: ['hit', 'hit', 'hit', 'hit', 'hit'] as const }];
    const grid = shareGrid(rows);
    expect(grid).toBe('🟨⬜⬜⬜⬜\n🟩🟩🟩🟩🟩');
    expect(grid).not.toMatch(/[A-Z]/);
    expect(letterStates(rows)).toMatchObject({ E: 'hit', S: 'hit', A: 'miss' });
    expect(clock(65)).toBe('1:05');
    expect(whatsappLink('Hi & bye')).toBe('https://wa.me/?text=Hi%20%26%20bye');
  });
});

describe('Health Word game', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('starts the clock, types with the on-screen keys and sends the guess', () => {
    const { fixture, http, el } = setup(HealthWordGameComponent);
    http.expectOne((r) => r.url === '/api/v1/me/play/word').flush(word({ started: false, startedAt: null }));
    fixture.detectChanges();
    expect(el.textContent).toContain('Health Word #3');
    expect(el.textContent).toContain('Hint: it’s about mind and mood');
    (el.querySelector('[data-word-start]') as HTMLButtonElement).click();
    const start = http.expectOne('/api/v1/me/play/word/start');
    expect(start.request.body).toMatchObject({ language: 'en' });
    start.flush(word());
    fixture.detectChanges();
    expect(el.querySelector('[data-word-timer]')!.textContent).toMatch(/1:0\d/);

    for (const k of 'SLEEP') (el.querySelector(`[data-key="${k}"]`) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(Array.from(el.querySelectorAll('[data-word-tile]')).slice(0, 5).map((t) => t.textContent?.trim()).join('')).toBe('SLEEP');
    (el.querySelector('[data-word-enter]') as HTMLButtonElement).click();
    const g = http.expectOne('/api/v1/me/play/word/guesses');
    expect(g.request.body).toMatchObject({ guess: 'SLEEP' });
    g.flush(word({
      rows: [{ guess: 'SLEEP', marks: ['hit', 'hit', 'hit', 'hit', 'hit'] }], finished: true, solved: true, seconds: 72, answer: 'SLEEP',
      fact: 'Most adults need at least 7 hours of sleep a night.', pointsEarned: 10, stats: { played: 3, solved: 3, streak: 3, distribution: [1, 1, 1, 0, 0, 0] },
    }));
    fixture.detectChanges();
    const result = el.querySelector('[data-word-result]')!;
    expect(result.textContent).toContain('Solved: 1/6 in 1:12!');
    expect(result.textContent).toContain('+10');
    expect(result.textContent).toContain('7 hours of sleep');
    const wa = (el.querySelector('[data-share-whatsapp]') as HTMLAnchorElement).href;
    const text = decodeURIComponent(wa.split('text=')[1]);
    expect(text).toContain('SmartClinic Health Word #3 1/6 ⏱ 1:12');
    expect(text).toContain('🟩🟩🟩🟩🟩');
    expect(text).toMatch(/\/play\?ref=SC-ABC123&lang=\w+&market=\w+/);
    expect(text).not.toContain('SLEEP');
    expect(el.querySelector('[data-word-keyboard]')).toBeNull();
  });

  it('accepts the physical keyboard and refuses short guesses without calling the server', () => {
    const { fixture, http, el } = setup(HealthWordGameComponent);
    http.expectOne((r) => r.url === '/api/v1/me/play/word').flush(word());
    fixture.detectChanges();
    for (const key of ['h', 'e', 'a']) document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(Array.from(el.querySelectorAll('[data-word-tile]')).slice(0, 5).map((t) => t.textContent?.trim()).join('')).toBe('HE');
    http.expectNone('/api/v1/me/play/word/guesses');
  });
});

describe('Play page', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lists my challenges and creates a new one, then opens it with the invite', () => {
    const { fixture, http, el } = setup(PlayPageComponent);
    http.expectOne((r) => r.url === '/api/v1/me/play/word').flush(word());
    http.expectOne((r) => r.url === '/api/v1/me/play/challenges').flush({
      today: '2026-10-03',
      challenges: [{ ...detail(), myRank: 2, myScore: 0, doneToday: false, leader: { name: 'Kofi M.', score: 20, isMe: false } }],
    });
    http.expectOne((r) => r.url === '/api/v1/me/play/friends/week').flush({ weekStart: '2026-09-28', weekEnd: '2026-10-04', friends: 1, board: detail().board });
    fixture.detectChanges();
    expect(el.querySelector('[data-challenge="MNWA2E5C"]')!.textContent).toContain('Health Word battle');
    expect(el.querySelector('[data-challenge="MNWA2E5C"]')!.textContent).toContain('#2');
    expect(el.querySelector('[data-friends-week]')!.textContent).toContain('Kofi M.');

    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (el.querySelector('[data-challenge-new]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (el.querySelector('[data-theme="QUIZ"]') as HTMLButtonElement).click();
    (el.querySelector('[data-mode="GROUP"]') as HTMLButtonElement).click();
    (el.querySelector('[data-days="14"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[data-challenge-form]')!.textContent).toContain('Never your health details');
    (el.querySelector('[data-challenge-create]') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/me/play/challenges');
    expect(req.request.body).toMatchObject({ theme: 'QUIZ', mode: 'GROUP', days: 14, startsOn: 'today' });
    req.flush(detail({ code: 'NEWCODE9', theme: 'QUIZ', mode: 'GROUP' }));
    expect(nav).toHaveBeenCalledWith(['/me/play/challenges', 'NEWCODE9'], { queryParams: { invite: 1 } });
  });
});

describe('Challenge page', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows the board and a WhatsApp invite with my referral code', () => {
    const { fixture, http, el } = setup(ChallengePageComponent, { code: 'MNWA2E5C' });
    http.expectOne((r) => r.url === '/api/v1/me/play/challenges/MNWA2E5C').flush(detail({ participants: 1, board: [detail().board[1]] }));
    http.expectOne((r) => r.url === '/api/v1/me/play/word').flush(word());
    fixture.detectChanges();
    expect(el.textContent).toContain('Started by Ada O.');
    expect(el.querySelector('[data-leaderboard]')!.textContent).toContain('Ada O.');
    const wa = decodeURIComponent((el.querySelector('[data-invite] [data-share-whatsapp]') as HTMLAnchorElement).href.split('text=')[1]);
    expect(wa).toContain('I challenge you! Health Word battle, 7 days');
    expect(wa).toMatch(/\/play\/c\/MNWA2E5C\?ref=SC-ABC123&lang=\w+&market=\w+/);
  });

  it('lets someone who was invited accept, with no board shown before joining', () => {
    const { fixture, http, el } = setup(ChallengePageComponent, { code: 'MNWA2E5C' });
    http.expectOne((r) => r.url.endsWith('/challenges/MNWA2E5C')).flush(detail({ joined: false, joinable: true, participants: 1, board: null }));
    http.expectOne((r) => r.url === '/api/v1/me/play/word').flush(word());
    fixture.detectChanges();
    expect(el.querySelector('[data-leaderboard]')).toBeNull();
    expect(el.textContent).toContain('Ada O. challenged you!');
    (el.querySelector('[data-join]') as HTMLButtonElement).click();
    http.expectOne('/api/v1/me/play/challenges/MNWA2E5C/join').flush(detail());
    fixture.detectChanges();
    expect(el.querySelector('[data-leaderboard]')!.textContent).toContain('Kofi M.');
  });
});

describe('Shared link landing', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows who invited you and sends new people to sign up, then back to the challenge, with the referral', () => {
    const { fixture, http, el } = setup(PlayInvitePageComponent, { code: 'mnwa2e5c' }, { ref: 'SC-ABC123' }, false);
    http.expectOne('/api/v1/public/play/challenges/MNWA2E5C').flush({ ...detail(), joinable: true });
    fixture.detectChanges();
    expect(el.textContent).toContain('Ada O. challenged you!');
    const href = (el.querySelector('[data-landing-register]') as HTMLAnchorElement).getAttribute('href')!;
    expect(decodeURIComponent(href)).toContain('/register?returnUrl=/me/play/challenges/MNWA2E5C&ref=SC-ABC123');
  });

  it('a Health Word share link explains the game and drops a bad referral', () => {
    const { el } = setup(PlayInvitePageComponent, {}, { ref: '<script>' }, false);
    expect(el.textContent).toContain('Can you guess today’s Health Word?');
    const href = (el.querySelector('[data-landing-register]') as HTMLAnchorElement).getAttribute('href')!;
    expect(decodeURIComponent(href)).toBe('/register?returnUrl=/me/play');
  });
});

describe('Notifications from challenges', () => {
  it('open the challenge', () => {
    const nav = new NotificationNavigationService();
    const n = { entityType: 'WELLNESS', entityReference: 'MNWA2E5C', metadata: { route: '/me/play/challenges/MNWA2E5C', kind: 'challengeJoined' } };
    expect(nav.destination(n as never, 'USER')).toEqual(['/me/play/challenges/MNWA2E5C']);
  });
});
