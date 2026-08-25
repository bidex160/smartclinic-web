import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api-config.token';
import { AdminDashboardApiService } from './admin-dashboard-api.service';
import { ProviderDashboardApiService } from './provider-dashboard-api.service';

describe('dashboard API services', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } }] }));

  it('loads the provider authoritative summary', () => {
    TestBed.inject(ProviderDashboardApiService).getSummary().subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('http://api.test/api/v1/provider/dashboard/summary');
    expect(request.request.method).toBe('GET');
    request.flush({ offers: { new: 0 }, appointments: { today: 0, upcoming: 0 }, healthChecks: { inProgress: 0, completed: 0 } });
  });

  it('loads the admin authoritative summary', () => {
    TestBed.inject(AdminDashboardApiService).getSummary().subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('http://api.test/api/v1/admin/dashboard/summary');
    expect(request.request.method).toBe('GET');
    request.flush({ bookings: { awaitingFunding: 0, pendingProviderMatch: 0, scheduled: 0, inProgress: 0, completed: 0, needsAttention: 0 }, matching: { activeOffers: 0 }, providers: { pendingReview: 0, active: 0 } });
  });
});
