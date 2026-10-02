import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, throwError } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { AppLanguage } from './locale-preferences.service';

export type CompanionCharacter = 'ayo' | 'zainab' | 'kito';
export type CompanionTopic = 'welcome' | 'stay-well' | 'find-care' | 'hospital' | 'appointments' | 'passport' | 'network' | 'points' | 'know-numbers';

export interface CompanionAnswer {
  readonly title: string;
  readonly body: string;
  readonly route: string | null;
  readonly action: string | null;
  readonly urgent: boolean;
  readonly language: AppLanguage;
}

export interface CompanionCapabilities {
  /** Smart answers (any question, any language) are switched on. */
  readonly answers: boolean;
  /** Languages with a natural voice on this deployment. */
  readonly voices: Partial<Record<AppLanguage, boolean>>;
}

export interface AskRequest {
  readonly language: AppLanguage;
  readonly character: CompanionCharacter;
  readonly question?: string;
  readonly topic?: CompanionTopic;
  readonly page?: string;
  readonly country?: string;
  readonly signedIn?: boolean;
}

const NONE: CompanionCapabilities = { answers: false, voices: {} };

@Injectable({ providedIn: 'root' })
export class CompanionApiService {
  // Optional so the companion still works (with built-in answers) where no API is configured.
  private readonly http = inject(HttpClient, { optional: true });
  private readonly base = inject(API_CONFIG, { optional: true })?.baseUrl ?? '';
  private capabilities$?: Observable<CompanionCapabilities>;

  capabilities(): Observable<CompanionCapabilities> {
    this.capabilities$ ??= this.http && this.base
      ? this.http.get<CompanionCapabilities>(`${this.base}/public/companion/capabilities`).pipe(
          catchError(() => of(NONE)),
          shareReplay({ bufferSize: 1, refCount: false }),
        )
      : of(NONE);
    return this.capabilities$;
  }

  ask(request: AskRequest): Observable<CompanionAnswer> {
    if (!this.http || !this.base) return throwError(() => new Error('offline'));
    return this.http.post<CompanionAnswer>(`${this.base}/public/companion/answers`, request);
  }

  /** Audio for the text in a natural voice; errors mean "read it instead". */
  speech(text: string, language: AppLanguage, character: CompanionCharacter, country?: string): Observable<Blob> {
    if (!this.http || !this.base) return throwError(() => new Error('offline'));
    return this.http
      .post(`${this.base}/public/companion/speech`, { text: text.slice(0, 700), language, character, ...(country ? { country } : {}) }, { responseType: 'blob' })
      .pipe(map((blob) => blob));
  }
}
