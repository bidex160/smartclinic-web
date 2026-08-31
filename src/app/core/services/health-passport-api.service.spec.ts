import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { HealthPassportApiService } from './health-passport-api.service';

describe('HealthPassportApiService', () => {
  let api: HealthPassportApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    api = TestBed.inject(HealthPassportApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('loads the overview without persisting clinical data', () => {
    api.overview().subscribe();
    expect(http.expectOne('/api/v1/me/health-passport').request.method).toBe('GET');
  });
  it('paginates timeline through the exact query contract', () => {
    api.timeline(2, 10).subscribe();
    const request = http.expectOne((r) => r.url === '/api/v1/me/health-passport/timeline');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('10');
  });
});
