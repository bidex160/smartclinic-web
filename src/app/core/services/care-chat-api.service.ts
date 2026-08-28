import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { CareChatDetail, CareChatMessagesPage, CareChatScope } from '../models/find-care.model';

@Injectable({ providedIn: 'root' })
export class CareChatApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_CONFIG).baseUrl;

  getChat(scope: CareChatScope, careRequestReference: string): Observable<CareChatDetail> {
    return this.http.get<CareChatDetail>(this.url(scope, careRequestReference));
  }
  getMessages(
    scope: CareChatScope,
    careRequestReference: string,
    page = 1,
    limit = 30,
  ): Observable<CareChatMessagesPage> {
    return this.http.get<CareChatMessagesPage>(
      `${this.url(scope, careRequestReference)}/messages`,
      { params: new HttpParams().set('page', page).set('limit', limit) },
    );
  }
  sendMessage(
    scope: CareChatScope,
    careRequestReference: string,
    body: string,
  ): Observable<CareChatMessagesPage | unknown> {
    return this.http.post(`${this.url(scope, careRequestReference)}/messages`, { body });
  }
  markRead(scope: CareChatScope, careRequestReference: string): Observable<void> {
    return this.http.post<void>(`${this.url(scope, careRequestReference)}/read`, null);
  }
  private url(scope: CareChatScope, reference: string): string {
    const prefix = scope === 'patient' ? 'me' : 'provider';
    return `${this.base}/${prefix}/care-requests/${encodeURIComponent(reference)}/chat`;
  }
}
