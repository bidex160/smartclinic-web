import { Injectable, signal } from '@angular/core';
import { CreateCareRequest } from '../models/find-care.model';
@Injectable({ providedIn: 'root' })
export class CareRequestIntentService {
  private readonly value = signal<CreateCareRequest | null>(null);
  readonly intent = this.value.asReadonly();
  save(intent: CreateCareRequest) {
    this.value.set(intent);
  }
  take() {
    const intent = this.value();
    this.value.set(null);
    return intent;
  }
  clear() {
    this.value.set(null);
  }
}
