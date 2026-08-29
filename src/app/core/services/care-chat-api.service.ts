import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api-config.token';
import { CareChatDetail, CareChatMessage, CareChatMessagesPage, CareChatScope, CareMessageAttachment, CareMessageAttachmentAccess } from '../models/find-care.model';

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
    body?: string,
    attachmentReferences: readonly string[] = [],
  ): Observable<CareChatMessage> {
    const request: { body?: string; attachmentReferences?: readonly string[] } = {};
    if (body) request.body = body;
    if (attachmentReferences.length) request.attachmentReferences = attachmentReferences;
    return this.http.post<CareChatMessage>(`${this.url(scope, careRequestReference)}/messages`, request);
  }
  uploadPatientAttachment(reference: string, file: File) { return this.upload('patient', reference, file); }
  uploadProviderAttachment(reference: string, file: File) { return this.upload('provider', reference, file); }
  getPatientAttachmentAccess(reference: string, messageReference: string, attachmentReference: string) { return this.access('patient', reference, messageReference, attachmentReference); }
  getProviderAttachmentAccess(reference: string, messageReference: string, attachmentReference: string) { return this.access('provider', reference, messageReference, attachmentReference); }
  markRead(scope: CareChatScope, careRequestReference: string): Observable<void> {
    return this.http.post<void>(`${this.url(scope, careRequestReference)}/read`, null);
  }
  private url(scope: CareChatScope, reference: string): string {
    const prefix = scope === 'patient' ? 'me' : 'provider';
    return `${this.base}/${prefix}/care-requests/${encodeURIComponent(reference)}/chat`;
  }
  private upload(scope: CareChatScope, reference: string, file: File): Observable<CareMessageAttachment> {
    const formData = new FormData(); formData.append('file', file);
    return this.http.post<CareMessageAttachment>(`${this.url(scope, reference)}/attachments`, formData);
  }
  private access(scope: CareChatScope, reference: string, messageReference: string, attachmentReference: string): Observable<CareMessageAttachmentAccess> {
    return this.http.get<CareMessageAttachmentAccess>(`${this.url(scope, reference)}/messages/${encodeURIComponent(messageReference)}/attachments/${encodeURIComponent(attachmentReference)}/access`);
  }
}
