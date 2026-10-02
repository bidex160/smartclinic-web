import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';

export type KidTaskKey =
  | 'brushTeethMorning' | 'brushTeethNight' | 'washHands' | 'drinkWater' | 'eatFruit' | 'eatVegetables'
  | 'playOutside' | 'bedOnTime' | 'bath' | 'tidyToys' | 'readBook' | 'helpAtHome' | 'sunHat' | 'mosquitoNet';

export const KID_TASKS: readonly { key: KidTaskKey; emoji: string }[] = [
  { key: 'brushTeethMorning', emoji: '🪥' }, { key: 'brushTeethNight', emoji: '🌙' }, { key: 'washHands', emoji: '🧼' },
  { key: 'drinkWater', emoji: '💧' }, { key: 'eatFruit', emoji: '🍌' }, { key: 'eatVegetables', emoji: '🥕' },
  { key: 'playOutside', emoji: '⚽' }, { key: 'bedOnTime', emoji: '🛏️' }, { key: 'bath', emoji: '🛁' },
  { key: 'tidyToys', emoji: '🧸' }, { key: 'readBook', emoji: '📖' }, { key: 'helpAtHome', emoji: '🧹' },
  { key: 'sunHat', emoji: '🧢' }, { key: 'mosquitoNet', emoji: '🦟' },
];

/** Pictures for each kids question's three answers (words come from the translation files). */
export const KID_QUIZ_EMOJI: Readonly<Record<string, readonly [string, string, string]>> = {
  q01: ['🥤', '🧼', '🍫'], q02: ['💧', '🥤', '🍬'], q03: ['1️⃣', '🚫', '2️⃣'], q04: ['🍭', '🥕', '🍟'], q05: ['🛏️', '🍦', '🎵'],
  q06: ['👐', '🙈', '💪'], q07: ['⏰', '🌙', '☀️'], q08: ['🍌', '🍬', '🥤'], q09: ['🧥', '🔥', '🧢'], q10: ['🛋️', '🏃', '📱'],
  q11: ['👩', '🐈', '🤐'], q12: ['🌳', '🏠', '🗑️'], q13: ['🏃', '👀', '🙈'], q14: ['🍊', '🍩', '🍪'], q15: ['🏃', '🍞', '🧼'],
  q16: ['🍬', '🪥', '🥤'], q17: ['🌬️', '😡', '👊'], q18: ['🎁', '🍭', '🛡️'], q19: ['📺', '⚽', '😴'], q20: ['🔒', '🧸', '🛋️'],
};

export interface KidView {
  readonly patientReference: string;
  readonly firstName: string;
  readonly age: number | null;
  readonly kidsCorner: boolean;
  readonly nextVisit: { key: string; dueDate: string; daysAway: number } | null;
  readonly tasks: readonly { id: string; key: KidTaskKey; doneToday: boolean }[];
  readonly stars: { today: number; total: number; level: number; nextAt: number | null } | null;
  readonly quiz: { questionId: string; answered: { choiceIndex: number; correct: boolean; correctIndex: number } | null } | null;
}

export interface FamilyOverview {
  readonly today: string;
  readonly familyStreak: { current: number; best: number; activeToday: boolean };
  readonly children: readonly KidView[];
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';

@Injectable({ providedIn: 'root' })
export class FamilyKidsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG).baseUrl}/me/family`;

  overview() {
    return this.http.get<FamilyOverview>(this.base, { params: { timezone: tz() } });
  }
  child(ref: string) {
    return this.http.get<KidView>(`${this.base}/kids/${encodeURIComponent(ref)}`, { params: { timezone: tz() } });
  }
  addTask(ref: string, taskKey: KidTaskKey) {
    return this.http.post<KidView>(`${this.base}/kids/${encodeURIComponent(ref)}/tasks`, { taskKey, timezone: tz() });
  }
  removeTask(ref: string, taskId: string) {
    return this.http.delete<KidView>(`${this.base}/kids/${encodeURIComponent(ref)}/tasks/${taskId}`, { params: { timezone: tz() } });
  }
  done(ref: string, taskId: string) {
    return this.http.post<KidView>(`${this.base}/kids/${encodeURIComponent(ref)}/tasks/${taskId}/done`, { timezone: tz() });
  }
  undo(ref: string, taskId: string) {
    return this.http.delete<KidView>(`${this.base}/kids/${encodeURIComponent(ref)}/tasks/${taskId}/done`, { params: { timezone: tz() } });
  }
  answer(ref: string, questionId: string, choiceIndex: number) {
    return this.http.post<KidView>(`${this.base}/kids/${encodeURIComponent(ref)}/quiz/answers`, { questionId, choiceIndex, timezone: tz() });
  }
}

export interface NudgeSettings {
  readonly enabled: boolean;
  readonly localTime: string;
  readonly timezone: string;
  readonly language: string;
  readonly whatsapp: boolean;
  readonly whatsappAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class NudgesApiService {
  // Optional so the app shell can sync language quietly even where no API is configured (tests).
  private readonly http = inject(HttpClient, { optional: true });
  private readonly base = (inject(API_CONFIG, { optional: true })?.baseUrl ?? '') + '/me/nudges';

  get() {
    return this.http!.get<NudgeSettings>(this.base);
  }
  update(patch: Partial<Omit<NudgeSettings, 'whatsappAvailable'>>) {
    return this.http!.patch<NudgeSettings>(this.base, patch);
  }
  available(): boolean {
    return Boolean(this.http) && this.base !== '/me/nudges';
  }
}
