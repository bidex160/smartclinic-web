import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_CONFIG } from '../config/api-config.token';
import { CreatedApiKey, IntegrationsOverview, ProviderApiKeyView, WebhookDeliveryView, WebhookSaveResult } from '../models/provider-integrations.model';

/** API keys and webhooks for connecting a facility's own system. */
@Injectable({ providedIn: 'root' })
export class ProviderIntegrationsApiService {
  private readonly http = inject(HttpClient);
  readonly base = inject(API_CONFIG).baseUrl;

  overview() {
    return this.http.get<IntegrationsOverview>(`${this.base}/provider/integrations`);
  }

  createKey(name: string) {
    return this.http.post<CreatedApiKey>(`${this.base}/provider/integrations/api-keys`, { name });
  }

  revokeKey(id: string) {
    return this.http.delete<ProviderApiKeyView>(`${this.base}/provider/integrations/api-keys/${encodeURIComponent(id)}`);
  }

  saveWebhook(url: string, rotateSecret = false) {
    return this.http.put<WebhookSaveResult>(`${this.base}/provider/integrations/webhook`, { url, rotateSecret });
  }

  removeWebhook() {
    return this.http.delete<{ removed: true }>(`${this.base}/provider/integrations/webhook`);
  }

  testWebhook() {
    return this.http.post<{ items: readonly WebhookDeliveryView[] }>(`${this.base}/provider/integrations/webhook/test`, {});
  }
}
