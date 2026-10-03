import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';

export type LanguageFeedbackStatus = 'OPEN' | 'FIXED' | 'DISMISSED';

export interface LanguageFeedbackItem {
  readonly id: string;
  readonly language: string;
  readonly shownText: string;
  readonly suggestion: string | null;
  readonly page: string | null;
  readonly catalogKeys: readonly string[];
  readonly status: LanguageFeedbackStatus;
  readonly createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageFeedbackApiService {
  // Optional, because the language menu is on every screen, including ones built without HTTP in tests.
  private readonly http = inject(HttpClient, { optional: true })!;
  private readonly base = inject(API_CONFIG, { optional: true })?.baseUrl ?? '';

  send(input: { language: string; shownText: string; suggestion?: string; page?: string; catalogKeys?: readonly string[] }): Observable<{ id: string; received: boolean }> {
    if (!this.http) return throwError(() => new Error('offline'));
    return this.http.post<{ id: string; received: boolean }>(`${this.base}/public/language-feedback`, input);
  }
  list(status?: LanguageFeedbackStatus, language?: string) {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    if (language) params['language'] = language;
    return this.http.get<{ items: readonly LanguageFeedbackItem[]; openByLanguage: Record<string, number> }>(`${this.base}/admin/language-feedback`, { params });
  }
  update(id: string, status: LanguageFeedbackStatus) {
    return this.http.patch<LanguageFeedbackItem>(`${this.base}/admin/language-feedback/${id}`, { status });
  }
}
