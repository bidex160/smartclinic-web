import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';
import { LocalePreferencesService } from './locale-preferences.service';

export type LetterMark = 'hit' | 'near' | 'miss';
export type WordCategory = 'body' | 'food' | 'move' | 'care' | 'mind';
export type ChallengeTheme = 'ALL_ROUND' | 'WORD' | 'QUIZ' | 'ACTIVE_DAYS';
export type ChallengeMode = 'DUEL' | 'GROUP';
export type ChallengeStatus = 'upcoming' | 'live' | 'ended';

export const CHALLENGE_THEMES: readonly { theme: ChallengeTheme; emoji: string }[] = [
  { theme: 'ALL_ROUND', emoji: '🌟' },
  { theme: 'WORD', emoji: '🔤' },
  { theme: 'QUIZ', emoji: '🧠' },
  { theme: 'ACTIVE_DAYS', emoji: '🏃' },
];
export const CHALLENGE_DAYS = [3, 7, 14, 30] as const;

export interface HealthWordView {
  readonly localDate: string;
  readonly puzzleNumber: number;
  readonly length: number;
  readonly maxGuesses: number;
  readonly category: WordCategory;
  readonly started: boolean;
  readonly startedAt: string | null;
  readonly rows: readonly { guess: string; marks: readonly LetterMark[] }[];
  readonly finished: boolean;
  readonly solved: boolean;
  readonly seconds: number;
  readonly answer: string | null;
  readonly fact: string | null;
  readonly pointsEarned: number;
  readonly stats: { played: number; solved: number; streak: number; distribution: readonly number[] };
  readonly inviteCode: string | null;
}

export interface ChallengeSummary {
  readonly code: string;
  readonly theme: ChallengeTheme;
  readonly mode: ChallengeMode;
  readonly days: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: ChallengeStatus;
  readonly daysLeft: number;
  readonly participants: number;
  readonly maxParticipants: number;
}

export interface MyChallenge extends ChallengeSummary {
  readonly myRank: number | null;
  readonly myScore: number;
  readonly doneToday: boolean;
  readonly leader: { name: string; score: number; isMe: boolean } | null;
}

export interface BoardRow {
  readonly name: string;
  readonly score: number;
  readonly rank: number;
  readonly daysActive: number;
  readonly doneToday: boolean;
  readonly isMe: boolean;
}

export interface ChallengeDetail extends ChallengeSummary {
  readonly joined: boolean;
  readonly joinable: boolean;
  readonly isCreator: boolean;
  readonly creatorName: string;
  readonly rules: { maxPerDay: number; describe: string };
  readonly board: readonly BoardRow[] | null;
}

export interface ChallengePreview extends ChallengeSummary {
  readonly creatorName: string;
  readonly joinable: boolean;
}

export interface FriendsWeek {
  readonly weekStart: string;
  readonly weekEnd: string;
  readonly friends: number;
  readonly board: readonly BoardRow[];
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';

@Injectable({ providedIn: 'root' })
export class PlayApiService {
  private readonly http = inject(HttpClient);
  private readonly locale = inject(LocalePreferencesService);
  private readonly api = inject(API_CONFIG).baseUrl;
  private readonly base = `${this.api}/me/play`;

  private ctx() {
    return { timezone: tz(), language: this.locale.language() };
  }

  word() {
    return this.http.get<HealthWordView>(`${this.base}/word`, { params: this.ctx() });
  }
  startWord() {
    return this.http.post<HealthWordView>(`${this.base}/word/start`, this.ctx());
  }
  guess(guess: string) {
    return this.http.post<HealthWordView>(`${this.base}/word/guesses`, { guess, ...this.ctx() });
  }
  challenges() {
    return this.http.get<{ today: string; challenges: readonly MyChallenge[] }>(`${this.base}/challenges`, { params: { timezone: tz() } });
  }
  createChallenge(input: { theme: ChallengeTheme; mode: ChallengeMode; days: number; startsOn: 'today' | 'tomorrow' }) {
    return this.http.post<ChallengeDetail>(`${this.base}/challenges`, { ...input, timezone: tz() });
  }
  challenge(code: string) {
    return this.http.get<ChallengeDetail>(`${this.base}/challenges/${encodeURIComponent(code)}`, { params: { timezone: tz() } });
  }
  join(code: string) {
    return this.http.post<ChallengeDetail>(`${this.base}/challenges/${encodeURIComponent(code)}/join`, { timezone: tz() });
  }
  leave(code: string) {
    return this.http.delete<{ left: boolean }>(`${this.base}/challenges/${encodeURIComponent(code)}/participation`);
  }
  friendsWeek() {
    return this.http.get<FriendsWeek>(`${this.base}/friends/week`, { params: { timezone: tz() } });
  }
  preview(code: string) {
    return this.http.get<ChallengePreview>(`${this.api}/public/play/challenges/${encodeURIComponent(code)}`);
  }
}

const SQUARE: Record<LetterMark, string> = { hit: '🟩', near: '🟨', miss: '⬜' };

/** The coloured grid people share. Shows how you did, never the word. */
export function shareGrid(rows: readonly { marks: readonly LetterMark[] }[]): string {
  return rows.map((r) => r.marks.map((m) => SQUARE[m]).join('')).join('\n');
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** Best state seen for each letter, for colouring the keyboard. */
export function letterStates(rows: readonly { guess: string; marks: readonly LetterMark[] }[]): Record<string, LetterMark> {
  const rank: Record<LetterMark, number> = { miss: 0, near: 1, hit: 2 };
  const out: Record<string, LetterMark> = {};
  for (const r of rows) {
    r.guess.split('').forEach((ch, i) => {
      const m = r.marks[i];
      if (!out[ch] || rank[m] > rank[out[ch]]) out[ch] = m;
    });
  }
  return out;
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
