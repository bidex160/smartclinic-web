import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { FulfilmentMode } from '../models/fulfilment-mode.model';
import { FulfilmentModesApiService } from './fulfilment-modes-api.service';

describe('FulfilmentModesApiService', () => {
  let service: FulfilmentModesApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } },
      ],
    });
    service = TestBed.inject(FulfilmentModesApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('returns the typed fulfilment response from the configured API', () => {
    const response: FulfilmentMode[] = [
      { id: 'mode-id', code: 'API_MODE', name: 'API mode', isActive: true },
    ];

    service.getFulfilmentModes().subscribe((modes) => expect(modes).toEqual(response));

    const request = httpTesting.expectOne('http://api.example.test/api/v1/fulfilment-modes');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });
});
