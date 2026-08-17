import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config.token';
import { FulfilmentMode } from '../models/fulfilment-mode.model';

@Injectable({ providedIn: 'root' })
export class FulfilmentModesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  getFulfilmentModes(): Observable<FulfilmentMode[]> {
    return this.http.get<FulfilmentMode[]>(`${this.apiConfig.baseUrl}/fulfilment-modes`);
  }
}
