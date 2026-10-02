import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { EngagementOverview, QuizAnswerResult } from '../models/engagement.model';

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';

@Injectable({ providedIn: 'root' })
export class EngagementApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  /** Latest numbers, shared so the dashboard, passport and progress page agree after a quiz answer. */
  readonly latest = signal<EngagementOverview | null>(null);

  overview(): Observable<EngagementOverview> {
    return this.http
      .get<EngagementOverview>(`${this.base}/me/engagement`, { params: { timezone: timezone() } })
      .pipe(tap((value) => this.latest.set(value)));
  }

  answerQuiz(questionId: string, choiceIndex: number): Observable<QuizAnswerResult> {
    return this.http
      .post<QuizAnswerResult>(`${this.base}/me/engagement/quiz/answers`, { questionId, choiceIndex, timezone: timezone() })
      .pipe(tap(({ pointsEarned: _ignored, ...summary }) => this.latest.update((prev) => (prev ? { ...prev, ...summary } : prev))));
  }
}
