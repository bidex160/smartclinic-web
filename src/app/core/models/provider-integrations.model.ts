export interface ProviderApiKeyView {
  readonly id: string;
  readonly name: string;
  readonly keyPrefix: string;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
  readonly revokedAt: string | null;
}

/** Returned once, when a key is created. */
export interface CreatedApiKey extends ProviderApiKeyView {
  readonly key: string;
}

export interface ProviderWebhookView {
  readonly url: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WebhookSaveResult {
  readonly url: string;
  readonly isActive: boolean;
  /** Only when a secret was created (first save or rotate). */
  readonly signingSecret: string | null;
}

export interface WebhookDeliveryView {
  readonly id: string;
  readonly eventType: string;
  readonly status: 'PENDING' | 'DELIVERED' | 'FAILED';
  readonly attemptCount: number;
  readonly lastStatusCode: number | null;
  readonly createdAt: string;
  readonly deliveredAt: string | null;
}

export interface IntegrationsOverview {
  readonly apiKeys: readonly ProviderApiKeyView[];
  readonly webhook: ProviderWebhookView | null;
  readonly webhooksAvailable: boolean;
  readonly deliveries: readonly WebhookDeliveryView[];
}
