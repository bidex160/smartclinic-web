import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, shareReplay } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';

export type SupportTopic = 'BOOK_CHECKUP' | 'SEE_DOCTOR' | 'TEST_OR_RESULTS' | 'MEDICINE' | 'PAYMENT' | 'ACCOUNT' | 'OTHER';
export type SupportCallbackTime = 'ANYTIME' | 'MORNING' | 'AFTERNOON' | 'EVENING';
export type SupportCallbackStatus = 'OPEN' | 'CALLED' | 'CLOSED';

export interface SupportContact {
  readonly phone: string | null;
  readonly whatsapp: string | null;
  readonly hours: string | null;
}
export interface SupportContacts {
  readonly default: SupportContact;
  readonly countries: Readonly<Record<string, SupportContact>>;
}
export interface SupportCallbackRequest {
  readonly name: string;
  readonly phone: string;
  readonly countryCode?: string;
  readonly topic: SupportTopic;
  readonly preferredTime?: SupportCallbackTime;
  readonly message?: string;
}
export interface SupportCallbackView {
  readonly reference: string;
  readonly name: string;
  readonly phone: string;
  readonly countryCode: string | null;
  readonly topic: SupportTopic;
  readonly preferredTime: SupportCallbackTime;
  readonly message: string | null;
  readonly status: SupportCallbackStatus;
  readonly hasAccount: boolean;
  readonly handledAt: string | null;
  readonly staffNote: string | null;
  readonly createdAt: string;
}

const NO_CONTACTS: SupportContacts = { default: { phone: null, whatsapp: null, hours: null }, countries: {} };

@Injectable({ providedIn: 'root' })
export class SupportApiService {
  // Optional so screens that embed the help card still render where no API is configured (tests, previews).
  private readonly http = inject(HttpClient, { optional: true });
  private readonly base = inject(API_CONFIG, { optional: true })?.baseUrl ?? '';
  private contacts$?: Observable<SupportContacts>;

  /** Loaded once per visit. If it fails, the call and WhatsApp buttons simply stay hidden. */
  contacts(): Observable<SupportContacts> {
    this.contacts$ ??= this.http && this.base
      ? this.http
          .get<SupportContacts>(`${this.base}/public/support/contact`)
          .pipe(catchError(() => of(NO_CONTACTS)), shareReplay({ bufferSize: 1, refCount: false }))
      : of(NO_CONTACTS);
    return this.contacts$;
  }

  requestCallback(request: SupportCallbackRequest) {
    return this.client().post<{ reference: string; status: SupportCallbackStatus; preferredTime: SupportCallbackTime }>(
      `${this.base}/public/support/callback-requests`,
      request,
    );
  }

  listCallbacks(status: SupportCallbackStatus | '' = 'OPEN', page = 1) {
    const params: Record<string, string> = { page: String(page), limit: '30' };
    if (status) params['status'] = status;
    return this.client().get<{ items: SupportCallbackView[]; page: number; totalPages: number; total: number }>(
      `${this.base}/admin/support/callback-requests`,
      { params },
    );
  }

  private client(): HttpClient {
    if (!this.http) throw new Error('HttpClient is not available');
    return this.http;
  }

  updateCallback(reference: string, status: SupportCallbackStatus, staffNote?: string) {
    return this.client().patch<SupportCallbackView>(
      `${this.base}/admin/support/callback-requests/${encodeURIComponent(reference)}`,
      { status, ...(staffNote !== undefined ? { staffNote } : {}) },
    );
  }
}

/** The country to use for help numbers when we don't know the person's country: from their clock. */
export function countryFromTimezone(timezone = Intl.DateTimeFormat().resolvedOptions().timeZone): 'NG' | 'GH' | 'RW' {
  if (timezone === 'Africa/Accra') return 'GH';
  if (timezone === 'Africa/Kigali') return 'RW';
  return 'NG';
}

/** wa.me wants digits only. */
export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}
